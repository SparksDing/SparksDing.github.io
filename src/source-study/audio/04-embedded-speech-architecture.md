---
title: 设备端音频（四）：端侧语音架构与性能调优
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 端侧
  - 实时系统
  - 性能调优
  - NEON
  - 功耗
---

> 本文是「设备端音频与语音处理」系列第 4 篇（共 7 篇）。系列导览：[从 pipeline 到 Linux 音频栈](/source-study/audio/)。

把语音前端放进真实设备：VoIP、远场助手、会议、媒体播放四类场景的分层与数据流；实时线程、无锁缓冲、perf/ftrace/cyclictest、NEON/定点、功耗与量产问题。

这一篇更偏工程：怎么让算法在目标板上稳定跑住，而不只是「能跑」。

<!-- more -->

## 4. 端侧语音处理架构与性能调优

### 4.1 分层架构与典型数据流

**分层**：

```text
┌─────────────────────────────────────────────┐
│ 应用层：ASR / 唤醒词 / 通话 / 录音 / 媒体播放      │
├─────────────────────────────────────────────┤
│ 语音前端（AFE）：HPF → BF → AEC → NS → AGC → VAD │
├─────────────────────────────────────────────┤
│ 音频服务：ALSA-lib / tinyalsa / PulseAudio      │
├─────────────────────────────────────────────┤
│ 内核：ASoC / DMA / clock / power                 │
├─────────────────────────────────────────────┤
│ 硬件：SoC I2S/PDM、Codec、功放、麦克风阵列         │
└─────────────────────────────────────────────┘
```

**场景一：VoIP 通话（双向、强实时）**

```text
麦克风 → HPF → AEC（参考=远端下行）→ NS → AGC → Opus 编码 → 网络
网络 → jitter buffer → Opus 解码 → 混音 → 扬声器
```

- AEC 是核心，参考信号必须与扬声器实际播放严格对齐。
- 延迟预算 60—150 ms；蓝牙耳机链路更紧。
- 双讲不能断字，NLP 要保守。

**场景二：远场语音助手（唤醒 + ASR）**

```text
4/6 麦 → PDM → 抽取 → BF（DOA）→ AEC → NS → AGC → VAD → KWS → ASR
```

- 唤醒词常驻低功耗 DSP，主核休眠。
- 唤醒后开主链路，波束指向说话人。
- 延迟可放宽（100—300 ms），但误唤醒率和功耗是硬指标。

**场景三：录音/会议**

```text
多麦 → BF → 去混响 → NS → AGC → 多轨/混音 → 编码/存储
```

- 更看重音质与可懂度，可用更复杂的算法和更长帧。
- 需要处理削波、风噪、桌子振动。

**场景四：媒体播放**

```text
解码 → 混音 → 音量 → 限幅 → SRC → ALSA → DAC → 功放
```

- 重点是音质、pop、SRC 质量、多路混音不削波。

**always-on 唤醒词架构**：

- 一级 KWS 跑在 DSP/低功耗核，只做「疑似唤醒」检测，功耗 < 1—2 mW。
- 二级 KWS 在主核复核，降低误唤醒。
- 麦克风常开，需要低噪声 LDO、PDM 时钟门控、DMA 小缓冲。

**异构划分**：

| 任务 | 适合的核 | 原因 |
| --- | --- | --- |
| AEC/NS/BF | DSP（HiFi/Hexagon/CEVA） | 定点高效、实时性好、省主核 |
| 唤醒词 | 低功耗 DSP/NPU | 常开、极低功耗 |
| 大模型 NS/ASR | 主核 + NPU | 算力需求大 |
| 控制/路由 | 主核 | 逻辑复杂 |

### 4.2 实时性设计

音频线程是**软实时**：错过一个 period 就是 xrun（可听见的爆音/卡顿）。目标是**最坏情况延迟（WCET）可控**，而不是平均吞吐。

**线程与调度**：

```c
struct sched_param sp = { .sched_priority = 20 };
pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp);
mlockall(MCLK_CURRENT | MCLK_FUTURE);   /* 锁内存，避免 page fault */
```

- 音频线程优先级通常 **10—30**；IRQ 线程 50—90；不要用 99（会饿死内核线程）。
- `SCHED_FIFO` 无时间片，同级按 FIFO；确保不会死循环。
- 避免优先级反转：用带优先级继承的 mutex（`PTHREAD_PRIO_INHERIT`），或干脆无锁。
- 关键线程绑核（`sched_setaffinity`），避免迁移带来的 cache 抖动。

**回调里绝对不能做的事**：

- `malloc/free`、`new/delete`（可能拿锁、触发 page fault）。
- `printf/fprintf`、syslog（I/O 阻塞）。
- 文件/网络 I/O、`sleep`。
- 大块 `memcpy`（可接受，但要评估）。
- 加锁等待（尤其与低优先级线程共享）。
- 浮点异常/除零（提前检查）。

