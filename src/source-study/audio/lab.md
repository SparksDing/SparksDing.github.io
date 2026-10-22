---
title: 设备端音频实验手册（配套）
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 音频
  - 实验
  - 树莓派
  - ALSA
  - AEC
  - 波束成形
---

> 本文是「设备端音频与语音处理」系列的配套实验手册。系列导览：[从 pipeline 到 Linux 音频栈](README.md)。

> 目标：用一套几百到一千多元的硬件，把「采样、量化、延迟、滤波、AEC、波束成形」这些抽象概念，变成**看得见、听得见、测得出**的现象。
>
> 每个实验 1—3 小时；不需要示波器也能做完前 6 个；3D 打印机主要负责转盘、支架和声学夹具。

<!-- more -->

---

## 0. 先选路线

| 路线 | 硬件 | 适合 | 能做的实验 |
| --- | --- | --- | --- |
| **A. Linux / ALSA（推荐先做）** | 树莓派 4B + USB 声卡 + 麦克风/喇叭 | 想理解 Linux 音频栈、延迟、AEC | 1—7 |
| **B. 2 麦阵列** | 树莓派 + ReSpeaker 2-Mic HAT | 想做波束成形、双麦 AEC | 8（AEC 可对比） |
| **C. 嵌入式（加分项）** | ESP32-S3 + INMP441 + MAX98357A | 想做实时 DSP、低功耗 | 进阶（降噪/完整链路） |

建议顺序：**A 的 1—6 → A 的 7 → B 的 8 → C 的进阶**。不要一上来就买 4 麦阵列；先把单麦和双麦玩明白。

---

## 1. 硬件：分三阶段买

### 阶段 1：最小可用（约 ¥600—800）

| 件 | 建议型号 | 数量 | 参考价 | 备注 |
| --- | --- | --- | --- | --- |
| 树莓派 | Pi 4B 4GB（或 Pi 5 4GB） | 1 | ¥450 | Pi 4B 对 HAT/驱动更友好 |
| 电源 + TF 卡 | 官方电源（Pi 4 5V/3A；Pi 5 5V/5A）+ 32GB | 1 | ¥90 | 别用劣质电源，否则 xrun 查不出来 |
| USB 声卡 | 带**独立绿色耳机孔 + 粉色麦克风孔**的 USB 声卡 | 1 | ¥30 | 不要买只有一个 TRRS 孔的，容易折腾 |
| 领夹麦 | 3.5mm 领夹麦 | 1 | ¥40 | 比声卡自带麦好定位 |
| 小喇叭 | 3W 4Ω 全频 + PAM8403 功放板 | 1 | ¥30 | 或用有源小音箱 |
| 3.5mm 对录线 + 电阻 | 10k / 100Ω 各几只 | 1 | ¥10 | 做电环回时要衰减 |
| USB 逻辑分析仪 | 8 通道 24MHz（配 PulseView） | 1 | ¥40 | 看 I2S 的 BCLK/LRCLK/DATA 神器 |

合计约 **¥700**。如果已有树莓派，约 ¥250 就能开始。

### 阶段 2：AEC 与波束成形（约 ¥200）

| 件 | 建议型号 | 数量 | 参考价 | 备注 |
| --- | --- | --- | --- | --- |
| 2 麦 HAT | ReSpeaker 2-Mic Pi HAT（WM8960） | 1 | ¥180 | 两路同步麦克风 + 耳机/喇叭输出 |
| 小喇叭 | 3W 4Ω + 3.5mm 插头 | 1 | ¥20 | 做 AEC 的远端声源 |

> 驱动提示：ReSpeaker HAT 需要装 Seeed 的 `seeed-voicecard` 驱动，内核升级后可能要重装。装不上就先用阶段 1 的 USB 声卡做 1—7；波束成形再解决 HAT。
>
> 如果 HAT 实在折腾不动，替代方案是**一台 2 通道 USB 音频接口**（如 Behringer UMC202HD），但价格会到 ¥600+，对新手不划算。

### 阶段 3：嵌入式（约 ¥80，可选）

| 件 | 建议型号 | 数量 | 参考价 |
| --- | --- | --- | --- |
| 主控 | ESP32-S3-DevKitC-1 | 1 | ¥40 |
| I2S 数字麦 | INMP441 / ICS-43434 | 1 | ¥10 |
| I2S 功放 | MAX98357A | 1 | ¥10 |
| 小喇叭 | 3W 4Ω | 1 | ¥10 |

