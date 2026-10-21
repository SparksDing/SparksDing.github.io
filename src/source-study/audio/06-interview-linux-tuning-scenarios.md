---
title: 设备端音频（六）：面试问答 30 题（Linux、调优与场景）
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 面试
  - Linux
  - ALSA
  - 性能调优
---

> 本文是「设备端音频与语音处理」系列第 6 篇（共 7 篇）。系列导览：[从 pipeline 到 Linux 音频栈](README.md)。

后 30 题覆盖 Linux/驱动/ALSA、端侧架构与性能调优，以及 8 道场景设计题。建议先自己答一遍，再看要点。

<!-- more -->

## 面试问答（下）：Linux、调优与场景

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

**系列导航**：[系列导览](README.md) · **下一篇**：[设备端音频（七）：公式、命令、术语与自测清单](07-cheatsheet.md)