**无锁环形缓冲（单生产者单消费者）**：

```c
typedef struct {
    float *buf;
    size_t  size;          /* 2 的幂 */
    _Atomic size_t w, r;
} ring_t;

static inline size_t ring_write(ring_t *q, const float *src, size_t n)
{
    size_t w = atomic_load_explicit(&q->w, memory_order_relaxed);
    size_t r = atomic_load_explicit(&q->r, memory_order_acquire);
    size_t space = q->size - (w - r);
    if (n > space) n = space;
    for (size_t i = 0; i < n; i++)
        q->buf[(w + i) & (q->size - 1)] = src[i];
    atomic_store_explicit(&q->w, w + n, memory_order_release);
    return n;
}
```

要点：读写指针单调递增、用掩码取模、acquire/release 保证可见性、容量取 2 的幂。

**PREEMPT_RT**：

- 把大部分内核临界区变成可抢占，降低最坏调度延迟。
- 中断线程化（`devm_request_threaded_irq`），音频 IRQ 线程可设优先级。
- 关中断/关抢占区间仍会造成抖动，需要 `cyclictest` 验证。
- 不是万能药：驱动里的长临界区、DMA 回调、电源管理仍可能引入 ms 级抖动。

**其他**：

- `CONFIG_HZ`、`NO_HZ_FULL`、CPU isolation（`isolcpus`）减少干扰。
- 关闭 CPU 调频的激进策略（`performance` governor）可降低抖动，代价是功耗。
- 避免在音频线程里触发频率切换/热插拔。

### 4.3 性能剖析工具链

| 目的 | 工具 | 关键用法 |
| --- | --- | --- |
| CPU 热点 | `perf` | `perf top -p <pid>`、`perf record -g`、`perf report` |
| 调度延迟 | `perf sched` | `perf sched latency`、`perf sched record` |
| 函数耗时 | `ftrace` | `function_graph`、`set_ftrace_filter=snd_pcm_*` |
| 系统级跟踪 | `trace-cmd` | `trace-cmd record -p function_graph -g 'snd_*'` |
| 实时性 | `cyclictest` | `cyclictest -t -p80 -n -i1000 -l10000` |
| 硬件延迟 | `hwlatdetect` | 检测 SMI/固件引起的停顿 |
| 中断分布 | `/proc/interrupts` | 看 I2S/DMA 中断是否集中在一个核 |
| 功耗 | `powertop`、`turbostat` | 看 C-state、频率、唤醒源 |
| 内存 | `valgrind --tool=massif`、`heaptrack` | 找实时线程里的分配 |
| 系统调用 | `strace -T` | 看 ioctl/read 的耗时 |

**perf 示例**：

```bash
perf record -F 999 -g -p $(pidof my_audio_app) -- sleep 10
perf report --stdio | head -50
perf stat -e cycles,instructions,cache-misses,branch-misses -p <pid> -- sleep 5
```

**ftrace 示例**：

```bash
cd /sys/kernel/debug/tracing
echo function_graph > current_tracer
echo 'snd_pcm_*' > set_ftrace_filter
echo 1 > tracing_on
# 跑一段音频
echo 0 > tracing_on
cat trace | head -100
```

**cyclictest 示例**：

```bash
cyclictest -t -p80 -n -i1000 -l10000 -m
# 关注 Max Latency；音频场景希望 < 200 us（RT 内核），普通内核可能 1—5 ms
```

### 4.4 优化手段与顺序

**先测量，再优化**。推荐顺序：

1. **算法层**：降采样、缩短滤波器、减少 FFT 点数、用子带/稀疏、模型量化/剪枝。
2. **数据层**：定点化、减少内存带宽、合并循环、避免重复计算。
3. **指令层**：NEON/SIMD、查表、SIMD 友好的数据布局（planar）。
4. **系统层**：绑核、优先级、DMA 零拷贝、缓存友好、减少唤醒。
5. **硬件层**：DSP offload、NPU、更大 cache、独立 SRAM。

**NEON 示例（FIR 单点内积，卷积的内层循环）**：

```c
#include <arm_neon.h>

float dot_neon(const float *x, const float *h, int n)
{
    float32x4_t acc = vdupq_n_f32(0.0f);
    for (int i = 0; i + 4 <= n; i += 4) {
        float32x4_t xv = vld1q_f32(x + i);
        float32x4_t hv = vld1q_f32(h + i);
        acc = vmlaq_f32(acc, xv, hv);      /* acc += xv * hv */
    }
    float32x2_t s = vadd_f32(vget_low_f32(acc), vget_high_f32(acc));
    return vget_lane_f32(vpadd_f32(s, s), 0);
}
```