### 不建议新手先买

- 4 麦 AC108 阵列：便宜，但驱动和通道映射容易把人劝退。
- 专业声卡 / Audio Precision：等你能明确要测 THD+N 时再买。
- 测量麦克风 UMIK-1（约 ¥800）：做频响校准很有用，但不是前 8 个实验的必需品。

---

## 2. 软件环境

### 2.1 树莓派

- 系统：Raspberry Pi OS **64-bit**（Bookworm 或 Bullseye 都行；HAT 驱动优先 Bullseye）。
- 打开 SSH 和 I2S（如果使用 HAT）：`sudo raspi-config` → Interface → I2S → Enable。
- 安装：

```bash
sudo apt update
sudo apt install -y alsa-utils sox ffmpeg python3-numpy python3-scipy \
                    python3-matplotlib python3-sounddevice python3-pip
```

- 可选：`sudo apt install -y alsa-tools`（里面有 `latmus`）。
- Python 虚拟环境不是必须的，但建议：

```bash
python3 -m venv ~/audio-lab
source ~/audio-lab/bin/activate
pip install numpy scipy matplotlib sounddevice
```

### 2.2 先确认声卡

```bash
arecord -l          # 看录音设备
aplay -l            # 看播放设备
```

USB 声卡通常是 `card 1`，设备名 `plughw:1,0`。测试：

```bash
speaker-test -D plughw:1,0 -c 2 -t sine -f 1000 -l 1
arecord -D plughw:1,0 -f S16_LE -r 48000 -c 1 -d 5 ~/test.wav
aplay   -D plughw:1,0 ~/test.wav
```

> 如果 `speaker-test` 没声音，先看 `alsamixer` 里有没有静音、音量是否为 0，再确认输出设备选的是 USB 声卡而不是 HDMI。

### 2.3 一个最小的录音/画图脚本

```python
# rec_plot.py
import numpy as np
import sounddevice as sd
import matplotlib.pyplot as plt
from scipy.signal import welch

fs = 48000
dur = 5
rec = sd.rec(int(dur * fs), samplerate=fs, channels=1, dtype="float32")
sd.wait()
x = rec[:, 0] if rec.ndim > 1 else rec
np.save("rec.npy", x)

t = np.arange(len(x)) / fs
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(t[: fs // 10], x[: fs // 10])
plt.xlabel("time (s)")
plt.ylabel("amplitude")
plt.subplot(1, 2, 2)
f, p = welch(x, fs, nperseg=8192)
plt.semilogx(f, 10 * np.log10(p + 1e-12))
plt.xlabel("frequency (Hz)")
plt.ylabel("dB")
plt.tight_layout()
plt.savefig("rec.png", dpi=120)
print("saved rec.npy / rec.png")
```

跑：

```bash
python3 rec_plot.py
```

对着麦克风说一句话、拍手、吹口哨，各录一次，看波形和频谱的区别。

---

## 3. 实验 1：看见声音（1 小时）

**要回答的问题**：一个「采样点」到底是什么？为什么频谱能看出音高？

**步骤**

1. 用手机播放 1 kHz 正弦（或 `speaker-test`），录 3 秒。
2. 用上面的脚本画波形和频谱。
3. 换成说话、拍手、钥匙碰撞，各录一次。
4. 把波形横轴放大到 5 ms，数一数 1 kHz 一个周期有几个采样点。

**你会看到**

- 1 kHz 正弦：波形是干净的正弦，频谱在 1 kHz 处有一根尖峰。
- 说话：波形包络忽大忽小，频谱是一排谐波（基频 + 2f + 3f…）。
- 拍手：波形是一个短脉冲，频谱很宽（像一条 broadband 的“毛”）。

**这说明什么**

- 采样点 = 每隔 `1/fs` 秒记一个电压值；48 kHz 就是每 20.8 µs 一个点，10 ms 就是 480 个点（period 常取 480 就是这个原因）。
- 1 kHz 一个周期 1 ms，48 kHz 下正好 48 个点。
- FFT 的分辨率 ≈ `fs / N`；`N=8192`、`fs=48k` 时约 5.9 Hz。

