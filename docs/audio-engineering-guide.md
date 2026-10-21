# 设备端音频与语音处理 · 系统知识与面试问答

> 面向岗位要求：数字音频处理 pipeline、常用音频算法、设备端音频应用开发、Linux 音频技术栈（硬件 / 驱动 / 设备管理 / ALSA）、端侧语音处理架构与性能调优。
>
> 阅读方式：第 1—4 章是原理与工程细节，第 5 章是 60 道面试问答，附录是公式、命令、术语速查。
> 所有公式用代码块给出，可直接抄进推导；命令按「验证目的 → 命令 → 看什么」组织。
> 文中性能数字是量级参考（以 Cortex-A53/A55、16 kHz 单通道、单核为基准），实测必须以目标板为准。

---

## 目录

- [0. 岗位能力地图](#0-岗位能力地图)
- [1. 数字音频基础与 pipeline](#1-数字音频基础与-pipeline)
  - [1.1 从声波到 PCM](#11-从声波到-pcm)
  - [1.2 量化、位深与抖动](#12-量化位深与抖动)
  - [1.3 电平体系：dBFS / dBV / dBu / dBSPL](#13-电平体系dbfs--dbv--dbu--dbspl)
  - [1.4 PCM 数据格式与内存布局](#14-pcm-数据格式与内存布局)
  - [1.5 时钟、I2S / TDM / PDM 与时钟域](#15-时钟i2s--tdm--pdm-与时钟域)
  - [1.6 端到端 pipeline 与各环节职责](#16-端到端-pipeline-与各环节职责)
  - [1.7 延迟预算与计算方法](#17-延迟预算与计算方法)
- [2. 常用音频处理算法](#2-常用音频处理算法)
  - [2.1 增益、混音、削波与限幅](#21-增益混音削波与限幅)
  - [2.2 滤波器与双二阶（Biquad）](#22-滤波器与双二阶biquad)
  - [2.3 动态处理：压缩、限幅、AGC](#23-动态处理压缩限幅agc)
  - [2.4 采样率转换（SRC / ASRC）](#24-采样率转换src--asrc)
  - [2.5 麦克风阵列与波束成形](#25-麦克风阵列与波束成形)
  - [2.6 回声消除（AEC）](#26-回声消除aec)
  - [2.7 噪声抑制（NS）](#27-噪声抑制ns)
  - [2.8 VAD、去混响、丢包补偿](#28-vad去混响丢包补偿)
  - [2.9 语音前端链路顺序与工程约束](#29-语音前端链路顺序与工程约束)
  - [2.10 语音编解码与传输（简述）](#210-语音编解码与传输简述)
- [3. Linux 音频技术栈](#3-linux-音频技术栈)
  - [3.1 硬件层：SoC、Codec、功放与 DMA](#31-硬件层soccodec功放与-dma)
  - [3.2 驱动层：ASoC 架构](#32-驱动层asoc-架构)
  - [3.3 设备树与驱动代码骨架](#33-设备树与驱动代码骨架)
  - [3.4 ALSA 用户态编程](#34-alsa-用户态编程)
  - [3.5 asound.conf、插件与 UCM](#35-asoundconf插件与-ucm)
  - [3.6 上层音频服务：PulseAudio / PipeWire / GStreamer](#36-上层音频服务pulseaudio--pipewire--gstreamer)
  - [3.7 调试命令与 /proc 速查](#37-调试命令与-proc-速查)
- [4. 端侧语音处理架构与性能调优](#4-端侧语音处理架构与性能调优)
  - [4.1 分层架构与典型数据流](#41-分层架构与典型数据流)
  - [4.2 实时性设计](#42-实时性设计)
  - [4.3 性能剖析工具链](#43-性能剖析工具链)
  - [4.4 优化手段与顺序](#44-优化手段与顺序)
  - [4.5 测试、验证与量产问题](#45-测试验证与量产问题)
- [5. 面试问答 60 题](#5-面试问答-60-题)
- [附录 A：公式速查](#附录-a公式速查)
- [附录 B：命令速查](#附录-b命令速查)
- [附录 C：术语表](#附录-c术语表)
- [附录 D：自测清单](#附录-d自测清单)

---

## 0. 岗位能力地图

| JD 关键词 | 对应章节 | 面试真正会问的 |
| --- | --- | --- |
| 数字音频 pipeline、各环节原理 | 第 1 章 | 采样/量化/时钟、延迟从哪来、buffer 怎么定 |
| 常用音频算法、适用场景 | 第 2 章 | 为什么选 IIR 不选 FIR、AEC 为什么需要参考信号、NS 的代价 |
| 设备端音频应用开发 | 1.6、3.4、4.1 | 录音/播放程序怎么写、xrun 怎么恢复 |
| Linux 音频栈：硬件/驱动/设备管理/ALSA | 第 3 章 | ASoC 三件套、DAPM、period/buffer、asound.conf |
| 端侧语音处理架构与性能调优 | 第 4 章 | 实时线程、CPU 预算、NEON/定点、功耗与 offload |

一句话概括这个岗位：**把麦克风到云端/喇叭之间的每一毫秒、每一个采样点、每一份 CPU 和功耗都算清楚，并让它在真实设备上稳定跑住。**

### 0.1 如果只剩 10 分钟

1. `fs > 2*f_max`；降采样前抗混叠，重建后模拟低通。
2. 位深每 +1 bit，SNR +6 dB；16 bit ≈ 98 dB，但真实动态范围由麦克风/codec 决定。
3. 延迟 = ADC + period/buffer + 处理 + lookahead + DAC；先问清测的是哪一段。
4. period 决定调度粒度，buffer 决定抗抖动；`buffer = period × periods`。
5. xrun 先分 under/over，再查调度延迟、page fault、period 是否过小。
6. AEC 三件事：参考对齐、双讲冻结、非线性残留抑制。
7. 前端顺序：HPF → BF → AEC → NS → AGC → VAD；NS 必须在 AEC 之后。
8. ASoC = machine + platform + codec；DAPM 管上下电顺序与 pop。
9. 实时线程：`SCHED_FIFO` + `mlockall` + 预分配 + 无锁队列。
10. 优化顺序：先 profile，再算法、实现、系统、硬件。

---

## 1. 数字音频基础与 pipeline

### 1.1 从声波到 PCM

完整链路：

```text
声压 → 麦克风（换能） → 偏置/前置放大 → PGA → ADC（ΣΔ 过采样 + 抽取滤波）
     → I2S/TDM/PDM → DMA → 内核 ALSA buffer → 用户态 → 算法 → 编码/识别
```

关键结论先给：

- **采样定理**：`fs > 2 * f_max` 才能无混叠重建。44.1 kHz 对应 22.05 kHz 上限，48 kHz 对应 24 kHz。
- 44.1 kHz 来自早期 CD（PAL/NTSC 视频设备折中），48 kHz 来自专业/通信设备，16 kHz 是语音识别与 VoIP 的事实标准（8 kHz 窄带电话的上限是 4 kHz，刚好覆盖语音清晰度）。
- **抗混叠必须在降采样之前**：模拟低通 + 数字抽取滤波。ΣΔ ADC 用远高于 fs 的过采样（如 64×/128×）把量化噪声推到高频，再用数字滤波器搬走。
- **重建（DAC）之后仍需模拟低通**，否则镜像频率会落到可听带内。

过采样与噪声整形的关系：

```text
过采样率 OSR = fs_adc / fs_out
一阶 ΣΔ 噪声传递函数 NTF(z) = 1 - z^-1
带内量化噪声约下降 9 dB/倍频程（一阶），二阶 15 dB/倍频程
```

工程含义：ADC 的 SNR/THD+N 指标是在特定 OSR 和抽取滤波器下测的；换滤波器（如从「sharp」切到「low-latency」）会同时改变频响、群延迟和噪声。

### 1.2 量化、位深与抖动

量化把连续幅度映射到 `2^N` 个台阶。满幅正弦的理论信噪比：

```text
SNR(dB) = 6.02 * N + 1.76
ENOB    = (SINAD - 1.76) / 6.02
```

| 位深 | 理论 SNR | 实际器件常见 | 典型用途 |
| --- | --- | --- | --- |
| 8 bit | 50 dB | — | 玩具、提示音 |
| 16 bit | 98 dB | 90—100 dB | 消费音频、语音 |
| 24 bit | 146 dB | 105—125 dB | 录音、专业设备 |
| 32 bit float | 约 144 dB（24 bit 尾数） | 受模拟前端限制 | DSP 内部处理 |

注意：

- 注意区分「1 LSB 电平」和「理论 SNR」：按满刻度峰值归一化，16 bit 的 1 LSB ≈ **-90.3 dBFS**，24 bit ≈ **-138.5 dBFS**；常说的 96/144 dB 是满幅正弦的 SNR（6.02N+1.76），不是 LSB 电平。两者相差约 7.8 dB：正弦信号 RMS 比峰值低 3 dB，而量化噪声 RMS 比 1 LSB 低约 10.8 dB（90.3 + 10.8 - 3.0 ≈ 98.1）。
- **实际动态范围由模拟前端决定**。MEMS 麦克风 SNR 通常 60—70 dB，codec ADC 100 dB 左右，所以 24 bit 很多时候只是「不丢精度地搬运」。
- **抖动（dither）**：量化误差与信号相关时会产生失真，加入约 1 LSB 的 TPDF 抖动可把失真转为白噪声。噪声整形（noise shaping）再把噪声推向高频。
- 设备端很少主动加 dither；但在**位深下变换**（24→16）时应考虑，尤其是音乐播放路径。

### 1.3 电平体系：dBFS / dBV / dBu / dBSPL

```text
幅度：dB = 20 * log10(V / V_ref)
功率：dB = 10 * log10(P / P_ref)
```

| 单位 | 参考 | 0 值 | 常见值 |
| --- | --- | --- | --- |
| dBFS | 数字满刻度 | 0 dBFS = 满幅 | 工作电平常留 -20 dBFS 余量 |
| dBV | 1 V RMS | 0 dBV = 1 V | 消费线电平 -10 dBV ≈ 0.316 V |
| dBu | 0.775 V RMS | 0 dBu = 0.775 V | 专业线电平 +4 dBu ≈ 1.228 V |
| dBSPL | 20 µPa | 0 dBSPL = 20 µPa | 94 dBSPL = 1 Pa（校准点） |

把声学、模拟、数字串起来（面试常考的换算）：

```text
麦克风灵敏度 -38 dBV/Pa
94 dBSPL（1 Pa）→ -38 dBV = 12.6 mV
若 ADC 满刻度 1 Vrms（0 dBFS），则 94 dBSPL 对应 -38 dBFS
因此 0 dBFS 约对应 132 dBSPL（不考虑增益）
```

- **dBFS 是数字域**，永远 ≤ 0（float 可以 >1，但送 DAC 前会削）。
- **Intersample peak**：采样点不超 0 dBFS，重建波形仍可能过载。真峰值（true peak）用 4× 过采样检测，母带/限幅器会处理。
- **A 计权 / K 计权**：响度测量。ITU-R BS.1770 用 K 计权 + 门限，输出 LUFS；流媒体目标约 -14 LUFS，广播 -23 LUFS。

### 1.4 PCM 数据格式与内存布局

三个层次别混：

- **sample**：一个声道的一个采样值。
- **frame**：同一时刻所有声道的 sample 集合。立体声一帧 = 2 个 sample。
- **block/period**：一次传输或处理的一组 frame。

**交织（interleaved） vs 平面（planar）**：

```text
立体声 interleaved: L0 R0 L1 R1 L2 R2 ...
立体声 planar:      L0 L1 L2 ...  R0 R1 R2 ...
```

- ALSA `SND_PCM_ACCESS_RW_INTERLEAVED` / `MMAP_INTERLEAVED` 是交织；`*_NONINTERLEAVED` 是平面。
- 算法库常要求 planar（如 WebRTC APM 的 `float**`），跨声道处理（M/S、波束成形）用 planar 更自然；DMA 通常按交织搬运。

ALSA 常见格式（重点区分 24 bit 的三种存法）：

| 格式 | 含义 | 每样本字节 | 说明 |
| --- | --- | --- | --- |
| `S16_LE` | 有符号 16 bit 小端 | 2 | 最常用 |
| `S24_3LE` | 24 bit 打包成 3 字节 | 3 | USB/专业设备常见，无填充 |
| `S24_LE` | 24 bit 放在 32 bit 低位 | 4 | 高 8 位为填充/符号扩展 |
| `S32_LE` | 32 bit 整数 | 4 | DSP 内部常用 |
| `FLOAT_LE` | 32 bit 浮点 | 4 | 范围约 ±1.0 |

常见的坑：

- 24 bit 左对齐/右对齐搞反 → 音量极小或满幅噪声。
- 大小端搞反 → 白噪声。
- 声道顺序（ALSA 的 `FL,FR,FC,LFE,RL,RR`）与硬件走线不一致 → 左右反、中置串到左声道。
- **frame 数 ≠ 字节数**：`bytes = frames * channels * bytes_per_sample`。

WAV 头（44 字节）关键字段：`RIFF`、`WAVE`、`fmt `（format=1 PCM / 3 float / 0xFFFE extensible）、`channels`、`sampleRate`、`byteRate`、`blockAlign`、`bitsPerSample`、`data`。

### 1.5 时钟、I2S / TDM / PDM 与时钟域

数字音频是**同步**系统，时钟就是生命线。

```text
MCLK（主时钟） = 256/384/512 × fs    给 codec 内部 ΣΔ 用
BCLK（位时钟） = fs × slot_bits × slots
LRCLK（帧时钟）= fs
```

例：48 kHz、立体声、32 bit slot：

```text
BCLK = 48000 × 32 × 2 = 3.072 MHz
MCLK = 48000 × 256 = 12.288 MHz
```

**I2S vs TDM vs PDM**：

| 接口 | 线 | 特点 | 典型场景 |
| --- | --- | --- | --- |
| I2S | BCLK/LRCLK/DIN/DOUT | 2 声道，MSB 对齐，1 bit 延迟 | codec、功放 |
| TDM | BCLK/FS/DIN/DOUT | 多声道时分复用，4/8/16 slot | 多麦阵列、车载 |
| PDM | CLK/DATA | 1 bit ΣΔ，需抽取滤波 | 数字 MEMS 麦 |
| SoundWire | CLK/DATA | MIPI，多设备、带控制通道 | 手机/PC |
| USB Audio | 异步包 | 1 ms 微帧（高速 125 µs） | 外置声卡 |

I2S 的几种常见「变体」（最容易配错的地方）：

| 格式 | 数据对齐 | 备注 |
| --- | --- | --- |
| I2S（Philips） | MSB 延迟 1 个 BCLK | LRCLK 低=左；最常用 |
| Left-justified | MSB 与帧同步边沿对齐 | 无 1 bit 延迟，帧极性随 codec 约定 |
| Right-justified | LSB 对齐到帧尾 | 低位对齐，旧 codec 常见 |
| DSP mode A/B | 帧同步脉冲后跟数据 | 脉冲位置/宽度不同，TDM 常用 |

TDM 还要约定 slot 数、slot 宽度、起始 slot 和 mask（`tx_mask`/`rx_mask`）；slot 宽度大于有效位深时，要确认数据是左对齐还是右对齐。

**时钟抖动（jitter）**：抖动会调制采样时刻，在频谱上表现为底噪/谐波上升。close-in jitter（低频抖动）对音频的影响通常比宽带随机抖动更大，所以 MCLK 的时钟源、电源和走线要认真处理。

**主从关系**：谁产生 BCLK/LRCLK 谁就是 master。常见组合：

- SoC 做 master（codec 做 slave）：时钟由 SoC 的 I2S 控制器分频，软件可控。
- codec 做 master：codec 的 PLL 从 MCLK 产生，SoC 跟随。手机常见。
- 两边都用各自晶振 → **两个时钟域**。

**时钟漂移**是设备端最容易被忽略的问题：

```text
漂移量 = fs × ppm × 1e-6 × t
50 ppm @ 48 kHz = 2.4 sample/s
10 分钟 = 1440 sample ≈ 30 ms
```

后果：播放 buffer 逐渐耗尽/堆积，最终 xrun；录音与参考信号（AEC）逐渐错位。解决：

1. 同一时钟域（最彻底）。
2. **ASRC**（异步采样率转换）吸收 ppm 级差异。
3. 反馈式重采样：根据 buffer 水位微调速率（PulseAudio/PipeWire 的做法）。
4. AEC 中做**延迟估计与跟踪**（GCC-PHAT / 互相关），补偿缓慢漂移。

### 1.6 端到端 pipeline 与各环节职责

**采集（capture）**：

```text
声学 → MEMS/ECM → 偏置与前置放大 → PGA（模拟增益）
     → ADC（ΣΔ + 抽取） → I2S/TDM → DMA 环形缓冲
     → ALSA period 中断 → 用户态 read/mmap → 前端算法 → 编码/ASR
```

**播放（playback）**：

```text
解码/合成 → 混音 → 音量 → 限幅/保护 → 重采样
         → ALSA write/mmap → DMA → I2S → DAC → 模拟滤波 → 功放 → 扬声器
```

各环节的职责与典型坑：

| 环节 | 职责 | 常见问题 |
| --- | --- | --- |
| 麦克风 | 声电转换 | 灵敏度不匹配、AOP 不够导致大声失真、PDM 时钟串扰 |
| 偏置/PGA | 抬升微弱信号 | 增益过大削波、增益过小浪费 ADC 动态范围 |
| ADC | 采样量化 | 时钟抖动、抽取滤波器群延迟、DC offset |
| DMA/ALSA | 缓冲与同步 | period 过小 xrun、过大延迟高 |
| 用户态前端 | HPF/AEC/NS/AGC/BF | 算法顺序错、帧长不匹配、双讲被抑制 |
| 混音/音量 | 多路合并 | 直接相加削波、数字音量过低损失位深 |
| SRC | 速率匹配 | 劣质 SRC 引入混叠/镜像、延迟增加 |
| DAC/功放 | 重建放大 | pop/click、上电时序、EMI |

**一个常被追问的点：数字音量该放在哪？**

- 放在**限幅器之前**、混音之后，且尽量在较高位深（float/32 bit）下做。
- 数字音量每衰减 6 dB 相当于丢 1 bit 有效精度；衰减 40 dB 后 16 bit 只剩约 9 bit。
- 低音量场景优先用**模拟增益/PGA**或功放增益，数字域只做微调。
- 淡入淡出用 10—20 ms 的 ramp，避免阶跃产生 click。

### 1.7 延迟预算与计算方法

延迟的定义要先对齐：**声学输入到声学输出**（mouth-to-ear），还是**应用写入到扬声器出声**。面试时先问清楚。

```text
总延迟 ≈ ADC 群延迟 + DMA/period 等待 + buffer 深度 + 用户态处理
       + 算法前瞻(lookahead) + 混音/重采样 + DAC 群延迟 + 功放/声学传播
```

ALSA 侧的近似：

```text
单 period 延迟 = period_size / fs
buffer 延迟   = buffer_size / fs
典型 buffer   = 2—4 × period
```

| 场景 | period | buffer | 纯 ALSA 延迟 | 端到端典型 |
| --- | --- | --- | --- | --- |
| 语音识别/通话 | 10 ms (480@48k) | 30—40 ms | 30—40 ms | 40—80 ms |
| 普通媒体播放 | 20—40 ms | 100—200 ms | 100 ms+ | 150—250 ms |
| 低延迟游戏/监听 | 1—5 ms | 2—3 period | 3—10 ms | 10—20 ms |
| 蓝牙 A2DP | — | — | — | 100—200 ms |
| BLE Audio (LC3) | 7.5/10 ms 帧 | — | — | 20—50 ms |

经验值：

- **每增加一个 period，延迟增加 period_size/fs**；但 period 太小会让 CPU 频繁唤醒、xrun 概率上升。
- 算法前瞻（AEC 的参考对齐、限幅器 lookahead、线性相位 FIR）会直接加到总延迟上。
- 采样率转换、重采样滤波器的群延迟约为 `N/2 / fs`（N 为抽头数）。
- 声速 343 m/s：1 m 距离约 2.9 ms；会议场景麦克风到说话人 3 m 就是 9 ms，波束成形的延迟补偿要算进去。

**延迟与音质的权衡**：降噪/去混响算法通常需要更长帧（32—64 ms）和更多上下文，延迟换效果；通话链路一般把总预算压在 60—100 ms，语音助手可以放宽到 200 ms 以上（因为不需要实时回放）。

---

## 2. 常用音频处理算法

算法章节的组织方式：**解决什么问题 → 原理与公式 → 参数怎么定 → 代价与坑**。面试时能说清「为什么不用另一个」比背公式更加分。

### 2.1 增益、混音、削波与限幅

**增益换算**（必须条件反射）：

```text
线性增益 g = 10^(dB/20)
-6 dB ≈ 0.5，-3 dB ≈ 0.707，+6 dB ≈ 2.0
```

**混音**：多路直接相加会溢出。两种做法：

- 固定衰减：N 路各乘 `1/N`（或 `1/sqrt(N)`），简单但保守。
- 统计/自适应：按实际峰值或响度归一化，音质更好但需要 lookahead。

**削波**：

```text
hard clip: y = clamp(x, -1, 1)        → 产生大量高次谐波，听感“破”
soft clip: y = tanh(kx)/tanh(k)       → 平滑饱和，适合保护
```

**限幅器（limiter）**：当信号超过阈值时快速压到阈值，关键是 **lookahead**——提前看到峰值，用 ramp 把增益降下来，避免瞬态失真。

```text
延迟 = lookahead 长度（常见 1—5 ms）
增益包络：attack < 1 ms，release 50—200 ms
```

**真峰值**：采样点之间可能过载，用 4× 过采样检测（ITU-R BS.1770 / EBU R128），流媒体发布链路必备。

**淡入淡出**：10—20 ms 线性或余弦 ramp，避免阶跃。设备启停、切歌、静音都走 ramp，否则就是 pop。

### 2.2 滤波器与双二阶（Biquad）

**FIR vs IIR**：

| 维度 | FIR | IIR |
| --- | --- | --- |
| 相位 | 可严格线性（对称系数） | 非线性，频率相关群延迟 |
| 阶数 | 高（几百 tap） | 低（几个 biquad） |
| 稳定性 | 恒稳定 | 需检查极点 |
| 计算量 | 大 | 小 |
| 典型用途 | 线性相位 EQ、SRC、波束成形 | 实时 EQ、分频、去直流、AEC 预加重 |

线性相位 FIR 的群延迟：

```text
N 阶（N+1 抽头）对称 FIR：群延迟 = N/2 个采样
48 kHz 下 1024 tap → 10.7 ms
```

这就是「线性相位好听但延迟高」的来源。

**双二阶（biquad）** 是设备端最常用的 IIR 结构。差分方程：

```text
y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
```

**DF2T（转置直接 II 型）** 数值特性最好，每样本只需 2 个状态：

```c
typedef struct {
    float b0, b1, b2, a1, a2;   /* a0 已归一化为 1 */
    float z1, z2;
} biquad_t;

static inline float biquad_df2t(biquad_t *q, float x)
{
    float y  = q->b0 * x + q->z1;
    q->z1    = q->b1 * x - q->a1 * y + q->z2;
    q->z2    = q->b2 * x - q->a2 * y;
    return y;
}
```

**RBJ Audio EQ Cookbook** 系数（`w0 = 2*pi*f0/fs`，`alpha = sin(w0)/(2Q)`）：

```text
低通 LPF:
  b0 = (1 - cos w0)/2      b1 = 1 - cos w0      b2 = (1 - cos w0)/2
  a0 = 1 + alpha           a1 = -2 cos w0       a2 = 1 - alpha

高通 HPF:
  b0 = (1 + cos w0)/2      b1 = -(1 + cos w0)   b2 = (1 + cos w0)/2
  a0 = 1 + alpha           a1 = -2 cos w0       a2 = 1 - alpha

峰值 EQ（增益 G dB，A = 10^(G/40)）:
  b0 = 1 + alpha*A         b1 = -2 cos w0       b2 = 1 - alpha*A
  a0 = 1 + alpha/A         a1 = -2 cos w0       a2 = 1 - alpha/A

陷波 Notch:
  b0 = 1                   b1 = -2 cos w0       b2 = 1
  a0 = 1 + alpha           a1 = -2 cos w0       a2 = 1 - alpha
```

Q 与带宽的换算（`BW` 为八度）：

```text
1/Q = 2 * sinh( ln(2)/2 * BW * w0/sin(w0) )
```

**低频数值精度**：`f0 << fs` 时 `cos(w0) → 1`，极点紧贴单位圆，float 系数误差会被放大。对策：

- 用 `double` 计算系数，或运行时用 double 状态；
- 用 DF2T 而非 DF1；
- 极低频用一阶高通/去直流替代；
- 必要时用状态空间/耦合形式（coupled form）。

**去直流与语音高通**：

```text
一阶 DC blocker: y[n] = x[n] - x[n-1] + R*y[n-1]，R ≈ 0.995—0.999
语音高通：80—120 Hz，二阶 Butterworth（Q ≈ 0.707）
```

语音链路先去直流/低频（风机噪声、电源 hum、手持振动），再做其他处理；否则 AEC/NS 的估计会被低频污染。

**滤波器设计方法**：

- 窗函数法（Hann/Hamming/Blackman/Kaiser）：简单，主瓣/旁瓣折中，Kaiser 可调 β。
- Parks-McClellan（等波纹）：给定通带/阻带指标求最优 FIR。
- 模拟原型 + 双线性变换：Butterworth/Chebyshev/Elliptic → biquad。
- 工程上直接用 `scipy.signal.butter/cheby2/firwin/remez` 设计，导出 SOS，避免高阶直接型数值问题。

**常见指标**：通带纹波 < 0.1 dB、阻带衰减 > 60—100 dB、过渡带宽度、群延迟。

### 2.3 动态处理：压缩、限幅、AGC

**压缩器**四参数：

- **Threshold（T）**：超过才压缩。
- **Ratio（R）**：输入增加 R dB，输出只增加 1 dB。
- **Attack / Release**：增益变化的快慢。
- **Knee**：硬拐点/软拐点。

增益计算（dB 域）：

```text
x_dB = 20*log10(|x|)
y_dB = x_dB                                    if x_dB <= T
y_dB = T + (x_dB - T)/R                        if x_dB > T
gain_dB = y_dB - x_dB
```

平滑（一阶）：

```text
alpha_att = exp(-1/(fs * tau_att))
alpha_rel = exp(-1/(fs * tau_rel))
g = alpha*g_prev + (1-alpha)*g_target
```

实现要点：

- 检测器用 **peak**（快速、保守）或 **RMS**（平滑、贴合听感）。
- attack 太短会产生失真（尤其低频），太长会漏掉瞬态；release 太短会“抽吸”（pumping）。
- 立体声必须**联动**（link），否则声像会漂移。
- 压缩后加 makeup gain，注意别把峰值推过 0 dBFS。

**AGC（自动增益控制）** 与压缩器的区别：AGC 的目标是**把长期电平稳定到目标值**，时间常数更长（几百 ms 到几秒），通常带噪声门/静音检测，避免安静时把噪声拉满。

```text
目标电平：语音常用 -26 ~ -18 dBFS（ASR 前），通话 -20 dBFS 左右
攻击 100—500 ms，释放 1—5 s
噪声门阈值：高于底噪 6—10 dB 才启用
```

**多段 DRC**：把频带分成 2—3 段分别压缩，避免低频能量触发全带压缩（手机扬声器保护常用）。

### 2.4 采样率转换（SRC / ASRC）

**为什么需要**：44.1 kHz 内容 → 48 kHz 设备；16 kHz 语音 → 48 kHz 通话链路；两个时钟域之间吸收 ppm 漂移。

**有理数重采样 L/M**：

```text
先插值 L 倍（补零 + 低通），再抽取 M 倍（低通 + 取点）
目标：44.1k → 48k = 160/147
滤波器截止：min(fs_in, fs_out)/2
```

**多相（polyphase）实现**：把滤波器系数按相位分组，每个输出点只算一个相位，复杂度从 O(L) 降到 O(1) 组。

```text
p = (m*M) mod L                                  （相位）
y[m] = Σ_q h[p + q*L] * x[ floor(m*M/L) - q ]     （只取该相位的系数）
```

**sinc 插值**（任意比率）：

```text
y(t) = Σ_n x[n] * sinc((t - nT)/T) * w(t - nT)
```

窗函数截断 sinc，抽头数决定质量；典型 32—128 抽头。

**ASRC**：输入输出时钟独立，用**分数延迟**（Farrow 结构、立方插值）连续调整读取位置。Farrow 立方：

```text
y(μ) = c0 + c1*μ + c2*μ² + c3*μ³，μ ∈ [0,1)
系数由相邻 4 个样本线性组合得到
```

**质量指标**：

- 通带纹波（< 0.01—0.1 dB）
- 阻带衰减（> 90—120 dB）
- THD+N、混叠/镜像抑制
- 群延迟与 CPU

**常用库**：libsamplerate（sinc 最佳质量）、soxr、Speex resampler（定点友好）、ALSA `speexrate` 插件、zita-resampler。

**坑**：

- 劣质线性插值会在高频产生明显混叠，语音听感“发闷/发毛”。
- 重采样会改变延迟，AEC 的参考对齐要重新算。
- 44.1↔48 反复转换会累积损伤，链路中尽量只转一次。

### 2.5 麦克风阵列与波束成形

**远场模型**：平面波到达不同麦克风的时延差。

```text
τ_m = (m * d * sinθ) / c
d：阵元间距，θ：入射角，c ≈ 343 m/s
```

**延迟求和（delay-and-sum）**：

```text
y(t) = (1/M) * Σ_m x_m(t - τ_m)
```

- 对目标方向相干增强，对其他方向部分抵消。
- 主瓣宽度 ∝ λ/(M d)，阵元越多/间距越大越窄。
- **空间混叠**：`d > λ/2` 会出现栅瓣；16 kHz 的 λ/2 ≈ 10.7 mm，所以阵列间距通常 10—40 mm，需要权衡低频性能。

**分数延迟**：`τ_m` 不是整数采样，需 sinc 插值或 Farrow 滤波器，否则高频指向性会偏。

**MVDR（最小方差无失真响应）**：

```text
w = R^-1 * d / (d^H * R^-1 * d)
```

- `R` 是噪声+干扰协方差，`d` 是目标方向导向矢量。
- 理论最优，但对 `R` 估计误差敏感，需要**对角加载**（`R + εI`）和协方差估计的平滑。
- 计算量：M×M 矩阵求逆，M=4 时可接受；M=8 以上要考虑降维或子带处理。

**GSC（广义旁瓣抵消）**：固定波束成形 + 阻塞矩阵 + 自适应噪声抵消，把约束优化转成无约束自适应，工程上更常用。

**近场 vs 远场**：小房间/近讲（< 0.5 m）要用球面波模型，时延差之外还有幅度差。

**DOA（波达方向）**：

- GCC-PHAT：对互谱做相位加权，抑制混响，峰值即 TDOA。

```text
R12(τ) = IFFT( X1(f) * conj(X2(f)) / |X1(f) * conj(X2(f))| )
```

- SRP-PHAT：对所有方向做相位变换求和，鲁棒但计算量大。
- MUSIC：子空间分解，高分辨率，需要多快拍和阵元数。

**工程约束**：

- 阵列几何（线性/环形/三角）决定 360° 覆盖与盲区。
- 麦克风一致性（灵敏度/相位）差会导致零陷变浅，产线要校准。
- 波束成形会放大自噪声，**低频白噪声增益**要检查。
- 输出通常还要接 AEC/NS，顺序见 2.9。

### 2.6 回声消除（AEC）

**问题模型**（扬声器→麦克风的声学回声）：

```text
d(n) = s(n) + Σ_k h_k * x(n-k) + v(n)
d：麦克风信号，s：近端语音，x：远端参考，h：回声路径，v：噪声
```

目标是估计 `h`，重建回声 `ŷ`，从 `d` 中减掉，保留 `s`。

**NLMS（归一化最小均方）**：

```text
ŷ(n) = w^T(n) * x(n)
e(n) = d(n) - ŷ(n)
w(n+1) = w(n) + μ * e(n) * x(n) / (||x(n)||² + δ)
```

- `μ` 典型 0.1—0.5；太大会发散，太小收敛慢。
- 滤波器长度要覆盖房间混响尾部：**200—500 ms**；16 kHz 下 3200—8000 tap。时域直接卷积 CPU 太高。

**PBFDAF（分块频域自适应滤波）**：把长滤波器分成 B 块，每块 2N 点 FFT，overlap-save 卷积 + 频域 NLMS + 时域约束。每块的计算量约 O(B·N + N log N)，摊到每样本约 O(B + log N)，远低于时域 O(L)，是设备端主流。

**双讲检测（DTD）**：近端说话时自适应必须冻结，否则会“学掉”近端语音。

- Geigel 算法：`|d| > max|x| * threshold`。
- 归一化互相关/相干性。
- 双滤波器（foreground/background）比较。

**非线性残留（NLP/RES）**：扬声器、功放、ADC 的非线性使线性 AEC 消不干净，需要残余回声抑制——用估计的回声能量做谱增益，类似 NS。

```text
ERLE = 10*log10( E[d²] / E[e²] )   （单讲时）
典型线性 AEC：20—40 dB；加 NLP 后 45—60 dB
```

**工程要点**：

- **参考信号对齐**：参考路径有 buffer/算法延迟，必须先估计并补偿（互相关/GCC-PHAT），否则滤波器长度爆炸。
- **时钟漂移**：参考与麦克风不同源时，延迟缓慢变化，需要跟踪（AEC3 的做法）。
- **设备形态**：手机/会议 bar/智能音箱的扬声器-麦克风耦合差异极大，滤波器长度和 NLP 强度要按机型调。
- **CPU**：16 kHz、200 ms 尾长、PBFDAF 在 A53 上约 5—15% 单核；48 kHz 全带宽 AEC 翻倍以上。

**AEC / ANC / NS 的区别**（容易混）：

- **AEC**：消除「自己播放、又被自己麦克风收回来」的回声，必须有参考信号。
- **ANC**：耳机/音箱用反相声波抵消环境噪声，分前馈/反馈/混合，不需要参考信号。
- **NS**：抑制环境噪声，不针对特定参考；单通道或多通道均可。
- 补充指标：`ERL` 是回声路径本身的衰减，`ERLE` 是 AEC 在 ERL 基础上额外抑制的量。

### 2.7 噪声抑制（NS）

**STFT 域处理**：分帧（20—32 ms）→ 加窗（sqrt-Hann）→ FFT → 估计噪声 → 计算增益 → IFFT → overlap-add。

**谱减法**：

```text
|Ŝ(f)|² = max( |Y(f)|² - α*|N̂(f)|² , β*|Y(f)|² )
α：过减因子（1—4），β：谱下限（0.01—0.1）
```

**维纳滤波**：

```text
G = ξ / (1 + ξ)
ξ：先验 SNR，γ：后验 SNR
判决引导估计：ξ = α*|Ŝ_prev|²/λ_n + (1-α)*max(γ-1, 0)，α ≈ 0.98
```

**MMSE-LSA**：

```text
G = ξ/(1+ξ) * exp( 0.5 * ∫_v^∞ e^-t / t dt )
v = ξ*γ/(1+ξ)
```

**噪声估计**：MCRA（最小值控制递归平均）、最小统计量、VAD 辅助。噪声估计不准是 NS 失败的头号原因。

**musical noise（音乐噪声）**：谱减过度导致随机残留音。缓解：

- 过减 + 谱下限；
- 增益在时间/频率上平滑；
- 维纳/MMSE 类软判决；
- 深度学习方法直接回归掩码。

**深度学习 NS**：RNNoise（GRU，48 kHz 实时）、DCCRN/CRN、DeepFilterNet。设备端关注：参数量、MACs、定点/量化、内存带宽、是否支持流式。

**评价指标**：

- 客观：PESQ（窄带/宽带）、STOI（可懂度）、DNSMOS、SNR 提升。
- 任务级：ASR 词错率（WER）、唤醒率/误唤醒。
- 注意：PESQ 高不等于 ASR 好，语音增强可能损伤识别线索。

### 2.8 VAD、去混响、丢包补偿

**VAD**：

- 能量 + 过零率 + 谱特征，最简单。
- GMM（WebRTC VAD，mode 0—3，mode 3 最激进）。
- DNN VAD（更鲁棒，代价是算力）。
- **hangover**：语音结束后保持 100—300 ms，避免尾音被切。

**去混响 WPE（Weighted Prediction Error）**：

```text
x(t,f) = Σ_{τ=1..D} G(τ,f) * x(t-τ,f) + d(t,f)
估计线性预测系数 G，从当前帧减掉晚期混响
```

多通道 WPE 效果最好，计算量在 STFT 域，适合会议/车载。

**丢包补偿（PLC）**：

- 波形相似重复（WSOLA）、基音周期复制。
- Opus 内置 PLC，LC3 也有。
- 网络抖动用 jitter buffer（20—200 ms）吸收，代价是延迟。

### 2.9 语音前端链路顺序与工程约束

典型顺序（多麦远场）：

```text
ADC → DC/HPF → 波束成形 → AEC → NS → AGC → VAD → 编码/ASR
```

为什么这么排：

- **HPF 最前**：去掉 DC、低频振动、电源 hum，避免污染后续估计。
- **BF 在 AEC 前**：先提升目标方向 SNR；AEC 的参考是远端信号，与 BF 无关。也有把 AEC 放 BF 前的方案（每麦独立 AEC），代价是算力 ×M。
- **AEC 在 NS 前**：NS 是非线性/时变处理，会破坏回声路径的线性，导致 AEC 失效。
- **AGC 在 NS 后**：否则会把噪声一起放大；AGC 也会影响 VAD，所以 VAD 常取 AGC 前或做增益补偿。
- **VAD 最后**：给编码器/唤醒词做门控。

其他约束：

- **帧长对齐**：10 ms @16 kHz = 160 点；AEC 常用 64/128 块；STFT 用 256/512 点。链路中要有统一的帧调度器，避免反复重采样。
- **采样率统一**：麦克风 48 kHz 采集 → 降采样到 16 kHz 做语音；AEC 若在 48 kHz 做，参考也必须 48 kHz。
- **别做两次 AGC/NS**：串接会累积损伤，调参也失控。
- **旁路（bypass）能力**：调试和对比必须能逐级旁路，否则无法定位是哪一级变差。

### 2.10 语音编解码与传输（简述）

| 编码 | 帧长 | 码率 | 特点 |
| --- | --- | --- | --- |
| Opus | 2.5—60 ms | 6—510 kbps | 语音/音乐通用，内置 PLC/FEC，WebRTC 默认 |
| AAC-LC | 1024 点 | 64—256 kbps | 音乐主流 |
| LC3 | 7.5/10 ms | 16—320 kbps | BLE Audio 强制，低延迟低功耗 |
| SBC | — | 200—345 kbps | 经典蓝牙 A2DP，质量一般 |
| G.711 | 20 ms | 64 kbps | 传统电话，PLC 简单 |

传输侧关注：**jitter buffer**（抗抖动 vs 延迟）、**FEC/PLC**（丢包）、**拥塞控制**（WebRTC GCC）。蓝牙链路的延迟主要来自编解码 + 重传 + 缓冲，A2DP 100—200 ms，LE Audio 20—50 ms。

---

## 3. Linux 音频技术栈

Linux 音频栈可以按「硬件 → 驱动 → 内核框架 → 用户态库/服务 → 应用」五层理解。面试最容易被追问的是 **ASoC 三件套、DAPM、period/buffer、xrun 恢复**。

```text
应用（ASR/播放器/通话）
   │  ALSA-lib / PulseAudio / PipeWire / GStreamer / tinyalsa
   ▼
ALSA 内核（snd-pcm / snd-ctl / snd-seq）
   │
ASoC（machine / platform / codec）+ DAPM
   │
I2S/TDM/PDM/SoundWire 控制器 + DMA + Codec + 功放
   │
麦克风 / 扬声器
```

### 3.1 硬件层：SoC、Codec、功放与 DMA

典型智能音箱/会议设备的音频硬件：

```text
4× MEMS MIC (PDM) ──┐
                    ├─→ SoC PDM 控制器 ─→ 抽取滤波 ─→ DMA ─→ 内存
Codec (ES8316/NAU88C10/RT5651/TLV320AIC)
   ├─ ADC ← 模拟麦 / 线路输入
   ├─ DAC → 功放 (AW8896/TAS5805/MAX98357A) → 扬声器
   └─ I2S/TDM ←→ SoC I2S 控制器
```

关键硬件参数：

- **MEMS 麦克风**：SNR 60—70 dB、AOP 120—130 dBSPL、灵敏度 -38 ~ -26 dBV/Pa、PDM 时钟 1—3 MHz。
- **Codec**：ADC/DAC SNR、THD+N、PGA 范围、MCLK 支持范围（通常 256/384/512 fs）、是否内置 DSP。
- **功放**：Class-D 效率高但有 EMI；需要看电源抑制比（PSRR）、pop 抑制、过流保护。
- **DMA**：分散/聚集（scatter-gather）、循环缓冲、双缓冲半满/全满中断。
- **DSP**：HiFi/Hexagon/CEVA 核，用于 offload AEC/NS/唤醒词，节省主核功耗。

硬件设计对软件的影响：

- MCLK 走线/时钟源不稳 → 采样率偏差、爆音。
- 模拟麦偏置与地线布局 → 底噪、hum。
- 功放使能 GPIO 时序 → 上电 pop。
- PDM 时钟与 I2S 共用 PLL → 改采样率时可能无 clock。

### 3.2 驱动层：ASoC 架构

ASoC（ALSA System on Chip）把音频驱动拆成三个可复用的部分：

| 组件 | 职责 | 典型代码位置 |
| --- | --- | --- |
| **Machine** | 描述「哪块板子、哪个 CPU DAI 接哪个 Codec DAI」，定义 card、dai_link、widgets/routes、板级 ops | `sound/soc/<vendor>/<board>.c` |
| **Platform** | SoC 侧的 I2S/TDM 控制器 + DMA（`snd_dmaengine_pcm`） | `sound/soc/<vendor>/<i2s>.c` |
| **Codec** | Codec 寄存器、时钟、DAPM、kcontrol、DAI ops | `sound/soc/codecs/<codec>.c` |

**DAI（Digital Audio Interface）**：CPU DAI 与 Codec DAI 通过 `dai_link` 连接，双方用 `set_fmt` 协商格式（I2S/左对齐/DSP、主从、时钟极性）。

**DAPM（Dynamic Audio Power Management）**：

- 把 codec 内部和板级路径抽象成 **widget**（mux、mixer、PGA、ADC、DAC、AIF、MIC、SPK、regulator）和 **route**（连接关系）。
- 根据当前活跃的 PCM 流，自动上电/下电整条路径，并在顺序上做 pop 抑制。
- 调试入口：`/sys/kernel/debug/asoc/<card>/dapm`。

**Kcontrol**：用户态可见的控件（音量、mux、EQ），用 `SOC_SINGLE`/`SOC_DOUBLE_R`/`SOC_ENUM`/`SOC_SINGLE_TLV` 定义，`amixer` 直接操作。

**Runtime PM / regmap**：codec 寄存器通过 regmap 访问，支持 cache；suspend/resume 时恢复。

**Jack 检测**：`snd_soc_jack` + `snd_jack`，耳机插入/拔出上报到用户态。

**Probe 顺序**（简化）：

```text
platform_driver probe → 注册 CPU DAI / DMA
codec i2c probe       → 注册 component / DAI / kcontrols / DAPM
machine probe         → 绑定 dai_link → snd_soc_register_card()
                      → 创建 card、pcm 设备 → /dev/snd/pcmC0D0p 出现
```

**hw_params 阶段要做的事**：

- 根据 rate 设置 codec 的 sysclk/PLL（MCLK = 256/384/512 × fs）。
- 设置 I2S 的 slot 宽度、帧格式、主从。
- 设置 codec 的采样率、静音/去加重。
- 失败要回滚，避免 clock 开着但没流。

**trigger 阶段**：`SNDRV_PCM_TRIGGER_START/STOP/PAUSE` 控制 DMA 启停，注意 start 前先清 FIFO。

**常见驱动问题**：

| 现象 | 可能原因 |
| --- | --- |
| 完全没声音 | DAPM route 缺失、codec 未上电、MCLK 没开、I2S 主从冲突 |
| 声音音调不对 | MCLK/BCLK 比率错、采样率不匹配、TDM slot 宽度错 |
| 只有一边声道 | slot 映射错、声道交换、功放单声道配置 |
| pop/click | 上电时序、PGA 突变、功放 EN 与 I2S 启动顺序 |
| 录音全是噪声 | 格式/端序错、PDM 时钟错、模拟增益过大 |
| 录音很小 | PGA 太小、麦克风偏置未开、单端/差分接错 |

### 3.3 设备树与驱动代码骨架

**设备树（simple-audio-card）**：

```dts
sound {
    compatible = "simple-audio-card";
    simple-audio-card,name = "my-soc-sound";
    simple-audio-card,format = "i2s";
    simple-audio-card,bitclock-master = <&dailink_master>;
    simple-audio-card,frame-master     = <&dailink_master>;

    dailink_master: simple-audio-card,cpu {
        sound-dai = <&i2s0>;
    };
    simple-audio-card,codec {
        sound-dai = <&codec>;
    };
};

&i2s0 {
    status = "okay";
    pinctrl-names = "default";
    pinctrl-0 = <&i2s0_mclk &i2s0_bclk &i2s0_lrck &i2s0_sdi &i2s0_sdo>;
};
```

要点：

- `bitclock-master` / `frame-master` 的 phandle 指向 **CPU 或 Codec 的子节点**（上例给 CPU 节点打了 `dailink_master` 标签），不是指向声卡节点。
- `format` 可选 `i2s`、`right_j`、`left_j`、`dsp_a`、`dsp_b`。
- 多声道用 `dai-tdm-slot-num` / `dai-tdm-slot-width`。
- MCLK 通常由 `assigned-clocks`/`assigned-clock-rates` 或 codec 节点里的 `clocks`/`clock-names` 指定。

**Codec DAI ops 骨架**：

```c
static int my_codec_hw_params(struct snd_pcm_substream *substream,
                              struct snd_pcm_hw_params *params,
                              struct snd_soc_dai *dai)
{
    struct snd_soc_component *comp = dai->component;
    /* priv->mclk 在 probe 里 devm_clk_get() 得到 */
    struct my_codec *priv = snd_soc_component_get_drvdata(comp);
    unsigned int rate  = params_rate(params);
    unsigned int width = params_width(params);
    int mclk;

    switch (rate) {
    case 8000:  mclk = 2048000;  break;
    case 16000: mclk = 4096000;  break;
    case 44100: mclk = 11289600; break;
    case 48000: mclk = 12288000; break;
    default:    return -EINVAL;
    }
    clk_set_rate(priv->mclk, mclk);

    /* 字长；协议（I2S/左对齐）与主从在 set_fmt 里设置 */
    snd_soc_component_update_bits(comp, MY_REG_FMT, 0x1f,
                                  width_to_reg(width));
    /* 设置采样率相关分频 */
    snd_soc_component_write(comp, MY_REG_SR, rate_to_reg(rate));
    return 0;
}

static const struct snd_soc_dai_ops my_codec_dai_ops = {
    .hw_params = my_codec_hw_params,
    .set_fmt   = my_codec_set_fmt,
    .trigger   = my_codec_trigger,
    .mute_stream = my_codec_mute,
};

static struct snd_soc_dai_driver my_codec_dai = {
    .name = "my-codec-hifi",
    .playback = { .stream_name = "Playback", .channels_min = 1,
                  .channels_max = 2, .rates = SNDRV_PCM_RATE_8000_48000,
                  .formats = SNDRV_PCM_FMTBIT_S16_LE | SNDRV_PCM_FMTBIT_S24_LE },
    .capture  = { .stream_name = "Capture",  .channels_min = 1,
                  .channels_max = 2, .rates = SNDRV_PCM_RATE_8000_48000,
                  .formats = SNDRV_PCM_FMTBIT_S16_LE },
    .ops = &my_codec_dai_ops,
};
```

**Machine driver 关键结构**：

```c
SND_SOC_DAILINK_DEFS(my_link,
    DAILINK_COMP_ARRAY(COMP_CPU("i2s0")),
    DAILINK_COMP_ARRAY(COMP_CODEC("1-0018", "my-codec-hifi")),
    DAILINK_COMP_ARRAY(COMP_PLATFORM("dma")));

static struct snd_soc_dai_link my_dai_links[] = {
    {
        .name = "my-hifi",
        .stream_name = "HiFi",
        .dai_fmt = SND_SOC_DAIFMT_I2S | SND_SOC_DAIFMT_NB_NF |
                   SND_SOC_DAIFMT_CBS_CFS,
        SND_SOC_DAILINK_REG(my_link),
    },
};

static struct snd_soc_card my_card = {
    .name = "my-soc-sound",
    .owner = THIS_MODULE,
    .dai_link = my_dai_links,
    .num_links = ARRAY_SIZE(my_dai_links),
    .dapm_widgets = my_widgets,
    .num_dapm_widgets = ARRAY_SIZE(my_widgets),
    .dapm_routes = my_routes,
    .num_dapm_routes = ARRAY_SIZE(my_routes),
};
```

**DAPM widget/route 示例**：

```c
static const struct snd_soc_dapm_widget my_widgets[] = {
    SND_SOC_DAPM_SPK("Speaker", NULL),
    SND_SOC_DAPM_MIC("Mic", NULL),
    SND_SOC_DAPM_OUTPUT("SPK_OUT"),
};

static const struct snd_soc_dapm_route my_routes[] = {
    { "Speaker", NULL, "SPK_OUT" },
    { "SPK_OUT", NULL, "HPOUTL" },
};
```

### 3.4 ALSA 用户态编程

**对象层级**：

```text
snd_card → snd_pcm (device) → substream → hw_params / sw_params / status
         → snd_ctl (controls)
```

设备节点：`/dev/snd/pcmC0D0p`（card0 device0 playback）、`pcmC0D0c`（capture）、`controlC0`。

**PCM 状态机**：

```text
OPEN → SETUP → PREPARED → RUNNING → (XRUN / DRAINING / PAUSED) → SETUP
```

**period 与 buffer**：

- `period_size`：一次中断/唤醒处理的帧数，决定调度粒度。
- `buffer_size`：环形缓冲总帧数，必须 ≥ period × 2。
- `latency ≈ period_size / fs`（单周期）或 `buffer_size / fs`（整缓冲）。

**hw_params（硬件约束） vs sw_params（软件行为）**：

- hw_params：格式、声道、采样率、period、buffer、access。
- sw_params：start_threshold、stop_threshold、avail_min、silence_threshold、timestamp 模式。

**完整录音示例（RW 模式，阻塞读）**：

```c
#include <alsa/asoundlib.h>
#include <stdint.h>

int capture_demo(void)
{
    snd_pcm_t *pcm;
    snd_pcm_hw_params_t *hw;
    snd_pcm_sw_params_t *sw;
    unsigned int rate = 48000;
    snd_pcm_uframes_t period = 480, buffer = 1920;
    int16_t buf[480 * 2];
    int rc;

    rc = snd_pcm_open(&pcm, "hw:0,0", SND_PCM_STREAM_CAPTURE, 0);
    if (rc < 0) return rc;

    snd_pcm_hw_params_alloca(&hw);
    snd_pcm_hw_params_any(pcm, hw);
    snd_pcm_hw_params_set_access(pcm, hw, SND_PCM_ACCESS_RW_INTERLEAVED);
    snd_pcm_hw_params_set_format(pcm, hw, SND_PCM_FORMAT_S16_LE);
    snd_pcm_hw_params_set_channels(pcm, hw, 2);
    snd_pcm_hw_params_set_rate_near(pcm, hw, &rate, 0);
    snd_pcm_hw_params_set_period_size_near(pcm, hw, &period, 0);
    snd_pcm_hw_params_set_buffer_size_near(pcm, hw, &buffer);
    rc = snd_pcm_hw_params(pcm, hw);
    if (rc < 0) goto out;

    snd_pcm_sw_params_alloca(&sw);
    snd_pcm_sw_params_current(pcm, sw);
    /* 采集：start_threshold 设为 1（也可直接 snd_pcm_start）；
     * 播放才常设为 buffer_size - period_size，攒够再启动 DMA */
    snd_pcm_sw_params_set_start_threshold(pcm, sw, 1);
    snd_pcm_sw_params_set_avail_min(pcm, sw, period);
    snd_pcm_sw_params(pcm, sw);

    snd_pcm_prepare(pcm);
    snd_pcm_start(pcm);

    for (;;) {
        snd_pcm_sframes_t n = snd_pcm_readi(pcm, buf, period);
        if (n == -EPIPE) {                 /* overrun */
            snd_pcm_prepare(pcm);
            continue;
        }
        if (n < 0) {                       /* -ESTRPIPE 等 */
            snd_pcm_recover(pcm, (int)n, 1);
            continue;
        }
        process(buf, (size_t)n);
    }
out:
    snd_pcm_close(pcm);
    return rc;
}
```

**播放要点**：

- `snd_pcm_writei` 返回实际写入帧数，可能小于请求，要循环补齐。
- 首次写入前 `snd_pcm_prepare`；start_threshold 控制何时真正启动 DMA。
- 结束时 `snd_pcm_drain`（播完）或 `snd_pcm_drop`（立即停）。

**xrun**：

- capture overrun：应用读得太慢，环形缓冲被覆盖。
- playback underrun：应用喂得太慢，DMA 没数据。
- 处理：`snd_pcm_prepare` 重新准备，或 `snd_pcm_recover(pcm, err, silent)`。
- 排查：看 `/proc/asound/card0/pcm0p/sub0/status` 的 `state: XRUN`、`avail`、`hw_ptr`。

**mmap 模式**（低延迟/零拷贝）：

```c
snd_pcm_mmap_begin(pcm, &areas, &offset, &frames);
/* 直接读写 areas[0].addr + offset */
snd_pcm_mmap_commit(pcm, offset, frames);
```

**时间戳**：`snd_pcm_status_get_trigger_tstamp()` 获取启动时刻，`snd_pcm_status_get_htstamp()` 获取硬件时间，用于 A/V 同步和漂移测量。

**控制接口**：

```c
snd_ctl_t *ctl;
snd_ctl_open(&ctl, "hw:0", 0);
snd_ctl_elem_list_t *list;
/* 枚举、read/write，等价于 amixer */
```

### 3.5 asound.conf、插件与 UCM

ALSA 插件层让「一个硬件」变成「多个逻辑设备」：

| 插件 | 作用 |
| --- | --- |
| `plug` | 自动格式/采样率/声道转换 |
| `hw` | 直接访问硬件，无转换 |
| `dmix` | 多进程共享播放 |
| `dsnoop` | 多进程共享录音 |
| `softvol` | 软件音量 |
| `equal` | 软件 EQ |
| `ladspa` | 挂 LADSPA 效果器 |
| `speexrate` | 重采样 |
| `file` | 写入文件（调试） |
| `null` | 空设备（测试） |

**典型 `~/.asoundrc` / `/etc/asound.conf`**：

```conf
pcm.!default {
    type plug
    slave.pcm "dmix"
}

pcm.dmix {
    type dmix
    ipc_key 1024
    ipc_perm 0666
    slave {
        pcm "hw:0,0"
        format S16_LE
        rate 48000
        channels 2
        period_size 1024
        buffer_size 8192
    }
}

pcm.dsnoop {
    type dsnoop
    ipc_key 2048
    ipc_perm 0666
    slave {
        pcm "hw:0,0"
        rate 48000
        channels 2
        period_size 1024
        buffer_size 8192
    }
}

pcm.mic {
    type plug
    slave.pcm "dsnoop"
}
```

注意：

- `dmix` 要求 slave 的 format/rate/channels 固定，且硬件支持。
- 多进程共享时 `ipc_key` 不能冲突。
- `plug` 会自动做 SRC，但质量取决于 `speexrate` 等插件，低延迟场景尽量让应用直接输出硬件支持的格式。

**UCM（Use Case Manager）**：`/usr/share/alsa/ucm2/`，按 verb/device 描述「听音乐、打电话、录音」的完整 mixer 配置，PulseAudio/PipeWire 会调用。手机上比裸 asound.conf 更常见。

**设备管理**还包括：card 热插拔（udev）、`alsactl` 保存/恢复混音状态、PulseAudio 的 card profile（`pactl set-card-profile`）、PipeWire 的 device route（`wpctl`），以及多声卡场景下的默认设备选择（`pactl set-default-sink` / `wpctl set-default`）。

### 3.6 上层音频服务：PulseAudio / PipeWire / GStreamer

| 方案 | 定位 | 常用命令 |
| --- | --- | --- |
| **PulseAudio** | 桌面/嵌入式声音服务器，混音、路由、网络音频 | `pactl info`、`pactl list short sinks`、`pacmd list-sinks` |
| **PipeWire** | 新一代多媒体图（音频+视频），低延迟，兼容 PulseAudio/JACK | `pw-top`、`pw-cli`、`wpctl status`、`wpctl set-default` |
| **GStreamer** | 流媒体管线框架 | `gst-launch-1.0 alsasrc ! audioconvert ! alsasink` |
| **tinyalsa** | Android/嵌入式轻量库，直接操作 `/dev/snd` | `tinyplay`、`tinycap`、`tinymix`、`tinypcminfo` |
| **Android AudioFlinger** | Android 音频 HAL 之上，FastMixer/offload | `dumpsys media.audio_flinger` |

**什么时候绕过声音服务器**：

- 需要极低延迟（< 10 ms）或精确时钟：直接 `hw:` + mmap。
- 需要独占设备/专业音频：ALSA 直连或 JACK。
- 语音前端：通常直接读 ALSA，避免 PulseAudio 的额外缓冲和重采样。

**PipeWire 的 quantum**：默认 1024 帧（48 kHz 下约 21 ms），低延迟可调到 256/128；`pw-metadata -n settings 0 clock.quantum 256`。

### 3.7 调试命令与 /proc 速查

**设备与能力**：

```bash
cat /proc/asound/cards                 # 有哪些声卡
cat /proc/asound/devices               # pcm/control 设备号
aplay -l                               # 播放设备列表
aplay -L                               # 含插件的逻辑设备
arecord -l                             # 录音设备列表
```

**当前参数与状态**：

```bash
cat /proc/asound/card0/pcm0p/sub0/hw_params
cat /proc/asound/card0/pcm0p/sub0/status
cat /proc/asound/card0/pcm0c/sub0/hw_params
```

`status` 里重点看：`state`（RUNNING/XRUN）、`owner_pid`、`hw_ptr`/`appl_ptr`、`avail`。

**播放/录音自检**：

```bash
speaker-test -D hw:0,0 -c 2 -t sine -f 1000 -l 1
arecord -D hw:0,0 -f S16_LE -r 48000 -c 2 -d 5 /tmp/test.wav
aplay   -D hw:0,0 -f S16_LE -r 48000 -c 2 /tmp/test.wav
aplay -D hw:0,0 --dump-hw-params /tmp/test.wav   # 打印支持的参数范围
```

**Mixer**：

```bash
amixer -c 0 scontrols
amixer -c 0 contents
amixer -c 0 sset 'Master' 80%
amixer -c 0 sset 'Capture' 70% cap
alsactl store
alsactl restore
```

**驱动/设备树**：

```bash
dmesg | grep -iE 'asoc|snd|codec|i2s'
cat /sys/kernel/debug/asoc/cards
cat /sys/kernel/debug/asoc/<card>/dapm
cat /sys/kernel/debug/clk/clk_summary | grep -i mclk
cat /proc/interrupts | grep -i i2s
i2cdetect -y 0                          # codec 是否在总线上
```

**跟踪系统调用/延迟**：

```bash
strace -f -e trace=ioctl,read,write -T arecord -D hw:0,0 -f S16_LE -r 48000 -d 2 /tmp/a.wav
latmus                                   # alsa-tools，测往返延迟
```

**典型排查顺序**（没声音）：

```text
1. /proc/asound/cards 有没有声卡
2. dmesg 有没有 probe 失败 / clock 错误
3. amixer 音量、mute、DAPM 路径
4. aplay -D hw:0,0 是否能播（绕过插件）
5. /proc/.../hw_params 是否 RUNNING
6. 示波器/逻辑分析仪看 BCLK/LRCLK/DATA
7. codec 寄存器（i2cget）与 MCLK
```

---

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

## 5. 面试问答 60 题

> 用法：先自己答一遍，再看要点。标注「★」的是高频必问。答案给的是骨架，面试时按「结论 → 原理 → 取舍 → 工程例子」展开。

### 5.1 基础（Q1—Q12）

**Q1 ★ 采样定理是什么？为什么常见 44.1k / 48k / 16k？**

- `fs > 2 f_max` 才能无混叠恢复；44.1k 覆盖 22.05k（人耳上限约 20k），来自 CD 时代的历史折中；48k 是专业/通信设备主流，且与 24/25/30/60 fps 视频帧率成整数关系；16k 是宽带语音标准（8k 带宽），覆盖语音清晰度所需频段。
- 关键是**降采样前必须抗混叠**，重建后必须模拟低通。

**Q2 ★ 量化噪声与位深的关系？**

- 满幅正弦：`SNR = 6.02N + 1.76 dB`；16 bit ≈ 98 dB，24 bit ≈ 146 dB。
- 实际受模拟前端限制：MEMS 麦 60—70 dB，codec 100 dB 左右。
- `ENOB = (SINAD - 1.76)/6.02`，用来判断「有效位数」。

**Q3 dither 有什么用？设备端什么时候需要？**

- 量化误差与信号相关会产生谐波失真；加约 1 LSB 的 TPDF 抖动把失真变成白噪声，听感更自然。
- 位深下变换（24→16）、低电平淡出时最有意义；设备端录音/播放通常不做，除非做母带或高动态范围处理。

**Q4 ★ dBFS、dBV、dBu、dBSPL 的区别？0 dBFS 对应多少 SPL？**

- dBFS 是数字满刻度；dBV 参考 1 V，dBu 参考 0.775 V，dBSPL 参考 20 µPa。
- 换算链：麦克风灵敏度（如 -38 dBV/Pa）→ 94 dBSPL 对应 -38 dBV → 若 ADC 满刻度 1 Vrms，则 94 dBSPL 对应 -38 dBFS → 0 dBFS 约 132 dBSPL。
- 实际还要加 PGA 增益，且不同频率灵敏度不同（频响曲线）。

**Q5 sample、frame、block 有什么区别？planar 和 interleaved 呢？**

- sample 是单声道单点；frame 是所有声道同一时刻的集合；block/period 是一批 frame。
- interleaved 按帧交错存（LRLR），planar 按声道分开存（LLL、RRR）。
- DMA/ALSA 多为 interleaved，算法库多用 planar；转换有开销，链路设计时尽量少转。

**Q6 ★ S24_3LE、S24_LE、S32_LE 有什么区别？**

- `S24_3LE`：24 bit 打包成 3 字节，无填充；USB/专业设备常见。
- `S24_LE`：24 bit 放在 32 bit 字的低 24 位，高 8 位填充；ALSA 内部常见。
- `S32_LE`：完整 32 bit 整数。
- 搞错会导致音量异常或噪声；还要注意左/右对齐和端序。

**Q7 ★ MCLK、BCLK、LRCLK 的关系？I2S 时序关键点？**

- `MCLK = 256/384/512 × fs`（codec 内部 ΣΔ 用）；`BCLK = fs × slot_bits × slots`；`LRCLK = fs`。
- I2S：LRCLK 低=左声道、高=右声道；数据 MSB 在 LRCLK 跳变后延迟 1 个 BCLK；MSB-first。
- 主从必须明确，两边同时驱动 BCLK 会冲突。

**Q8 I2S、TDM、PDM 怎么选？**

- I2S：2 声道、简单、codec/功放最常用。
- TDM：多声道（4/8/16 slot），多麦阵列、车载；需要约定 slot 宽度和帧同步模式（DSP A/B）。
- PDM：数字 MEMS 麦，1 bit 高采样率，需抽取滤波；布线简单但时钟易串扰。
- SoundWire 用于手机/PC 多设备；USB Audio 用于外置声卡。

**Q9 ★ 两个时钟域为什么会漂移？怎么解决？**

- 晶振精度（±10—50 ppm）、温漂、PLL 抖动导致 fs 不完全相等。
- 50 ppm @48k ≈ 2.4 sample/s，10 分钟差约 30 ms。
- 解决：同源时钟、ASRC、反馈重采样（看 buffer 水位调速）、AEC 延迟跟踪。

**Q10 ★ 端到端音频延迟由哪些部分组成？怎么测？**

- ADC 群延迟 + period/buffer + 用户态调度 + 算法 lookahead + 混音/SRC + DAC + 功放/声学。
- 测法：环回脉冲（播放→录音）、`latmus`、示波器看 BCLK 与模拟输出、人工嘴/人工耳。
- 先明确测的是「应用写入到出声」还是「声学入口到声学出口」。

**Q11 ★ 什么是 xrun？怎么恢复和定位？**

- playback underrun：应用喂数据太慢，DMA 没数据；capture overrun：应用读太慢，缓冲被覆盖。ALSA 返回 `-EPIPE`。
- 恢复：`snd_pcm_prepare` 重新准备，或 `snd_pcm_recover`。
- 定位：`/proc/asound/.../status` 看 state/avail；`strace -T` 看 read/ioctl 耗时；`cyclictest`/`perf sched` 看调度延迟；检查 period 是否过小、是否有 page fault/malloc。

**Q12 ★ 为什么语音前端常用 16 kHz？8k 和 48k 呢？**

- 8k 采样只有 4k 带宽，丢失辅音高频，电话音质；16k 提供 8k 带宽，是宽带语音/Opus/ASR 的主流；48k 用于音乐、全带宽通话、AEC 高保真参考。
- 16k 的算力/模型输入更小，且与多数 ASR 前端匹配；需要音乐或超声场景才上 48k。

### 5.2 算法（Q13—Q30）

**Q13 ★ FIR 和 IIR 怎么选？**

- FIR：可线性相位、恒稳定，但阶数高、延迟大、算力大；适合线性相位 EQ、SRC、波束成形。
- IIR：阶数低、算力小、延迟低，但相位非线性、需稳定性检查；适合实时 EQ、分频、去直流。
- 设备端语音链路通常 IIR 做基础滤波，FIR 做需要线性相位/精确频响的部分。

**Q14 ★ 双二阶滤波器低频为什么容易出问题？怎么解决？**

- `f0 << fs` 时 `cos(w0) → 1`，极点紧贴单位圆且彼此靠近，float 系数量化误差被放大，导致频响偏移甚至不稳定。
- 对策：double 系数/状态、DF2T 结构、一阶节替代、coupled form、必要时改用状态空间/耦合形式，或换用双精度。

**Q15 线性相位 FIR 的代价是什么？**

- 群延迟 `(N-1)/2` 个采样，48k 下 1024 tap ≈ 10.7 ms；还有 pre-ringing，瞬态会被“抹开”。
- 对延迟敏感的通话/监听链路通常不用长线性相位 FIR。

**Q16 ★ 采样率转换有哪些方法？怎么评价质量？**

- 零阶保持/线性插值：便宜但混叠/镜像严重。
- 多相 FIR：主流，质量与抽头数相关。
- 窗函数 sinc：任意比率，质量好。
- ASRC/Farrow：吸收时钟漂移。
- 指标：通带纹波、阻带衰减、THD+N、群延迟、CPU；库：libsamplerate、soxr、Speex、zita。

**Q17 ★ 压缩器的参数怎么调？**

- Threshold 决定何时开始压；Ratio 决定压多少；Attack 太快会失真、太慢漏瞬态；Release 太短会抽吸。
- 语音常用：T = -18 ~ -12 dBFS，R=2:1—4:1，attack 5—20 ms，release 100—300 ms，软拐点。
- 立体声要联动，压缩后加 makeup，注意峰值不过 0 dBFS。

**Q18 限幅器为什么需要 lookahead？**

- 峰值是突发的，没有前瞻就只能等超了再降，已经削了；lookahead 提前看到峰值，用 ramp 平滑降增益。
- 代价是延迟（常见 1—5 ms）；真峰值检测还要 4× 过采样。

**Q19 ★ AEC 的原理？NLMS 怎么更新？**

- 模型：`d = s + h*x + v`；用自适应滤波器估计 `h`，重建回声并从麦克风信号减掉。
- NLMS：`w += μ e x / (||x||² + δ)`，`e = d - w^T x`。
- 长尾用 PBFDAF（分块频域）降复杂度；滤波器长度覆盖 200—500 ms 混响。

**Q20 ★ 双讲检测怎么做？为什么必须做？**

- 近端说话时，自适应会把近端语音也“学”进回声路径，导致近端被抵消。
- 方法：Geigel（`|d| > max|x| * th`）、归一化互相关、双滤波器（foreground/background）比较、相干性。
- 检测到双讲就冻结/放慢自适应，只保留 NLP 的保守抑制。

**Q21 线性 AEC 之后为什么还需要 NLP？**

- 扬声器、功放、ADC 的非线性，以及时钟漂移、路径变化，使线性滤波只能消 20—40 dB。
- NLP/RES 用估计的回声能量做谱增益，进一步压残余；但要避免损伤近端语音（双讲时保守）。

**Q22 ★ 谱减法为什么会产生 musical noise？怎么缓解？**

- 噪声估计有方差，谱减后在随机频点留下孤立残留，听起来像“水声/鸟叫”。
- 缓解：过减因子 + 谱下限、时间/频率平滑、维纳/MMSE 软增益、噪声估计改进（MCRA）、深度学习方法。

**Q23 维纳滤波和 MMSE-LSA 的区别？**

- 维纳：`G = ξ/(1+ξ)`，基于均方误差，计算简单。
- MMSE-LSA：最小化对数谱误差，`G = ξ/(1+ξ) exp(0.5 ∫_v^∞ e^-t/t dt)`，语音失真更小，但需要更准的先验 SNR。
- 工程上常用判决引导（decision-directed）估计先验 SNR，兼顾两者。

**Q24 ★ 深度降噪和传统降噪相比，端侧部署要注意什么？**

- 优势：对非平稳噪声、低 SNR 效果更好；可联合 AEC/去混响。
- 约束：MACs/参数量、内存带宽、定点/量化精度、流式因果性、帧长与延迟、模型更新与多平台移植。
- 常见做法：传统算法打底 + 轻量 DNN 做掩码/后处理，或 DSP 上跑小模型。

**Q25 ★ delay-and-sum 和 MVDR 的区别？**

- DAS：按方向补偿时延后平均，鲁棒、无需统计信息，但旁瓣高、抑制有限。
- MVDR：`w = R^-1 d/(d^H R^-1 d)`，在目标方向无失真约束下最小化输出功率，抑制强干扰更好；但需要准确的 `R` 和导向矢量，要对角加载。
- 工程上 GSC 更常用：固定波束 + 阻塞矩阵 + 自适应抵消。

**Q26 DOA 怎么估计？GCC-PHAT 的原理？**

- 两麦互谱做相位变换：`R12(τ)=IFFT(X1 X2*/|X1 X2*|)`，峰值对应 TDOA，再换算角度。
- PHAT 加权抑制混响和幅度差异，低 SNR 下更鲁棒；多麦可用 SRP-PHAT 或 MUSIC。
- 注意空间混叠（间距 > λ/2）和阵列校准。

**Q27 ★ AGC 应该放在链路哪个位置？为什么？**

- 一般在 NS 之后、编码/VAD 之前；放太前会把噪声一起放大，放太后可能让编码器过载。
- 不能和 codec 的模拟 AGC 重复；VAD 要在 AGC 前或做增益补偿，避免判决被增益影响。
- 目标电平：语音 -26 ~ -18 dBFS，通话约 -20 dBFS。

**Q28 VAD 有哪些实现？hangover 的作用？**

- 能量+过零率、谱特征、GMM（WebRTC VAD）、DNN。
- hangover 在语音结束后保持 100—300 ms，防止尾音/弱音被切；太长会增加延迟和功耗。

**Q29 ★ 语音前端链路的推荐顺序？为什么？**

- `HPF → BF → AEC → NS → AGC → VAD`。
- HPF 先去 DC/低频；BF 提升目标方向 SNR；AEC 必须在非线性 NS 之前，否则回声路径被破坏；AGC 在 NS 后避免放大噪声；VAD 最后做门控。
- 每级要能 bypass，方便定位问题。

**Q30 去混响和丢包补偿分别怎么做？**

- 去混响：WPE 用线性预测估计晚期混响并从当前帧减掉，多通道效果更好；也可用谱域/深度方法。
- PLC：波形相似重复（WSOLA）、基音周期复制；Opus/LC3 内置 PLC；网络侧靠 jitter buffer + FEC。

### 5.3 Linux、驱动与 ALSA（Q31—Q42）

**Q31 ★ ASoC 的三大组件是什么？各自职责？**

- **Machine**：板级描述，定义 card、dai_link（CPU DAI ↔ Codec DAI）、widgets/routes、板级 ops。
- **Platform**：SoC 侧 I2S/TDM 控制器 + DMA（`snd_dmaengine_pcm`），负责数据搬运和时钟。
- **Codec**：codec 寄存器、时钟、DAPM、kcontrol、DAI ops。
- 三者通过 `snd_soc_card` 绑定，注册后出现 `/dev/snd/pcmCxDx*`。

**Q32 ★ DAPM 解决什么问题？**

- 动态管理 codec 内部和板级音频路径的电源，按当前活跃流自动上电/下电。
- 用 widget（mux/mixer/PGA/ADC/DAC/AIF/MIC/SPK/regulator）和 route 描述连接图。
- 好处：省电、避免 pop（按顺序上下电）、减少手动寄存器配置。
- 调试：`/sys/kernel/debug/asoc/<card>/dapm`。

**Q33 声卡注册/probe 的大致流程？**

- platform 侧注册 CPU DAI 和 DMA；codec 侧 i2c probe 注册 component/DAI/kcontrol/DAPM；machine probe 绑定 dai_link 并 `snd_soc_register_card()`。
- 之后 `hw_params` 设时钟/格式，`trigger` 启停 DMA，`pointer` 报位置。
- 任何一步失败都要检查 clock、regulator、pinctrl、DAPM route。

**Q34 ★ pop/click 声一般怎么产生？怎么解？**

- 上电/下电时序：PGA、功放 EN、静音引脚动作顺序不对。
- 直流突变：音量/增益阶跃、codec 电源跳变。
- 采样率切换、I2S 启停时 BCLK 突然断。
- 对策：DAPM 顺序、软静音 ramp、功放延时使能、clock 先稳再开流、输出端加 RC/去 pop 电路。

**Q35 ★ period 和 buffer 怎么选？**

- `buffer_size = period_size × periods`，通常 2—4 个 period。
- period 小 → 延迟低、唤醒频繁、xrun 风险高；period 大 → 延迟高、抗抖动好。
- 语音：10 ms period、30—40 ms buffer；低延迟：1—5 ms period、2—3 period；媒体：20—40 ms period。
- 必须用 `_near` 拿实际值，硬件可能不支持任意大小。

**Q36 hw_params 和 sw_params 的区别？**

- hw_params：硬件能力约束——格式、声道、采样率、period、buffer、access。
- sw_params：软件行为——start_threshold、stop_threshold、avail_min、silence、timestamp 模式。
- hw_params 必须在 prepare 前设置；sw_params 可在 prepare 后调整。

**Q37 mmap 和 read/write 模式的区别？**

- RW：内核/用户态拷贝，简单，但多一次 memcpy 和唤醒。
- mmap：用户态直接读写 DMA 缓冲，零拷贝、延迟低，但要自己管理 `appl_ptr/hw_ptr`、`mmap_begin/commit`。
- 低延迟/专业音频用 mmap；普通应用 RW 足够。

**Q38 ★ 写一个低延迟录音程序要注意什么？**

- 直接用 `hw:` 设备，避免 plug/PulseAudio 的额外缓冲。
- 选硬件支持的格式/采样率，period 1—5 ms，buffer 2—3 period。
- `SCHED_FIFO` + `mlockall`，回调里不 malloc/printf。
- 用 `poll`/`snd_pcm_wait` 等数据，处理 `-EPIPE`/`-ESTRPIPE`。
- 用 mmap 减少拷贝；时间戳用 `snd_pcm_status_get_htstamp`。

**Q39 ★ asound.conf 里 plug、dmix、dsnoop 各起什么作用？**

- `plug`：自动做格式/采样率/声道转换，让不匹配的应用也能播。
- `dmix`：多进程共享一个播放设备，软件混音。
- `dsnoop`：多进程共享录音设备，各自读取。
- 代价是额外缓冲/重采样，低延迟场景应绕开。

**Q40 PulseAudio、PipeWire、ALSA 是什么关系？**

- ALSA 是内核接口 + 用户态库，直接管硬件。
- PulseAudio/PipeWire 是声音服务器，跑在 ALSA 之上，做混音、路由、设备切换、网络音频。
- PipeWire 是新架构，兼容 PulseAudio/JACK，延迟更低；嵌入式语音前端常直接走 ALSA/tinyalsa。

**Q41 ★ 设备没声音，怎么排查？**

- `/proc/asound/cards` 看声卡是否注册；`dmesg` 看 probe/clock 错误。
- `amixer` 看 volume/mute/DAPM 路径；`aplay -D hw:0,0` 绕过插件。
- 看 `/proc/.../hw_params` 是否 RUNNING；示波器看 BCLK/LRCLK/DATA。
- 检查 MCLK、codec 供电、功放 EN、I2C 通信、pinmux。

**Q42 怎么查看当前采样率、格式和 xrun？**

- `cat /proc/asound/card0/pcm0p/sub0/hw_params` 看 rate/format/period/buffer。
- `cat .../status` 看 state（RUNNING/XRUN）、hw_ptr/appl_ptr、avail。
- `aplay -v` 打印实际参数；`snd_pcm_dump()` 打印软件配置。
- `dmesg` 里常有 underrun/overrun 计数。

### 5.4 架构与性能调优（Q43—Q52）

**Q43 ★ 端侧语音处理怎么分层？**

- 应用（ASR/通话/唤醒）→ 语音前端（HPF/BF/AEC/NS/AGC/VAD）→ 音频服务（ALSA/tinyalsa）→ 内核（ASoC/DMA/clock）→ 硬件（SoC/codec/功放/麦克风）。
- 前端可跑在主核、DSP 或 NPU；按实时性、算力、功耗划分。
- 接口要统一帧格式/采样率/时间戳，避免反复转换。

**Q44 ★ 实时音频线程怎么配置？**

- `SCHED_FIFO`，优先级 10—30（IRQ 线程更高，不要用 99）。
- `mlockall` 锁内存，预分配所有缓冲，避免 page fault。
- 绑核、关闭频繁调频、避免与低优先级线程共享锁。
- 用无锁队列/信号量通知，不用条件变量长时间阻塞。

**Q45 ★ 为什么音频回调里不能 malloc？**

- malloc 可能拿堆锁、触发 brk/mmap、page fault，最坏耗时不可控。
- 实时线程一旦被阻塞，period 就错过了，直接 xrun。
- 解决：初始化时预分配、用内存池/环形缓冲、所有缓冲静态化。

**Q46 ★ xrun 的根因怎么定位？**

- 先看是 underrun 还是 overrun，再看 `/proc/.../status` 的 avail 变化。
- `strace -T` 看应用 read/write/ioctl 是否超时；`perf sched latency` 看调度延迟。
- `cyclictest`/`hwlatdetect` 看系统抖动；`/proc/interrupts` 看中断是否被其它设备抢占。
- 常见：period 太小、回调里有 I/O、CPU 降频、内存回收、驱动长临界区。

**Q47 ★ CPU 占用太高，优化顺序是什么？**

- 先 profile（perf/ftrace）找热点，别猜。
- 算法：降采样、缩短滤波器、减小 FFT、子带处理、模型量化/剪枝。
- 实现：定点化、NEON、循环展开、查表、planar 布局、减少内存带宽。
- 系统：绑核、DMA 零拷贝、缓存友好、减少唤醒。
- 最后才考虑换硬件/offload。

**Q48 NEON 优化有哪些要点？**

- 数据对齐、连续访问、避免 gather/scatter；planar 布局更适合 SIMD。
- 用乘加（`vmlaq_f32`/`vmlal_s16`）、批量 load/store、减少水平求和。
- 注意 AArch32/AArch64 指令差异（如 `vaddvq_f32` 仅 AArch64）。
- 定点用 `vqdmulh`/`vqrdmulh` 做饱和 Q15 乘法。
- 优化后用 `perf stat` 看 IPC/cache miss，别只看周期数。

**Q49 ★ 定点还是浮点？怎么选？**

- 定点：功耗低、面积小、确定性强，适合 DSP/低端 MCU；但需要定标、易溢出、开发慢。
- 浮点：动态范围大、开发快，A55 以上 NEON 浮点性能足够；但功耗高、denormal 有坑。
- 量产常用定点，原型/主核用浮点；混合方案也常见（关键内核定点）。

**Q50 ★ 端侧音频怎么降功耗？**

- always-on 任务放 DSP/低功耗核，主核深度睡眠。
- 降低采样率/通道数，按场景动态切换。
- 合并唤醒、批处理、减少 CPU 进出 C-state。
- 关闭未用麦克风/功放，选低静态电流器件。
- 注意温度/降频对实时性的影响，留余量。

**Q51 ★ 多核/DSP offload 怎么划分？**

- 硬实时、固定算法（AEC/NS/BF/KWS）放 DSP；复杂/可变的（ASR/大模型）放主核+NPU。
- 划分依据：算力、延迟、功耗、内存带宽、开发成本。
- 核间通信用共享内存 + mailbox/ring buffer，注意 cache 一致性和同步开销。
- 要能回退到主核，便于调试和不同档位产品复用。

**Q52 ★ 音频延迟和音质怎么测试？**

- 延迟：环回脉冲、`latmus`、示波器、人工嘴/耳；分别测应用层和声学端到端。
- 音质：THD+N、SNR、频响、串扰、底噪、最大输出；用 AP/QA401/REW。
- 语音：PESQ/STOI/DNSMOS、ASR WER、唤醒率/误唤醒。
- 稳定性：72h soak、插拔/切换/suspend、统计 xrun。

### 5.5 场景设计（Q53—Q60）

**Q53 ★ 设计一个 4 麦远场语音前端，你会怎么做？**

- 硬件：4 个 MEMS（PDM 或 TDM），间距 10—40 mm，线性/环形按覆盖选；预留校准。
- 链路：PDM 抽取 → HPF → BF（DOA 选向）→ AEC → NS → AGC → VAD → KWS/ASR。
- 采样率 16k 处理，48k 采集后降采样；AEC 参考用播放链路。
- 算力：BF+AEC+NS 约 20—40% A53 单核，可 offload 到 DSP。
- 难点：麦克风一致性、混响、双讲、误唤醒、功耗。

**Q54 USB 会议扬声器怎么设计？**

- UAC2 声卡（异步反馈），上行多麦阵列，下行扬声器；AEC 参考取 USB 播放流。
- 全双工，延迟 20—40 ms；需要回声消除、降噪、AGC、自动增益。
- 结构上做隔振/导向，减少扬声器-麦克风耦合；产线校准麦克风。
- 兼容性：Windows/macOS/Linux/Teams/Zoom 的采样率与通道协商。

**Q55 ★ 设计一个 <20 ms 的游戏耳机，关键点？**

- 48 kHz、period 1—2 ms、buffer 2—3 period，直接 `hw:` + mmap，绕开 PulseAudio。
- 有线 USB/2.4G 优先；蓝牙用 LE Audio/LC3，A2DP 做不到。
- 不做重采样（统一 48k），算法 lookahead 尽量小，AEC 只在需要时开。
- RT 线程 + 绑核 + 关闭调频；端到端预算：ADC 1 ms + buffer 3 ms + 处理 2 ms + DAC 1 ms + 无线 5—10 ms。

**Q56 回声路径变化（设备移动、温度、音量）怎么处理？**

- 自适应滤波器要持续跟踪（泄漏/步长控制），但不能在双讲时发散。
- 用双滤波器/背景模型检测路径变化；AEC3 的延迟估计要持续更新。
- 音量变化会改变非线性回声，NLP 要按音量/功率自适应。
- 结构/温度引起的长期漂移靠鲁棒 NLP 兜底。

**Q57 ★ 只有单麦，怎么做降噪？**

- 传统：谱减/维纳/MMSE + 噪声估计（MCRA），配合 VAD 和增益平滑。
- 深度：RNNoise/DCCRN 等单通道模型，注意端侧算力。
- 单麦无法做空间滤波，风噪/混响/强干扰能力有限；可加物理结构（指向性麦、防风罩）。
- 切忌过度降噪损伤语音，宁可保守。

**Q58 44.1k 内容在 48k 设备上怎么处理？**

- 优先在解码后做一次高质量 SRC（soxr/libsamplerate），统一到 48k 再进混音。
- 不要用零阶保持/线性插值；注意 SRC 的群延迟和 CPU。
- 全链路只转一次，避免反复 44.1↔48；AEC 参考与麦克风必须同率。

**Q59 产线音频测试怎么做？**

- 治具：人工嘴/人工耳或耦合腔，标准声源，隔音箱。
- 测项：灵敏度、频响、THD+N、SNR、底噪、左右一致性、麦克风相位一致性、pop、电流。
- 快速筛选：播放扫频/多音，录音后分析；NG 判定阈值按机型标定。
- 校准数据写入设备（麦克风灵敏度/相位补偿）。

**Q60 ★ 线上投诉回声/啸叫，怎么排查？**

- 先复现：机型、音量、场景（免提/会议/车载）、固件版本；抓录音/参考信号。
- 回声：检查参考延迟对齐、AEC 是否被 bypass、NLP 强度、扬声器非线性、结构耦合。
- 啸叫：增益过大、麦克风指向扬声器、AEC 失效；加陷波/移频/限幅，优化结构。
- 对比良品/不良品，查麦克风一致性、装配、温度；必要时 OTA 调参。

---

## 附录 A：公式速查

```text
【电平】
dB(幅度) = 20*log10(A/A_ref)
dB(功率) = 10*log10(P/P_ref)
dBFS: 0 dBFS = 数字满刻度
dBu:  0 dBu = 0.775 Vrms，+4 dBu = 1.228 Vrms
dBV:  0 dBV = 1 Vrms，-10 dBV = 0.316 Vrms
dBSPL: 0 dBSPL = 20 uPa，94 dBSPL = 1 Pa

【量化】
SNR = 6.02*N + 1.76  (dB，满幅正弦)
ENOB = (SINAD - 1.76) / 6.02

【采样与时钟】
fs > 2*f_max
MCLK = 256/384/512 * fs
BCLK = fs * slot_bits * slots
LRCLK = fs
漂移样本数 = fs * ppm * 1e-6 * t

【缓冲与延迟】
单 period 延迟 = period_size / fs
buffer 延迟   = buffer_size / fs
buffer_size   = period_size * periods
端到端 ≈ ADC + period 等待 + buffer + 处理 + lookahead + DAC

【双二阶】
w0 = 2*pi*f0/fs
alpha = sin(w0)/(2Q)
LPF: b0=(1-cos)/2, b1=1-cos, b2=(1-cos)/2, a0=1+alpha, a1=-2cos, a2=1-alpha
HPF: b0=(1+cos)/2, b1=-(1+cos), b2=(1+cos)/2, a0=1+alpha, a1=-2cos, a2=1-alpha
Peak: A=10^(G/40), b0=1+alpha*A, b1=-2cos, b2=1-alpha*A,
      a0=1+alpha/A, a1=-2cos, a2=1-alpha/A
1/Q = 2*sinh( ln(2)/2 * BW * w0/sin(w0) )

【FIR】
y[n] = sum_k h[k]*x[n-k]
线性相位: h[n] = h[N-1-n]，群延迟 = (N-1)/2 采样

【动态】
x_dB = 20*log10(|x|)
y_dB = x_dB                    (x_dB <= T)
y_dB = T + (x_dB - T)/R        (x_dB > T)
alpha = exp(-1/(fs*tau))

【AEC / NLMS】
d(n) = s(n) + sum_k h[k]*x(n-k) + v(n)
e(n) = d(n) - w^T(n)*x(n)
w(n+1) = w(n) + mu*e(n)*x(n)/(||x(n)||^2 + delta)
ERLE = 10*log10(E[d^2]/E[e^2])

【波束成形 / DOA】
tau_m = m*d*sin(theta)/c
DAS: y(t) = (1/M)*sum_m x_m(t - tau_m)
MVDR: w = R^-1*d / (d^H*R^-1*d)
GCC-PHAT: R12(tau) = IFFT( X1(f)*conj(X2(f)) / |X1(f)*conj(X2(f))| )

【降噪】
谱减: |S_hat|^2 = max(|Y|^2 - alpha*|N_hat|^2, beta*|Y|^2)
维纳: G = xi/(1+xi)
MMSE-LSA: G = xi/(1+xi)*exp(0.5*∫_v^inf e^-t/t dt), v = xi*gamma/(1+xi)

【重采样】
L/M 有理数比率，44.1k -> 48k = 160/147
截止频率 = min(fs_in, fs_out)/2

【自由场】
声速 c ≈ 343 m/s (20°C)
1 m 距离 ≈ 2.9 ms
```

---

## 附录 B：命令速查

| 目的 | 命令 |
| --- | --- |
| 列声卡 | `cat /proc/asound/cards` |
| 列 PCM 设备 | `aplay -l`、`arecord -l` |
| 列逻辑设备 | `aplay -L` |
| 当前参数 | `cat /proc/asound/card0/pcm0p/sub0/hw_params` |
| 当前状态 | `cat /proc/asound/card0/pcm0p/sub0/status` |
| 播放测试 | `speaker-test -D hw:0,0 -c 2 -t sine -f 1000 -l 1` |
| 录音测试 | `arecord -D hw:0,0 -f S16_LE -r 48000 -c 2 -d 5 /tmp/t.wav` |
| 播放文件 | `aplay -D hw:0,0 /tmp/t.wav` |
| 打印支持参数 | `aplay -D hw:0,0 --dump-hw-params /tmp/t.wav` |
| Mixer 列表 | `amixer -c 0 scontrols` |
| Mixer 详情 | `amixer -c 0 contents` |
| 设音量 | `amixer -c 0 sset 'Master' 80%` |
| 保存/恢复 | `alsactl store`、`alsactl restore` |
| 驱动日志 | `dmesg \| grep -iE 'asoc\|snd\|codec\|i2s'` |
| DAPM 状态 | `cat /sys/kernel/debug/asoc/<card>/dapm` |
| 时钟树 | `cat /sys/kernel/debug/clk/clk_summary` |
| 中断 | `cat /proc/interrupts \| grep -i i2s` |
| I2C 探测 | `i2cdetect -y 0` |
| 系统调用耗时 | `strace -T -e trace=ioctl,read,write arecord ...` |
| 往返延迟 | `latmus`（alsa-tools） |
| tinyalsa | `tinymix`、`tinyplay`、`tinycap`、`tinypcminfo` |
| PulseAudio | `pactl info`、`pactl list short sinks` |
| PipeWire | `pw-top`、`wpctl status`、`pw-cli info all` |
| GStreamer | `gst-launch-1.0 alsasrc ! audioconvert ! alsasink` |

**性能与实时性**：

| 目的 | 命令 |
| --- | --- |
| CPU 热点 | `perf top -p <pid>` / `perf record -g -p <pid>` |
| 调度延迟 | `perf sched latency` |
| 函数图 | `ftrace`: `echo function_graph > current_tracer` |
| 跟踪 snd | `trace-cmd record -p function_graph -g 'snd_*'` |
| 实时抖动 | `cyclictest -t -p80 -n -i1000 -l10000` |
| 硬件停顿 | `hwlatdetect` |
| 功耗 | `powertop`、`turbostat` |
| 内存分配 | `heaptrack`、`valgrind --tool=massif` |

---

## 附录 C：术语表

| 缩写 | 全称 | 含义 |
| --- | --- | --- |
| ADC/DAC | Analog-to-Digital / Digital-to-Analog Converter | 模数/数模转换 |
| AEC | Acoustic Echo Cancellation | 声学回声消除 |
| AFE | Audio Front End | 语音前端 |
| AGC | Automatic Gain Control | 自动增益控制 |
| AOP | Acoustic Overload Point | 麦克风过载点 |
| ASRC | Asynchronous Sample Rate Conversion | 异步采样率转换 |
| BF | Beamforming | 波束成形 |
| DAPM | Dynamic Audio Power Management | ASoC 动态电源管理 |
| DMA | Direct Memory Access | 直接内存访问 |
| DOA | Direction of Arrival | 波达方向 |
| DRC | Dynamic Range Compression | 动态范围压缩 |
| ERLE | Echo Return Loss Enhancement | 回声抑制量 |
| FEC | Forward Error Correction | 前向纠错 |
| I2S | Inter-IC Sound | 双声道数字音频接口 |
| KWS | Keyword Spotting | 唤醒词检测 |
| LUFS | Loudness Units Full Scale | 响度单位 |
| MCLK | Master Clock | 主时钟 |
| MEMS | Micro-Electro-Mechanical System | 硅麦克风 |
| NS | Noise Suppression | 噪声抑制 |
| PBFDAF | Partitioned Block Frequency-Domain Adaptive Filter | 分块频域自适应滤波 |
| PDM | Pulse Density Modulation | 脉冲密度调制 |
| PGA | Programmable Gain Amplifier | 可编程增益放大器 |
| PLC | Packet Loss Concealment | 丢包补偿 |
| SRC | Sample Rate Conversion | 采样率转换 |
| STFT | Short-Time Fourier Transform | 短时傅里叶变换 |
| TDM | Time Division Multiplexing | 时分复用多声道接口 |
| THD+N | Total Harmonic Distortion + Noise | 总谐波失真加噪声 |
| TDOA | Time Difference of Arrival | 到达时间差 |
| UAC | USB Audio Class | USB 音频类 |
| UCM | Use Case Manager | ALSA 用例管理 |
| VAD | Voice Activity Detection | 语音活动检测 |
| WPE | Weighted Prediction Error | 去混响算法 |
| xrun | overrun / underrun | 缓冲溢出/欠载 |

---

## 附录 D：自测清单

按「能讲清原理 + 能指出取舍 + 能落到代码/命令」三个层次自评：每项 0（不会）、1（能说清）、2（能落地），共 60 项，满分 120。

**基础（12 项）**

- [ ] 采样定理与抗混叠，为什么 44.1/48/16k
- [ ] 量化噪声公式、ENOB、dither
- [ ] dBFS/dBV/dBu/dBSPL 换算，麦克风灵敏度链路
- [ ] sample/frame/block，planar/interleaved
- [ ] S24_3LE/S24_LE/S32_LE 的区别
- [ ] MCLK/BCLK/LRCLK 计算与 I2S 时序
- [ ] I2S/TDM/PDM/SoundWire 选型
- [ ] 时钟域漂移的计算与解法
- [ ] 延迟预算的组成与估算
- [ ] xrun 的成因、恢复、定位
- [ ] 语音为什么用 16 kHz
- [ ] 真峰值/intersample peak

**算法（18 项）**

- [ ] FIR/IIR 取舍，线性相位代价
- [ ] biquad 系数与 DF2T
- [ ] 低频数值精度问题
- [ ] 压缩器四参数与调参
- [ ] 限幅器 lookahead
- [ ] SRC 方法与质量指标
- [ ] ASRC/Farrow
- [ ] AEC 模型与 NLMS
- [ ] PBFDAF 与滤波器长度
- [ ] 双讲检测
- [ ] NLP/RES
- [ ] 谱减与 musical noise
- [ ] 维纳/MMSE-LSA
- [ ] 深度 NS 的端侧约束
- [ ] DAS/MVDR/GSC
- [ ] GCC-PHAT 与 DOA
- [ ] WPE 去混响
- [ ] PLC 与 jitter buffer

**Linux/驱动/ALSA（16 项）**

- [ ] ASoC 三件套
- [ ] DAPM widget/route
- [ ] 声卡 probe 流程
- [ ] DTS 配置 simple-audio-card
- [ ] hw_params/trigger/pointer
- [ ] period/buffer 选择
- [ ] hw_params vs sw_params
- [ ] RW vs mmap
- [ ] xrun 恢复代码
- [ ] asound.conf 插件
- [ ] PulseAudio/PipeWire 关系
- [ ] 没声音的排查顺序
- [ ] /proc/asound 各文件
- [ ] amixer/kcontrol
- [ ] pop 声的软硬件原因
- [ ] 低延迟录音程序要点

**架构/调优/场景（14 项）**

- [ ] 端侧语音分层
- [ ] 实时线程配置
- [ ] 回调禁忌
- [ ] 无锁环形缓冲
- [ ] xrun 根因树
- [ ] perf/ftrace/cyclictest
- [ ] NEON 优化
- [ ] 定点 vs 浮点
- [ ] denormal 处理
- [ ] CPU 预算估算
- [ ] 功耗优化
- [ ] DSP offload 划分
- [ ] 延迟/音质测试
- [ ] 4 麦远场方案

**两周复习建议**

| 天 | 内容 |
| --- | --- |
| D1—D2 | 第 1 章 + Q1—Q12，手推 SNR/时钟/延迟公式 |
| D3—D5 | 2.1—2.4 + Q13—Q18，写一个 biquad 和压缩器 |
| D6—D8 | 2.5—2.9 + Q19—Q30，画 AEC/NS/BF 数据流 |
| D9—D11 | 第 3 章 + Q31—Q42，实际跑 aplay/arecord/amixer |
| D12—D13 | 第 4 章 + Q43—Q52，用 perf/cyclictest 做一次实验 |
| D14 | Q53—Q60 场景题，模拟面试复述 |

---

## 延伸阅读

- ALSA 项目与文档：<https://www.alsa-project.org/>
- Linux 内核 ASoC 文档：<https://www.kernel.org/doc/html/latest/sound/soc/>
- PipeWire：<https://pipewire.org/>
- PulseAudio：<https://www.freedesktop.org/wiki/Software/PulseAudio/>
- Opus 编解码：<https://opus-codec.org/>
- WebRTC 音频处理（APM/AEC3/NS/AGC）：<https://webrtc.org/>
- ITU-R BS.1770 响度标准：<https://www.itu.int/rec/R-REC-BS.1770>

---

## 说明

- 本文是工程知识整理，性能数字为量级参考，具体以目标芯片、内核版本、codec 和算法实现为准。
- ALSA/ASoC 的 API 与调试接口随内核版本变化（尤其是 `simple-audio-card`、UCM、PipeWire），落地前查对应版本文档。
- 语音算法的最佳参数强依赖设备结构（麦克风间距、扬声器位置、腔体），不存在通用最优值，必须实测调参。
