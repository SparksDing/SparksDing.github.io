---
title: 设备端音频（一）：数字音频基础与 pipeline
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 音频
  - DSP
  - 采样
  - 时钟
---

> 本文是「设备端音频与语音处理」系列第 1 篇（共 7 篇）。系列导览：[从 pipeline 到 Linux 音频栈](README.md)。

先把「声音怎么变成一串数」讲清楚：采样、量化、电平、PCM 布局、时钟和 buffer。这些概念决定了后面所有算法的输入质量，也决定了延迟和 xrun 的边界。

这一篇不急着讲算法，而是把 pipeline 的每一环拆开：ADC 之前发生了什么、I2S/TDM 的时钟怎么算、ALSA 的 period 和 buffer 如何影响端到端延迟。

<!-- more -->

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

**系列导航**：[系列导览](README.md) · **下一篇**：[设备端音频（二）：常用音频算法与取舍](02-audio-algorithms.md)