**扩展**：把 `nperseg` 改成 256、1024、8192，看频谱的“粗细”怎么变。

---

## 4. 实验 2：采样率与混叠（1.5 小时）

**要回答的问题**：为什么降采样前必须低通？15 kHz 的声音，降到 16 kHz 会变成什么？

**原理**

```text
奈奎斯特：fs > 2 * f_max
降采样到 fs_new 后，频率 f 会折叠成 |f - k*fs_new|
15 kHz 在 16 kHz 采样下 → |15k - 16k| = 1 kHz
```

**步骤（纯软件，先不碰硬件）**

```python
import numpy as np
from scipy.signal import resample_poly
import matplotlib.pyplot as plt

fs = 48000
t = np.arange(fs) / fs
x = np.sin(2 * np.pi * 15000 * t)

naive = x[::3]                    # 直接每 3 个取 1 个，降到 16k
proper = resample_poly(x, 1, 3)   # 先低通再降采样

from scipy.io import wavfile
wavfile.write("naive.wav", 16000, (naive * 32767).astype(np.int16))
wavfile.write("proper.wav", 16000, (proper * 32767).astype(np.int16))
```

1. 分别保存 `naive.wav` 和 `proper.wav`（16 kHz、16-bit），用喇叭播放。
2. 画两者的频谱。
3. 换成 7 kHz、1 kHz 再试。

**你会听到**

- 15 kHz 直接降采样：变成 **1 kHz 的哨音**（混叠）。
- 15 kHz 先低通再降采样：几乎没声音（15 kHz 被滤掉了）。
- 7 kHz 直接降采样：还是 7 kHz（没超过 8 kHz 的奈奎斯特）。

**这说明什么**

- 混叠不是“噪声”，而是**高频伪装成低频**，一旦发生就再也分不开。
- 降采样前必须低通；这就是 ADC 里抽取滤波器和 SRC 里抗混叠滤波器的意义。

**扩展**：用 `scipy.signal.chirp` 生成 20 Hz—20 kHz 扫频，重复上面的对比，听“扫频扫到高频时突然折返”的效果。

---

## 5. 实验 3：位深、量化与抖动（1 小时）

**要回答的问题**：16 bit 和 8 bit 差在哪？为什么加一点噪声反而更好听？

**步骤**

```python
import numpy as np

x = np.load("rec.npy")
x = x / (np.max(np.abs(x)) + 1e-9) * 0.9

def quantize(x, bits):
    q = 2 ** (bits - 1)
    return np.round(np.clip(x, -1, 1) * q) / q

def tpdf(n, q):
    # 两个均匀分布相减 = 三角分布（TPDF）
    return (np.random.rand(n) + np.random.rand(n) - 1) / q
```

1. 确保 `rec.npy` 是一段说话；上面的代码已归一化到 ±0.9。
2. 量化到 8、6、4 bit，保存并播放。
3. 对 4 bit 版本加 TPDF 抖动后再量化，播放对比。
4. 计算每种位深的 SNR：

```python
bits = 8
y = quantize(x, bits)
snr = 10 * np.log10(np.sum(x ** 2) / np.sum((y - x) ** 2))
print("SNR = %.1f dB" % snr)
```

5. 保存对比文件：

```python
from scipy.io import wavfile
fs = 48000
wavfile.write("q4.wav", fs, (quantize(x, 4) * 32767).astype(np.int16))
wavfile.write("q4_dither.wav", fs,
              (quantize(x + tpdf(len(x), 2 ** 3), 4) * 32767).astype(np.int16))
```

**你会听到**

- 8 bit：有轻微“沙沙”的量化噪声。
- 6 bit：明显颗粒感。
- 4 bit：像旧电话/对讲机，失真很重。
- 加 dither 后：失真变成均匀的“嘶嘶”声，听感更自然，但底噪变大。

**这说明什么**

- 理论 SNR ≈ `6.02N + 1.76` dB；16 bit 约 98 dB，8 bit 约 50 dB。
- 量化误差和信号相关时会产生谐波失真；dither 把它变成白噪声。
- 设备端录音通常不做 dither；但位深下变换（24→16）时值得考虑。

---

## 6. 实验 4：延迟与 buffer（2 小时，最重要）

