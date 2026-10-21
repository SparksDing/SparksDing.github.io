---
title: 设备端音频（三）：Linux 音频栈——ASoC、DAPM 与 ALSA 实战
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - Linux
  - ALSA
  - ASoC
  - 驱动
---

> 本文是「设备端音频与语音处理」系列第 3 篇（共 7 篇）。系列导览：[从 pipeline 到 Linux 音频栈](/source-study/audio/)。

从 SoC 的 I2S 引脚一路讲到 `/dev/snd`：ASoC 三件套、DAPM、设备树、ALSA 的 period/buffer、asound.conf 和常用调试命令。

文末有一份可直接编译运行的 ALSA 采集代码，以及一套「没声音」的排查顺序。

<!-- more -->

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

**系列导航**：[系列导览](/source-study/audio/) · **下一篇**：[设备端音频（四）：端侧语音架构与性能调优](/source-study/audio/04-embedded-speech-architecture.html)
