---
title: 会话日志：模型历史是“算”出来的
isTimeLine: true
date: 2026-10-19
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - Session
  - 事件溯源
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。

大多数 agent 实现会维护一个 `messages: Message[]`，每次请求把它发给模型，再把新消息 push 进去。简单直接，但一旦要处理“恢复会话”“压缩历史”“fork 一个分支”“解释模型当时到底看到了什么”，这个数组就会变成一堆补丁。

DSH 换了一个更彻底的做法：**只记录 append-only 的事件流，模型历史在每次请求时推导出来。**

这篇讲清楚四件事：日志里记什么、surface 怎样决定模型看到什么、推导为什么能增量、以及日志怎样落盘和恢复。

## 1. Session 是一条只追加的事件流

`Session` 的核心是一个 `SessionEvent[]`，每个事件都有连续的 `seq`，并且必须是 lossless JSON（不能有 BigInt、循环引用、稀疏数组这些无法无损往返的值）。

事件类型由 `SessionEventMap` 声明，并且是 **merge-extensible** 的：插件可以通过声明合并往里加自己的事件（[`types.ts#L282`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/session/src/types.ts#L282)）。

核心事件可以分成几类：

| 类别 | 例子 | 是否进入模型历史 |
|---|---|---|
| 生命周期 | `turn/start`、`step/start`、`step/end`、`turn/end` | 否 |
| 模型可见消息 | `system/message`、`user/message`、`developer/message`、`assistant/message`、`tool/result` | 是 |
| 工具过程 | `tool/call` | 否（但 `tool/result` 是） |
| 请求元数据 | `request/header`、`request/context` | 否 |
| 失败尝试 | `assistant/attempt` | 否 |
| 插件记录 | `plugin:<owner>/<record>` | 否 |

一个典型的成功 step 在日志里长这样：

```text
turn/start
system/message        ← 渲染后的 system prompt（surface node 0）
user/message          ← 用户输入
request/header        ← provider/model/tools 的完整快照
assistant/message     ← 模型输出 + 内嵌的 timed stream
tool/call             ← 工具开始
tool/result           ← 工具结果（surface）
step/end
turn/end
```

注意 `assistant/message` 里除了消息内容，还嵌入了产生它的**紧凑 timed stream 记录**。这样“模型当时流出了什么”也能重放，而不是只剩下最终拼好的文本。

## 2. 只有 surface 事件决定模型看到什么

并非所有事件都会变成 `Message`。DSH 用一个 **surface** 的概念来区分：

- 五类 surface 事件：`system/message`、`developer/message`、`user/message`、`assistant/message`、`tool/result`；
- 每个 surface 事件在 append 时必须带 `surfaceOp`：`'append'` 或 `{ op: 'replace', startSeq, endSeq }`；
- 非 surface 事件不允许带 `surfaceOp`。

`replace` 是压缩和历史改写的关键。它不是删除旧事件，而是**让一段旧节点不再进入推导结果**。原事件仍然留在日志里，可以审计、可以回放。

surface 的折叠逻辑在 `foldSurface()`（[`surface.ts#L594`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/session/src/surface.ts#L594)）。它会校验：

- 替换范围必须是当前 surface 顺序里连续存在的节点；
- `startSeq` / `endSeq` 是闭区间；
- 替换不能覆盖 node 0 的 system prompt，除非替换事件本身也是 `system/message` 并且恰好覆盖它。

最后一条是安全相关的：system prompt 是模型行为的最高优先级指令，不允许被一个普通消息的 replace 悄悄换掉。

## 3. deriveMessages：增量、缓存、返回快照

`Session.deriveMessages()` 的实现很短（[`index.ts#L984-L1010`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/session/src/index.ts#L984-L1010)）：

```ts
deriveMessages(): Message[] {
  const surface = this.surface
  const nodes = surface.nodes
  const generation = surface.contentGeneration
  if (generation !== this.derivedGeneration) {
    this.derived = []
    this.derivedNodes = 0
    this.derivedGeneration = generation
  }
  for (const seq of nodes.slice(this.derivedNodes)) {
    const msg = this.deriveEventMessage(this.log[seq]!)
    if (msg) this.derived.push(msg)
  }
  this.derivedNodes = nodes.length
  return [...this.derived]
}
```

三个设计点：

1. **增量。** 正常情况下只处理新追加的 surface 节点，复杂度是 O(新增节点)。
2. **替换或投影变化时重建。** `contentGeneration` 变了就清空缓存；压缩、消息投影、replace 都会让它递增。
3. **返回新数组，但消息对象共享且深冻结。** 调用方可以安全地排序/切片这个数组，但不能改里面的 `Message`；日志不会被外部代码污染。

`deriveEventMessage()` 还会应用插件注册的 **message projection**。这让插件可以改变模型看到的内容，而不修改持久化事件本身；投影定义必须纯、可重放。声明了投影的事件在定义缺失时，append 会被拒绝。

## 4. request/header：请求也是可重建的

只有消息还不够。要重建一次模型请求，还需要知道：

- provider / model；
- reasoning effort、max tokens 等调用参数；
- 当时可见的工具 schema；
- adapter 补的默认值。

DSH 把这些写成 `request/header`，并在以下时机记录（[`session/README.md#L102-L104`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/session/README.md#L102-L104)）：

- 第一次请求（`initial`）；
- 恢复会话（`resume`）；
- envelope 变化（`change`）；
- 显式开启新的消息序列（`series`）。

同一序列内的后续 step、重试、普通 turn 继承最近的 header，不重复记录。

而 `request/context` 只记录 provider、model、context window、`systemPromptUpdate` 模式这些路由事实，并且只在变化时写。两者合起来，才能做到 **每个请求都是日志的纯函数**。

这带来一个很重要的推论：**prompt 不是 header 的一部分。** rendered system prompt 是 `system/message` 这个 surface 节点，不是请求头字段。这样 system prompt 的修改、清空、追加都能像普通消息一样被 surface 规则管理。

## 5. 持久化：句柄、批处理、耐久屏障

内存里的 `Session` 不负责落盘。持久化是一个独立的 capability seam：`ctx.sessionPersistence` 提供 `create` / `open` / `stat` / `list`，`create` 和 `open` 返回一个 per-session 的 `SessionHandle`（[`persistence.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/subsystems/persistence.md)）。

`SessionHandle` 只有四个核心操作：

```ts
read(offset?, length?, options?)   // 读一段合法前缀
append(events, options?)           // 追加一批连续事件
flush(options?)                    // 耐久屏障：返回即落盘
close()                            // 释放句柄 / 写所有权
```

几个关键语义：

- **单写者。** 同一个 session id 同时只能有一个写句柄；第二个 `open(id, 'write')` 会报 `SessionAlreadyOwnedError`，避免两个进程同时改一条日志。
- **append 是尽力而为，flush 才是承诺。** 后端可以缓冲、批量写；只有 `flush()` resolve 才保证崩溃后还在。
- **批处理窗口。** `session/event` 是同步通知，后端按 session id 路由到写句柄的缓冲区，固定窗口到期后批量 append；`session/flush` 会取消等待并排空。
- **未 materialize 的会话不存在。** `create()` 可以只返回句柄不写文件；在第一次 append 或 flush 之前崩溃，这个会话就等于没出现过。

## 6. JSONL 后端：文件布局与崩溃恢复

DSH 自带的后端是 `dsh-session-persistence-jsonl`。默认用 **Zstandard 帧**存储：header 一帧，之后每个 append 批次一帧，每帧带校验和；也可以配置 `compression: 'none'` 变成纯文本行。

磁盘布局大致是：

```text
<root>/
  --<normalized-cwd>--/
    <encoded-id>/
      session.v4.jsonl.zstd   ← 当前代
      session.v3.jsonl.zstd   ← 历史代，只读保留
      session.v2.jsonl.zstd
      session.v1.jsonl.zstd
      session.jsonl.zstd      ← v0
```

规则很硬：

- 已提交的代**永不重命名、覆盖或删除**；
- 读取时选编号最高的 canonical 代；
- 旧格式只在**写打开**时发布一个同目录的新代，源文件保持字节不变；
- 只读打开可以在内存里迁移，但不发布后继。

崩溃恢复的边界也划得很清楚：**持久化层只丢弃“未完成的物理尾帧”，不修复语义。** 如果日志停在一个没有 `turn/end` 的 turn 中间，恢复是读者（agent-loop）的职责：它通过写句柄读到合法前缀，算出缺失的 `tool/result`、`step/end`，再追加一个 `turn/end { reason: { kind: 'interrupted' } }`。

为什么不让存储层直接截断到最后一条完整记录？因为一个长时间运行的 turn 可能包含大量 step 和工具输出，那些事件在崩溃前已经 durable 了；截掉整个 turn 会丢失真实发生过的事实。

## 7. 为什么值得事件溯源

事件溯源在这个场景里买到了四样东西：

1. **重放。** 恢复会话不需要“把消息数组序列化再反序列化”，只需要重新推导。
2. **Fork。** `ctx.sessions.fork(source, boundary)` 复制一段精确的事件前缀，补上继承标记和必要的收尾事件，就得到一个独立子会话。
3. **压缩不丢历史。** compaction 用 `replace` 隐藏旧节点，原始事件仍在；审计和调试能看到“模型当时看到了什么、后来为什么不见了”。
4. **多消费者一致。** transcript、telemetry、session title、UI 时间线都从同一份日志推导，不会各存一份、各算一套。

代价同样明显：

- 日志会持续增长，压缩只影响推导，不减小磁盘占用；
- 每次 append 都要做 lossless JSON 校验和深拷贝，写路径比“push 一个对象”重；
- 格式迁移是长期负担，所以 DSH 用版本化代文件 + 相邻迁移链来隔离；
- `assistant/attempt` 会保留失败尝试的紧凑流，存储成本换诊断能力。

## 8. 一次恢复发生了什么

把上面的碎片拼起来，`ctx.agents.resume(sessionId)` 大致是：

```text
open(id, 'write')                  // 拿写句柄，排除并发恢复
  → read()                         // 读物理合法前缀
  → 找未闭合的 turn/step
  → 追加缺失的 tool/result
  → 追加 step/end、turn/end(interrupted)
  → 发布 Session
  → 后续 append 走同一个写句柄
```

之后 agent-loop 从恢复后的日志推导 messages，继续下一个 step。对模型来说，它只是看到了一段带“上次中断”说明的历史；对系统来说，没有凭空捏造任何模型没见过的内容。

## 小结

- Session 是 append-only 的 typed event log，`seq` 连续，事件必须是 lossless JSON。
- 只有 surface 事件进入模型历史；`replace` 隐藏节点但不删除事件。
- `deriveMessages()` 增量推导，替换/投影变化时重建，返回共享冻结消息的新数组。
- `request/header` + `request/context` 让每个请求都能从日志重建。
- 持久化通过 `SessionHandle` 单写者落盘；append 不保证耐久，`flush` 才保证。
- 崩溃恢复只丢弃未完成的物理尾帧，语义修复由 agent-loop 负责。

下一篇看模型适配层：`prepareCall()` 绑定了什么，`StreamChunk` 怎样变成消息，以及 DSH 为什么把重试放在 agent 的 `agent/request-error` 而不是 adapter 里。