**要回答的问题**：为什么音频有延迟？period 和 buffer 到底影响什么？xrun 是怎么来的？

**硬件**：树莓派 + USB 声卡 + 小喇叭 + 领夹麦。
**摆位**：喇叭和麦克风相距 20—30 cm，避免正对造成啸叫；音量先调小。

**步骤 1：测端到端延迟**

```python
import numpy as np
import sounddevice as sd

fs = 48000
click = np.zeros(fs)      # 1 秒
click[0] = 0.8            # 第一点就是一个脉冲
rec = sd.playrec(click, fs, channels=1, dtype="float32")
sd.wait()
rec = np.asarray(rec)
if rec.ndim > 1:
    rec = rec[:, 0]
peak = int(np.argmax(np.abs(rec)))
print("round-trip latency: %.1f ms" % (peak / fs * 1000))
```

- 测 10 次，取中位数。
- 把喇叭/麦克风距离从 20 cm 改到 50 cm，看延迟增加多少（声速 343 m/s，30 cm ≈ 0.87 ms）。

**步骤 2：改 blocksize，看延迟变化**

```python
for bs in [64, 256, 1024]:
    rec = sd.playrec(click, fs, channels=1, blocksize=bs, dtype="float32")
    sd.wait()
    rec = np.asarray(rec)
    if rec.ndim > 1:
        rec = rec[:, 0]
    peak = int(np.argmax(np.abs(rec)))
    print("blocksize=%4d  latency=%.1f ms" % (bs, peak / fs * 1000))
```

- blocksize 越小，延迟越低，但 CPU 唤醒越频繁。
- 如果 blocksize 太小，可能会听到“咔哒”或看到 `status` 报 underrun。
- 如果改了 blocksize 延迟不变，说明 PortAudio/驱动忽略了它；改用 `arecord --period-size/--buffer-size` 验证。

**步骤 3：用 ALSA 工具看参数**

```bash
arecord -D plughw:1,0 -f S16_LE -r 48000 -c 1 \
        --period-size=256 --buffer-size=1024 -d 5 ~/p256.wav

cat /proc/asound/card1/pcm0c/sub0/hw_params
cat /proc/asound/card1/pcm0c/sub0/status
```

重点看：`period_size`、`buffer_size`、`state`、`avail`。

**步骤 4：故意制造 xrun**

```bash
# 终端 A：小 buffer 录音
arecord -D plughw:1,0 -f S16_LE -r 48000 -c 1 \
        --period-size=64 --buffer-size=128 -d 20 ~/xrun.wav

# 终端 B：把 CPU 打满
for i in 1 2 3 4; do yes > /dev/null & done
sleep 10
kill %1 %2 %3 %4
```

- 听 `xrun.wav` 有没有断音/爆音。
- 看 `arecord` 是否打印 `overrun!!!`。
- 看 `/proc/asound/.../status` 是否出现 `XRUN`。

**你会看到**

- 延迟随 blocksize/period 增大而增大；不是线性，但趋势明显。
- 小 buffer + CPU 抢占 → overrun；大 buffer 能扛住，但延迟高。
- `state: XRUN` 时，应用必须 `prepare` 重新开始。

**这说明什么**

- 延迟 = ADC + period 等待 + buffer + 处理 + DAC + 声学传播。
- period 决定“多久处理一次”，buffer 决定“能扛多久的调度抖动”。
- 调延迟不是单纯把 buffer 调小，而是**在 xrun 和延迟之间找平衡**。

**失败排查**

- 没有峰值：麦克风没选对、静音、音量太小；先用 `arecord` 录一段说话确认。
- 一直啸叫：喇叭正对麦克风、音量太大；把喇叭转 90°、降低音量。
- 延迟测出来是 0：`playrec` 可能把输入输出对齐了；改用两个进程（一个 `aplay`、一个 `arecord`）或加一个已知的声学路径再测。

---

## 7. 实验 5：滤波器与 EQ（2 小时）

**要回答的问题**：低通/高通到底对声音做了什么？FIR 和 IIR 的差别在哪？

**步骤 1：软件滤波**

```python
from scipy.signal import butter, sosfilt, firwin, lfilter
import numpy as np, sounddevice as sd

fs = 48000
x = np.load("rec.npy")          # 实验 1 的录音
sos = butter(2, 1000, btype="low", fs=fs, output="sos")
y = sosfilt(sos, x)
sd.play(y, fs); sd.wait()
```