注意：AArch64 可用 `vaddvq_f32` 一次求和；AArch32 用上面的成对加法。实时 FIR 通常用「块处理 + 多相」进一步减少开销。

**定点 Q15 示例**：

```c
static inline int16_t q15_mul(int16_t a, int16_t b)
{
    int32_t p = (int32_t)a * b + 0x4000;   /* 四舍五入 */
    p >>= 15;
    if (p > 32767)  p = 32767;
    if (p < -32768) p = -32768;
    return (int16_t)p;
}
```

**定点 vs 浮点**：

| 维度 | 定点（Q15/Q31） | 浮点 |
| --- | --- | --- |
| 功耗/面积 | 低 | 高 |
| 动态范围 | 需精心定标，易溢出/底噪 | 大，开发快 |
| 确定性 | 完全确定 | 受舍入/denormal 影响 |
| SIMD | NEON 整数乘加高效 | NEON 浮点也快（A55+） |
| 适用 | DSP、低端 MCU、量产 | 主核、算法原型 |

**denormal 处理**：极小浮点数会让 CPU 进入慢路径。启用 flush-to-zero：

```c
/* AArch64 */
uint64_t fpcr;
__asm__ volatile("mrs %0, fpcr" : "=r"(fpcr));
fpcr |= (1ULL << 24);                 /* FZ */
__asm__ volatile("msr fpcr, %0" :: "r"(fpcr));
```

或给滤波器状态注入极小的抖动噪声，避免长时间静音后状态衰减到 denormal 区间。

**CPU 预算参考**（16 kHz 单通道，Cortex-A53 单核，量级）：

| 模块 | CPU 占用 |
| --- | --- |
| HPF / DC | < 0.5% |
| 4 麦波束成形 | 5—15% |
| AEC（200 ms 尾长，PBFDAF） | 5—15% |
| NS（STFT + 传统） | 3—8% |
| NS（轻量 DNN） | 10—30% |
| AGC + VAD | 1—3% |
| Opus 编码（16 kHz） | 2—5% |

合计 20—50% 单核；48 kHz 全带宽通常再翻 1.5—2 倍。**留 30% 余量**给突发和系统抖动。

**功耗优化**：

- 常开 KWS 放 DSP，主核深度睡眠。
- 批处理/合并唤醒，减少 CPU 进出 C-state。
- 动态降采样（安静时 8 kHz，检测到语音切 16 kHz）。
- 关闭未用麦克风/通道。
- 选择低功耗 codec 与 Class-D 功放，注意静态电流。
- 温度高时降频会引发 xrun，要留余量。

### 4.5 测试、验证与量产问题

**延迟测试**：

- 环回（loopback）：播放脉冲 → 录音，测峰值间隔，减去已知 buffer。
- `latmus`（alsa-tools）测 ALSA 往返。
- 示波器/逻辑分析仪测 BCLK/LRCLK 与模拟输出的相位。
- 端到端：人工嘴 + 人工耳，测 mouth-to-ear。

**音质测试**：

- THD+N、SNR、频响、串扰、最大输出、底噪。
- 设备：Audio Precision、QA401/QA402、REW + 测量麦。
- 播放扫频/白噪声，录音后分析。

**时钟与漂移**：

- 长时间录 1 kHz 正弦，测相位漂移；或对比两个时钟域的样本数。
- 验证 ASRC/反馈重采样是否收敛。

**稳定性**：

- 72 小时 soak，统计 xrun 次数、内存增长、句柄泄漏。
- 反复插拔耳机、切换采样率、suspend/resume。
- 低电量/高温/高负载下的 xrun。

**语音质量**：

- PESQ/STOI/DNSMOS；真实场景录音回放。
- ASR WER、唤醒率/误唤醒率（每天次数）。
- 双讲、回声、风噪、键盘声、音乐噪声。

**量产常见问题**：

| 问题 | 根因 | 对策 |
| --- | --- | --- |
| 个别机器有底噪 | 麦克风一致性/PCB 地线 | 产线校准、筛选 |
| 大声时破音 | AOP 不足/增益过大 | 降 PGA、加限幅、选高 AOP 麦 |
| 回声投诉 | AEC 参考延迟/非线性 | 校准延迟、加强 NLP、结构隔振 |
| 啸叫 | 扬声器-麦克风耦合 | 降低增益、移频/陷波、结构优化 |
| 偶发卡顿 | 调度/中断/电源管理 | RT 优先级、绑核、关调频 |
| 蓝牙延迟大 | 编解码/重传/缓冲 | LE Audio、调小 buffer、编解码选型 |

---

**系列导航**：[系列导览](/source-study/audio/) · **下一篇**：[设备端音频（五）：面试问答 30 题（基础与算法）](/source-study/audio/05-interview-basics-algorithms.html)
