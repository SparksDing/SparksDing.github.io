---
title: 设备端音频（七）：公式、命令、术语与自测清单
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 音频
  - 速查
  - 面试
---

> 本文是「设备端音频与语音处理」系列第 7 篇（共 7 篇）。系列导览：[从 pipeline 到 Linux 音频栈](/source-study/audio/)。

公式、命令、术语和 60 项自测清单，适合放在手边随时查。公式按主题分组，命令按排查顺序组织。

<!-- more -->

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

---

**系列导航**：[系列导览](/source-study/audio/) · 全系列完。