- 1000 Hz 低通：人声变闷，高频细节消失。
- 1000 Hz 高通：只剩“齿音”和噪声，低音没了。
- 把截止频率改成 200、3000、8000 Hz，各听一遍。

**步骤 2：扫频测频响**

```python
from scipy.signal import chirp
t = np.arange(fs * 5) / fs
sweep = chirp(t, 20, t[-1], 20000, method="logarithmic")
sd.play(sweep * 0.5, fs); sd.wait()
```

- 录下扫频，做 FFT，得到系统的频响。
- 分别播放“原始扫频”和“经过低通的扫频”，看高频掉了多少 dB。

**步骤 3：FIR vs IIR**

```python
h = firwin(101, 1000, fs=fs)
y_fir = lfilter(h, 1, x)
```

- FIR 101 tap 在 48 kHz 下群延迟约 `(101-1)/2 / 48000 ≈ 1.04 ms`。
- 用一声“咔哒”对比：IIR 的瞬态更“紧”，线性相位 FIR 会有轻微 pre-ringing。
- 把 FIR 抽头加到 1024，延迟约 10.7 ms，听感会明显“慢半拍”。

**你会看到**

- 低通后频谱高频下降；高通后低频下降。
- 截止频率越低，声音越闷；截止频率越高，越接近原声。
- FIR 阶数越高，过渡带越陡，但延迟越大。

**这说明什么**

- 滤波不是在“去掉某个频率”，而是在**改变幅度和相位**。
- 设备端语音链路通常用 IIR 做基础滤波（省算力、低延迟），需要线性相位时才用 FIR。

---

## 8. 实验 6：动态处理（1.5 小时）

**要回答的问题**：压缩器、限幅器、AGC 分别在做什么？为什么调不好会“抽吸”？

**步骤**

1. 录一段忽大忽小的说话（靠近/远离麦克风）。
2. 在 Audacity 或 Python 里做压缩：

```python
import numpy as np

fs = 48000
x = np.load("rec.npy")

def compressor(x, fs, threshold_db=-18, ratio=4,
               attack_ms=5, release_ms=100):
    # 简单的峰值包络 + dB 域增益
    env = np.abs(x)
    # 一阶平滑
    a_att = np.exp(-1 / (fs * attack_ms / 1000))
    a_rel = np.exp(-1 / (fs * release_ms / 1000))
    g = np.ones_like(x)
    for i in range(1, len(x)):
        a = a_att if env[i] > env[i - 1] else a_rel
        env[i] = a * env[i - 1] + (1 - a) * env[i]
        level_db = 20 * np.log10(env[i] + 1e-9)
        if level_db > threshold_db:
            target_db = threshold_db + (level_db - threshold_db) / ratio
        else:
            target_db = level_db
        g[i] = 10 ** ((target_db - level_db) / 20)
    return x * g, g
```

3. 画输入波形和增益包络 `g`。
4. 把 attack 改成 0.5 ms、release 改成 10 ms，再听。
5. 加一个“限幅器”：阈值 -1 dBFS，lookahead 2 ms，对比硬削波。

**你会听到**

- 压缩后小声部分被抬高、大声部分被压住，整体更“平”。
- attack 太短：低频失真、鼓点“发扁”。
- release 太短：声音一抖一抖的（pumping）。
- 硬削波：破音；限幅器：峰值被压住但不破。

**这说明什么**

- 压缩器是“把动态范围压小”，AGC 是“把长期电平稳定到目标”，限幅器是“保证峰值不超”。
- 三者时间常数不同：AGC 几百 ms—几秒，压缩 5—100 ms，限幅 < 1 ms。

---

## 9. 实验 7：AEC（3 小时，系列核心）

**要回答的问题**：为什么打电话时能听到自己的回声？AEC 怎么把它消掉？双讲时为什么不能一直自适应？

**硬件摆位**

```text
        ┌──────────────┐
        │   小喇叭      │  ← 播放远端语音（参考信号 x）
        └──────┬───────┘
               │ 20—30 cm
        ┌──────┴───────┐
        │  麦克风       │  ← 录到回声 d = h*x + 近端语音 + 噪声
        └──────────────┘
```

