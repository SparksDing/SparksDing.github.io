---
title: 设备端音频与语音处理：从 pipeline 到 Linux 音频栈
isTimeLine: true
date: 2026-10-21
category:
  - 学习源码
tag:
  - 音频
  - DSP
  - Linux
  - ALSA
  - 语音处理
---

这是一份面向设备端音频/语音岗位的系统笔记，也可以当作面试复习材料。它从 PCM 和时钟讲到 ALSA/ASoC，再到 AEC/NS/波束成形和端侧性能调优；每一节都尽量给出公式、代码或可验证的命令。

<!-- more -->

## 为什么写这个系列

设备端音频的难点很少是「某个算法不会」，而是**每一环都知道一点，但连不起来**：

- 知道采样率，但说不清 MCLK/BCLK/LRCLK 怎么算；
- 知道 AEC，但说不清参考信号为什么要对齐、双讲为什么要冻结；
- 知道 ALSA，但遇到 xrun 只会调大 buffer；
- 知道要优化，但说不清先动算法还是先动 NEON。

这个系列按「pipeline → 算法 → Linux 栈 → 端侧架构 → 面试问答」组织，目标是把这些环扣起来。

## 这个岗位在做什么

| JD 关键词 | 对应章节 | 面试真正会问的 |
| --- | --- | --- |
| 数字音频 pipeline、各环节原理 | 第 1 章 | 采样/量化/时钟、延迟从哪来、buffer 怎么定 |
| 常用音频算法、适用场景 | 第 2 章 | 为什么选 IIR 不选 FIR、AEC 为什么需要参考信号、NS 的代价 |
| 设备端音频应用开发 | 1.6、3.4、4.1 | 录音/播放程序怎么写、xrun 怎么恢复 |
| Linux 音频栈：硬件/驱动/设备管理/ALSA | 第 3 章 | ASoC 三件套、DAPM、period/buffer、asound.conf |
| 端侧语音处理架构与性能调优 | 第 4 章 | 实时线程、CPU 预算、NEON/定点、功耗与 offload |

一句话概括这个岗位：**把麦克风到云端/喇叭之间的每一毫秒、每一个采样点、每一份 CPU 和功耗都算清楚，并让它在真实设备上稳定跑住。**

## 如果只剩 10 分钟

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

## 系列目录

| 篇 | 标题 | 内容 |
| --- | --- | --- |
| 一 | [数字音频基础与 pipeline](01-digital-audio-pipeline.md) | 采样、量化、电平、PCM、时钟、延迟 |
| 二 | [常用音频算法与取舍](02-audio-algorithms.md) | 滤波、动态、SRC、波束成形、AEC、NS |
| 三 | [Linux 音频栈](03-linux-audio-stack.md) | ASoC、DAPM、设备树、ALSA、调试 |
| 四 | [端侧语音架构与性能调优](04-embedded-speech-architecture.md) | 实时线程、perf/ftrace、NEON、功耗 |
| 五 | [面试问答 30 题（基础与算法）](05-interview-basics-algorithms.md) | Q1—Q30 |
| 六 | [面试问答 30 题（Linux、调优与场景）](06-interview-linux-tuning-scenarios.md) | Q31—Q60 |
| 七 | [公式、命令、术语与自测清单](07-cheatsheet.md) | 速查与自测 |

## 怎么读

- **面试冲刺**：先看「如果只剩 10 分钟」，再刷第五、六篇的 60 题；答不上来的回到对应章节。
- **系统补齐**：按一 → 二 → 三 → 四顺序读，每篇末尾的代码和命令尽量跑一遍。
- **工程排障**：直接看第三篇的调试命令和第四篇的 xrun/性能部分，再回到第二篇确认算法边界。

## 原始长文

完整版（约 5.8 万字，含全部公式、代码与附录）也放在仓库里，方便一次读完或离线保存：[docs/audio-engineering-guide.md](https://github.com/SparksDing/SparksDing.github.io/blob/main/docs/audio-engineering-guide.md)。

## 说明

- 文中的性能数字是量级参考（以 Cortex-A53/A55、16 kHz 单通道、单核为基准），实测必须以目标板为准。
- ALSA/ASoC 的 API 与调试接口随内核版本变化，落地前查对应版本文档。
- 语音算法的最佳参数强依赖设备结构（麦克风间距、扬声器位置、腔体），不存在通用最优值。
