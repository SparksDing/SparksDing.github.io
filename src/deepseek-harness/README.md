---
title: DeepSeek Harness 源码阅读：从一条命令到一次工具调用
index: false
icon: book
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - Agent
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。项目还在 developer preview，接口和文件行号都变得很快；文中的链接都钉在这个 commit 上。

我用 dsh 有一段时间了。它能跑工具、能恢复会话、能在浏览器里实时看到模型在做什么，这些能力单独看都不稀奇；真正让我想读源码的是另一个问题：**为什么它敢把模型、工具、会话、甚至 agent 循环本身都做成可替换的插件？**

这套文章是我读源码后的笔记，不追求把每个文件讲一遍，而是沿着一条真实的调用链往下走：一条 `dsh web` 命令怎样变成一棵插件树，一次用户输入怎样变成 `turn/step`，模型返回的 tool call 又怎样经过审批、执行、落日志，最后回到浏览器。

## 这套文章想回答什么

- 启动：`dsh web` 之后发生了什么？profile、bundle、patch 各是什么？
- 组装：为什么说 DSH “没有核心”？Cordis 的 service、event、effect 怎样支撑这一点？
- 循环：一个 turn 和 step 的边界在哪里？取消、重试、工具调用怎样收尾？
- 工具：一个模型发起的调用，从参数校验到真正执行要过几道关？
- 记忆：模型看到的历史存在哪里？为什么换一个进程还能接着聊？
- 模型：provider adapter 的边界在哪里？流式 chunk 怎样变成一条消息？
- 前后端：浏览器和 SDK 怎样驱动同一个 runtime？

## 仓库地图

DSH 是一个 pnpm monorepo，第一次打开很容易迷路。先记住这几块：

| 路径 | 作用 |
|---|---|
| `apps/cli` | `dsh` 命令入口，解析参数后启动一个 profile |
| `apps/web` | 浏览器端入口，挂载 client 插件 |
| `apps/desktop` | Electron 外壳，复用同一套 Web 应用 |
| `packages/bundle` | profile 的“发行包”，本质是一层层 patch |
| `packages/boot` | profile 解析、Loader、启动审计 |
| `packages/core` | agent、agent-loop、session、tools、system-prompt |
| `packages/llm` | provider 无关的模型调用协议与各家 adapter |
| `packages/session` | 会话持久化、格式迁移、查询 |
| `packages/sandbox` | 进程沙箱，约束文件写入范围 |
| `packages/sdk` | 新行分隔 JSON-RPC 的客户端/服务端 |
| `packages/api` / `packages/host` / `packages/client` | Web GUI 的网关、Host、浏览器三侧 |
| `vendor/cordis` | 被 vendor 进来的插件框架 |
| `docs/` | 官方架构文档，读代码前值得先扫一遍 |

## 建议的阅读顺序

按兴趣选一条线，不必从第一篇顺着读：

- **想搞懂 agent 怎么跑**：03 → 04 → 05，再看 02 补 Cordis 基础。
- **想写插件或工具**：02 → 04 → 05，最后看 01 理解插件怎样被装进 profile。
- **想改前端或做集成**：07 → 03 → 05。
- **想部署或排查启动问题**：01 → 07。

## 先记住五个结论

1. **没有特权核心。** 模型 adapter、工具注册表、会话日志、agent 循环都是 Cordis 插件；扩展方式是“在旁边再挂一个插件”，不是改主流程。
2. **运行中的 dsh 是一棵合成出来的插件树。** profile 选 bundle，bundle 提供 patch，用户 patch 和 `--patch` 再覆盖；同一行配置按 id 后写获胜。
3. **`turn/step` 是持久事实，`agent/*` 是实时控制面。** 前者进 session log，重启后可重放；后者只存在于当前进程，用来观察和拦截正在发生的事。
4. **模型历史不单独存储。** 它是从 append-only 的 `SessionEvent` 日志里推导出来的；压缩和替换只是让旧节点不再进入推导结果，并不会删掉日志。
5. **工具调用不是一次函数调用。** 它是一条固定流水线：pre-execute → guard → execute → post-execute → finalize → result；审批挂在这条链上，沙箱则在 shell/fs 的能力边界生效。

## 怎么跟读

把源码固定在文章对应的 commit，然后善用两个入口：

```sh
# 看你这台机器实际会启动哪些插件行
dsh --profile web --dump-config

# 找一条调用链的起点，例如谁在消费 session/event
rg "session/event" packages -g '*.ts'
```

文章里的源码链接都指向 GitHub 的固定行号。行号会随上游变化，但函数名和文件名相对稳定；如果链接对不上，按名字在当前分支重新搜一次即可。

## 系列目录

| 篇目 | 主题 | 一句话 |
|---|---|---|
| [01 启动链路](01-boot.md) | profile / bundle / patch | 一条命令怎样拼出一棵插件树 |
| [02 Cordis](02-cordis.md) | service / event / effect | 为什么 DSH 没有“核心” |
| [03 Agent 主循环](03-agent-loop.md) | turn / step / inbox | 一次输入到一次工具调用的完整路径 |
| [04 工具与权限](04-tools.md) | 注册 / 校验 / 审批 / 执行 | tool call 要过哪四道关 |
| [05 会话日志](05-session.md) | event sourcing / 持久化 | 模型历史是“算”出来的 |
| [06 模型适配层](06-llm.md) | adapter / stream / chunk | 一次请求怎样变成流 |
| [07 SDK 与 Web](07-sdk-web.md) | JSON-RPC / Remote / WebSocket | 同一个 runtime 的两种外壳 |

如果只读一篇，我建议从 [03 Agent 主循环](03-agent-loop.md) 开始：它最能解释 DSH 为什么长成现在这样。