- 用 3D 打印一个底座，把喇叭和麦克风固定在 20—30 cm，角度可调。
- 先只放远端语音（单讲），确保麦克风能清楚录到回声。
- 音量中等，避免啸叫。

**步骤 1：同时播放和录音**

`far_speech.npy` 可以是自己录的一段话（单声道、归一化到 ±0.5），也可以用 Common Voice / LibriSpeech 的片段。

```python
import numpy as np, sounddevice as sd

fs = 48000
far = np.load("far_speech.npy")          # 远端语音，长度 5—10 秒
rec = sd.playrec(far, fs, channels=1, dtype="float32")
sd.wait()
d = rec[:, 0] if rec.ndim > 1 else rec
np.save("mic_d.npy", d)
sd.play(d, fs); sd.wait()      # 先确认能听到回声
```

**步骤 2：对齐参考信号**

```python
from scipy.signal import correlate
c = correlate(d, far, mode="full")
lag = c.argmax() - (len(far) - 1)
x = np.roll(far, lag)     # 试 lag 和 -lag，选 ERLE 高的那个
```

**步骤 3：NLMS 回声消除**

```python
def nlms(d, x, L=1024, mu=0.3, delta=1e-6):
    w = np.zeros(L)
    e = np.zeros_like(d)
    for n in range(L, len(d)):
        xv = x[n - L:n][::-1]
        y = np.dot(w, xv)
        e[n] = d[n] - y
        w += mu * e[n] * xv / (np.dot(xv, xv) + delta)
    return e

e = nlms(d, x, L=1024, mu=0.3)
erle = 10 * np.log10(np.sum(d ** 2) / np.sum(e ** 2))
print("ERLE = %.1f dB" % erle)
```

> 先用 16 kHz、L=512 跑通；48 kHz + L=1024 在纯 Python 循环里会偏慢，可以用 NumPy 向量化，或改用 C/WebRTC APM。

- 先听 `d`（有回声），再听 `e`（回声被消掉）。
- 正常单讲，ERLE 应该能到 **10—25 dB**（小喇叭、短距离）。
- 把 `mu` 调到 0.01 / 0.5，看收敛速度和稳定性。

**步骤 4：双讲**

- 播放远端语音的同时，对着麦克风说“你好”。
- 不做双讲检测：近端语音会被一起消掉，听起来“断字”。
- 加一个简单的双讲检测：当 `|d| > 2*|y|` 时冻结自适应。

```python
# 双讲检测：在更新 w 之前判断
# if abs(d[n]) > 2 * abs(y) + 1e-6:
#     continue        # 冻结本次自适应
```

**你会听到/看到**

- 对齐后：回声明显变小，ERLE 上升。
- 参考没对齐：怎么调都消不干净，滤波器长度也不够。
- 双讲时：不冻结 → 近端被消；冻结 → 近端保留，但回声残留多一点。
- 音量变大：扬声器非线性，线性 AEC 消不干净，需要 NLP。

**这说明什么**

- AEC 的三件事：**参考对齐、双讲冻结、非线性残留抑制**。
- 线性 AEC 只能消 20—40 dB；剩下的靠 NLP/RES。
- 真实设备还要处理时钟漂移、扬声器失真、结构振动。

**进阶对比**

- 用 PulseAudio 的 `module-echo-cancel` 或 WebRTC APM 跑同一段录音，比较 ERLE 和听感。
- 把喇叭换成手机外放、把麦克风换成耳机麦，感受不同设备的回声路径差异。

---

## 10. 实验 8：双麦波束成形（3 小时）

**要回答的问题**：两个麦克风怎么“指向”一个方向？为什么高频会有栅瓣？

**硬件**：ReSpeaker 2-Mic HAT（或任何双通道同步麦克风）+ 3D 打印转盘。

**3D 打印转盘**

- 直径 200 mm 的圆盘，每 15° 一个刻度。
- 中心一个竖直支架，把 HAT 固定在“耳朵高度”（离桌面约 30 cm）。
- 一个指针指向刻度；用手转动，或用小电机（可选）。

**步骤 1：测两个麦克风的间距**

- 用卡尺量 HAT 上两个麦克风中心的距离 `d`（例如 58 mm）。
- 写进代码时换成米：`d = 0.058`；公式 `tau = d * sin(theta) / c` 里的 `d` 是米。

**步骤 2：录双通道**

```bash
arecord -D plughw:1,0 -f S16_LE -r 48000 -c 2 -d 5 ~/stereo.wav
```

> 设备号以 `arecord -l` 为准；ReSpeaker HAT 可能是 `hw:1,0` 或 `hw:2,0`。

- 喇叭放在 0°、30°、60°、90°，各录一段 1 kHz 正弦或说话。
- 保持音量固定，距离固定（例如 50 cm）。
- 如果左右声道反了，交换 `x[:,0]` 和 `x[:,1]`。

**步骤 3：GCC-PHAT 估时差**

```python
import numpy as np
from scipy.io import wavfile

fs, x = wavfile.read("stereo.wav")
x = x.astype(np.float32) / 32768

def gcc_phat(x1, x2, fs):
    X1 = np.fft.rfft(x1)
    X2 = np.fft.rfft(x2)
    R = X1 * np.conj(X2)
    R /= np.abs(R) + 1e-12
    cc = np.fft.irfft(R)
    lag = np.argmax(cc)
    if lag > len(cc) // 2:
        lag -= len(cc)
    return lag / fs
```

- `tau = gcc_phat(x[:,0], x[:,1], fs)`
- 角度估算：`theta = arcsin(tau * c / d)`，`c=343`。
- 检查 0° 时 `tau≈0`，30° 时 `tau≈d*sin30/c`。

**步骤 4：延迟求和**

```python
def delay_and_sum(x, fs, d, theta_deg, c=343.0):
    theta = np.deg2rad(theta_deg)
    tau = d * np.sin(theta) / c
    n = int(round(tau * fs))
    if n >= 0:
        y = x[n:, 0] + x[:len(x) - n, 1]
    else:
        y = x[:n, 0] + x[-n:, 1]
    return y
```

- 对 0° 录音，把 `theta` 从 -90° 扫到 +90°，画输出能量。
- 峰值应该在 0°。
- 换 30° 录音，峰值应该移到 30°。

```python
import matplotlib.pyplot as plt

angles = np.arange(-90, 91, 5)
energy = [np.sum(delay_and_sum(x, fs, d, a) ** 2) for a in angles]
plt.polar(np.deg2rad(angles), energy)
plt.savefig("beam.png", dpi=120)
```

**你会看到**

- 目标方向增强，其他方向减弱。
- 频率越高，主瓣越窄；当 `d > λ/2` 时出现栅瓣（空间混叠）。
- 1 kHz 时 λ=343 mm，d=58 mm < λ/2，没问题；8 kHz 时 λ=43 mm，d=58 mm > λ/2，开始混叠。

**这说明什么**

- 波束成形 = 对不同麦克风的时延做补偿，再相加。
- 阵元间距和频率决定主瓣宽度和栅瓣。
- 真实阵列还要校准麦克风灵敏度/相位，否则零陷变浅。

---

## 11. 进阶：降噪与完整链路（各 2—3 小时）

### 11.1 降噪

1. 在干净语音里加风扇噪声/白噪声（软件混合，可重复）。
2. 实现谱减法：

```python
# 伪代码：STFT -> 估计噪声 -> 减 -> ISTFT
# 用 scipy.signal.stft / istft
```

3. 听“音乐噪声”（musical noise），观察过减因子和谱下限的影响。
4. 对比 `noisereduce` 库、WebRTC NS、RNNoise。
5. 指标：PESQ、STOI、ASR 词错率；至少做一次“降噪后 ASR 是变好还是变差”的对比。

### 11.2 完整链路

```text
麦克风 → HPF → 波束成形 → AEC → NS → AGC → VAD → 录音/识别
```

- 用 Python 把前面的模块串起来，先离线跑。
- 再做成实时流（`sounddevice.Stream` 回调），测 CPU 和延迟。
- 对比“每级都开”和“逐级 bypass”的听感/识别率。
- 记录：CPU 占用、端到端延迟、xrun 次数。

---

## 12. 3D 打印件清单

| 件 | 尺寸/要点 | 用途 |
| --- | --- | --- |
| 扬声器-麦克风支架 | 距离 20/30/50 cm 可调，角度可调 | AEC 实验 |
| 转盘 | 直径 200 mm，15° 刻度，竖直 HAT 支架 | 波束成形 |
| HAT 立架 | 离桌面 30 cm，麦克风不被遮挡 | 波束成形/录音 |
| 麦克风杆 | 20/40/60 mm 孔距，6.2 mm 孔 | 外接麦克风阵列（可选） |
| 树莓派外壳 | 留出 USB/3.5mm 孔 | 保护板子 |
| 线缆固定夹 | 防止拉拽麦克风 | 减少噪声 |

打印建议：

- 0.2 mm 层高、3 圈壁、15% 填充。
- 麦克风孔用钻头/锉刀修整，内壁光滑，避免风噪。
- 转盘刻度可以用双色换色或后期填漆。
- 支架底部加橡胶脚垫，减少桌面振动。

> 需要的话我可以再给你一版参数化 OpenSCAD：转盘、HAT 支架、可调距离的扬声器臂。

---

## 13. 六周计划（每周 2—4 小时）

| 周 | 内容 | 产出 |
| --- | --- | --- |
| 1 | 装系统、确认声卡、实验 1 | 一段录音 + 波形/频谱图 |
| 2 | 实验 2、3 | 混叠对比音频、量化/dither 对比 |
| 3 | 实验 4 | 延迟- blocksize 曲线、一次 xrun 记录 |
| 4 | 实验 5、6 | 频响图、压缩前后波形/增益包络 |
| 5 | 实验 7 | AEC 前后音频、ERLE 数字、双讲对比 |
| 6 | 实验 8 | 双麦录音、GCC-PHAT 角度、波束极坐标图 |

如果只有周末：每周做一个实验，两个月也能走完。

---

## 14. 记录模板与安全

### 每次实验记录

```text
日期：
实验：
硬件/接线：
关键参数（fs / period / buffer / 增益 / 距离 / 角度）：
听到：
看到（图/数字）：
结论（一句话）：
下次要改：
```

### 安全

- **音量**：长时间保持在 75—80 dB(A) 以下；15 kHz 扫频用低音量，别贴耳。
- **啸叫**：麦克风和喇叭不要正对；先小音量，再慢慢加。
- **电环回**：不要把喇叭输出直接插进麦克风输入；非要做的话，先串 10k、再并 100Ω 分压，并从最小音量开始。
- **供电**：树莓派用正规 5V/3A 电源；USB 声卡不要和功放抢电。
- **3D 打印**：通风；麦克风孔去毛刺；不要把打印件放进嘴里。

---

## 15. 实验和文章对应表

| 实验 | 概念 | 对应文章 |
| --- | --- | --- |
| 1 | 采样、帧、FFT、dBFS | 设备端音频（一）1.1—1.4 |
| 2 | 奈奎斯特、抗混叠、降采样 | 设备端音频（一）1.1；二 2.4 |
| 3 | 量化噪声、ENOB、dither | 设备端音频（一）1.2 |
| 4 | period/buffer、xrun、端到端延迟 | 设备端音频（一）1.7；三 3.4 |
| 5 | biquad、FIR/IIR、群延迟 | 设备端音频（二）2.2 |
| 6 | 压缩、限幅、AGC | 设备端音频（二）2.3 |
| 7 | NLMS、双讲、NLP、ERLE | 设备端音频（二）2.6 |
| 8 | 延迟求和、GCC-PHAT、栅瓣 | 设备端音频（二）2.5 |
| 进阶 | 谱减、维纳、完整链路 | 设备端音频（二）2.7—2.9 |

---

## 16. 最小成功标准

做完前 8 个实验，你应该能不看稿讲清这 6 件事：

1. 48 kHz、16 bit、一帧 480 点，分别是什么意思。
2. 15 kHz 降到 16 kHz 为什么会变成 1 kHz。
3. period 和 buffer 如何影响延迟与 xrun。
4. 低通/高通在频域和时域分别做了什么。
5. AEC 为什么需要参考信号，双讲为什么要冻结。
6. 两个麦克风的时差如何变成方向，为什么高频会有栅瓣。

如果这 6 条都能用自己的实验数据讲出来，指南里的公式就不再是“看不懂”，而是你测量过的现象。

---

**返回**：[设备端音频与语音处理系列导览](README.md)
