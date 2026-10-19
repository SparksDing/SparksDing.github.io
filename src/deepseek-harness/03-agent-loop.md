---
title: 一个 turn 的一生：DSH Agent 主循环
isTimeLine: true
date: 2026-10-19
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - Agent
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。

如果只读一个包来理解 DSH，我会选 `packages/core/agent-loop`。它把“调模型、跑工具、把结果写进历史、再来一轮”这件看起来很朴素的事，拆成了一个个可观测、可取消、可重放的状态。

这篇按时间顺序走一遍：一条用户消息进来，`ReactLoopAgent` 怎样开启 turn、认领输入、组装请求、流式接收、调度工具、写日志，最后决定“继续下一步”还是“结束这一轮”。

## 1. 先把两个词定义清楚

DSH 的文档里反复出现 **step** 和 **turn**，它们不是同义词：

- **step**：一次模型请求，加上它请求的工具调用。
- **turn**：零个或多个 step。它在认领第一条输入之前打开，在“没有任何东西还欠着”时关闭。

所以一个 turn 可能包含多个 step（模型调工具 → 拿到结果 → 再请求一次），也可能一个 step 都没有（输入被 `agent/pre-step` 拒绝，或者第一批输入为空）。

这个区分很重要，因为很多状态是**按 turn 结算**的，而模型请求是**按 step 发生**的。比如 `turn/end` 要记录这一轮为什么结束，`step/end` 只表示这一次请求和它的工具都处理完了。

## 2. 驱动入口：`kick()` 和 `turn()`

`ReactLoopAgent` 是 `Agent` 接口的默认实现（[`agent.ts#L98`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L98)）。它的主循环非常简单：

```ts
private async kick(): Promise<void> {
  try {
    while (await this.turn()) {}
  } catch (_error) {
    // 失败和取消在 driver 边界被收口
  } finally {
    // 回到 idle，必要时重新唤醒
  }
}
```

见 [`agent.ts#L252-L268`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L252-L268)。

`turn()` 返回 `true` 表示还有排队的工作，需要再开一轮；返回 `false` 表示可以回到 idle。注意 catch 里那句注释：**错误不是在这里被吞掉，而是在这里被收口**。真正的失败已经写进了 `turn/end` 的 reason，或者通过 `agent/*` 事件报告给了调用方。

## 3. 开 turn：先记账，再认领

`turn()` 的第一件事是写 `turn/start`：

```ts
this.session.append('turn/start', { turn })
```

见 [`agent.ts#L307`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L307)。

为什么先写日志再干活？因为 session log 是**唯一事实来源**。如果进程在认领输入之后、请求模型之前崩溃，恢复时至少知道“有一个 turn 开过”，可以补一个 `turn/end { kind: 'interrupted' }`，而不是留下一个无法解释的悬空状态。

然后进入循环：

```ts
while (true) {
  const step = phase.step + 1
  const decision = await this.preStep(target, { turn, step })
  if (decision.kind === 'reject') { ... }
  if (phase.step === 0 && decision.messages.length === 0) { ... }
  this.session.append('step/start', { turn, step })
  const stepEnd = await this.step(decision)
  ...
  this.session.append('step/end', { turn, step })
}
```

见 [`agent.ts#L315-L365`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L315-L365)。

这里有几个容易忽略的细节：

- **第一个 step 之前认领的是“待处理的 next-step 输入 + 一条排队 prompt”**；后续 step 之间只认领 next-step 输入。这对应两种不同的输入：新的用户消息（开启新 turn）和 steering（在当前 turn 内插话）。
- **被拒绝的 pre-step 仍然开过 turn**，只是不产生 step。所以日志里会出现 `turn/start` 紧跟 `turn/end`，中间没有 `step/start`。
- **`step/end` 放在 finally 里**。即使 `step()` 抛错，这一步也要有结束记录，否则恢复逻辑无法判断哪些工具调用已经完成。

## 4. pre-step：把“输入”变成“可请求的消息”

`preStep()` 是整个循环里最像“策略层”的部分（[`agent.ts#L270-L291`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L270-L291)）：

```ts
const claimed = this.inbox.claim(target, position.turn)
const assembly = await this.loopCtx.systemPrompt.assemble(...)
const decision = await this.dispatch.waterfall(
  'agent/pre-step', { messages: claimed, ...position, signal },
  () => Promise.resolve({ kind: 'enter', messages: claimed }),
)
```

三件事：

1. **认领**：从 inbox 里拿走本轮要处理的输入。认领会提交一个持久的 `agent/inbox/spliced` 事件，并发出实时的 `agent/inbox/claimed` 通知，所以重放时能还原“哪些消息属于哪个 turn”。
2. **组装提示词**：`ctx.systemPrompt.assemble()` 收集所有注册的 section、工具 schema、变量。注意这一步发生在 pre-step **之前**：默认的 enter 决策需要把运行时上下文投影进消息，后续请求也要用这份组装结果；pre-step 监听器拿到的则是已经认领的消息和位置信息。
3. **跑 waterfall**：`agent/pre-step` 的监听器可以改写消息、拒绝这一步，或者声明“从这里开始一个新的请求序列”。默认实现会把运行时上下文投影进消息，再一起交出去。

`agent/pre-step` 是 DSH 里最常用的扩展点之一：时间上下文、`AGENTS.md` 注入、compaction 的压力检查、session reference 都在这里挂。它们不需要改循环，只需要在下游结果上追加或拒绝。

## 5. step：准备请求、提交输入、流式接收

进入 `step()` 后，先做两件异步的事（[`agent.ts#L400-L425`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L400-L425)）：

```ts
const { config, preparedCall } = await this.prepareRequest(turn, step, signal)
```

`prepareRequest()` 会：

- 从 `request/header` 恢复上一次的 route 和显式参数；
- 跑 `agent/request` waterfall，允许插件改 provider / model / reasoning effort；
- 调 `ctx.llm.prepareCall()`，让 adapter 解析模型能力、补默认值、校验参数。

见 [`agent.ts#L563-L610`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L563-L610)。

`prepareCall()` 返回的是一个 **one-shot** 的 prepared call（[`llm/src/index.ts#L956-L1020`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/index.ts#L956-L1020)）：它绑定了 adapter 这一代的能力、默认值和重试策略，只能 dispatch 一次。这样即使中途 HMR 换了 adapter，也不会出现“用 A 的能力解析、用 B 的端点发送”的错配。

接着，循环把系统提示词和用户消息**按顺序**提交到日志：

```ts
for (const { message, intent } of commits) {
  this.session.append('system/message', { turn, step, message }, intent)
}
for (const message of decision.messages) {
  this.session.append('user/message', message, { surfaceOp: 'append' })
}
```

见 [`agent.ts#L416-L437`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L416-L437)。

这里有一个很关键的设计：**请求不是从一份单独维护的 messages 数组拼出来的，而是从刚写进日志的 surface 推导出来的**。`buildRequest()` 会写 `request/header`，然后从 `session.deriveMessages()` 拿到完整历史。这就是“模型可见 ⟺ 已记录”（model-visible ⟺ logged）的落地方式。

## 6. 流式接收：chunk 与消息是两条通道

模型开始返回后，循环同时做两件事：

- **实时通道**：每个 chunk 通过 `agent/assistant-stream` 事件推给 UI。它是 process-local 的，不落日志。
- **持久通道**：`AssistantStreamAttempt` 在内存里累积完整的 timed stream；成功结束时写一条 `assistant/message`，失败/取消/重试则写 `assistant/attempt`。

```ts
live.start()
for await (const chunk of stream) {
  signal.throwIfAborted()
  live.push(chunk)
}
```

见 [`agent.ts#L451-L460`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L451-L460)。

成功时的落账：

```ts
live.settle('assistant/message', () => this.session.append('assistant/message', {
  turn, step, message, usage, stream: live.stream,
}, { surfaceOp: 'append' }).seq)
```

见 [`agent.ts#L529-L546`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L529-L546)。

为什么要区分 `assistant/message` 和 `assistant/attempt`？

- `assistant/message` 是**模型可见历史**的一部分，会进入下一次请求。
- `assistant/attempt` 只保留失败、取消、重试等没有产生最终消息的尝试（包括它的原始流），用于重放、诊断和 token 统计，但**不进入历史**。否则一次失败的半截回答会污染后续对话。

## 7. 工具调度：barrier + 有界并发池

如果模型返回了 tool call，`step()` 会调用 `executeToolCalls()`（[`tool-calls.ts#L60-L102`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/tool-calls.ts#L60-L102)）。

调度规则不复杂，但很讲究：

1. 按模型给出的顺序遍历调用；
2. 用 `ctx.tools.executionMode(exec)` 查这个调用是 `parallel` 还是独占；
3. 独占调用单独成组，形成**屏障**；
4. `parallel` 调用进入一个有界滚动池，最多 `maxParallelToolCalls` 个同时执行；
5. **结果按模型顺序提交**，即使实际完成顺序不同。

```ts
const mode = ctx.tools.executionMode(first.exec).kind
const group = mode === 'parallel' ? planned.slice(next) : [first]
const outcome = await runGroup(ctx, turn, step, group, mode, signal, acceptContext)
```

见 [`tool-calls.ts#L83-L100`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/tool-calls.ts#L83-L100)。

“按模型顺序提交”是这里最容易低估的点。工具 A 和 B 并发执行，B 先完成，但日志里仍然先写 A 的 `tool/result`，再写 B 的。这样重放时工具结果和 assistant 消息里的 call 顺序严格对应，不会出现“结果对不上调用”的历史。

## 8. 收尾：step 结束之后

一个 step 结束后，循环根据 `stepEnd` 决定下一步：

- 如果 `max-tokens` → 记下这个结束原因，turn 最终以它收尾；
- 如果模型没有再请求工具 → `completed`；
- 如果还有工具结果要回给模型 → 进入下一个 step；
- 如果 `agent/turn-stopping` 没有阻止，且 inbox 里没有新的 next-step 输入 → 结束 turn。

最后，在 `finally` 里写 `turn/end`：

```ts
this.session.append('turn/end', { turn, reason: turnEnds! })
```

见 [`agent.ts#L385-L387`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L385-L387)。

`reason` 可能是 `completed`、`max-tokens`、`blocked`、`aborted`、`error` 或 `interrupted`。最后一个只有恢复路径会写，正常循环不会产生。

### 取消和失败时发生了什么

- **取消**：`agent.cancel()` 触发 abort；已经流出的文本会以 `interrupted: true` 的 `assistant/message` 落账，未开始的 tool call 会得到 `ABORTED_BEFORE_DISPATCH` 的合成结果。
- **失败**：未回答的 tool call 会补 `TOOL_OUTCOME_UNKNOWN`（已记录 `tool/call`）或 `TOOL_NOT_STARTED`（还没记录）的结果。这样下一次请求仍然有配对的 tool history，不会因为一次失败让模型看到“有调用没结果”的畸形历史。
- **重试**：`agent/request-error` 可以返回 `{ kind: 'retry' }`；重试**不会**重新跑 `agent/pre-step`，也不会重复提交用户消息，只重新准备并发送请求。

## 9. 为什么值得这么复杂

把这条链路和“while(true) { call model; run tools }”相比，多出来的复杂度主要买了四件事：

1. **可重放**：所有模型可见输入都在日志里，进程重启后能重建请求。
2. **可取消**：每个异步阶段都有 signal，取消不会留下半截状态。
3. **可观测**：UI 能在 chunk 级别看到模型在做什么，而不是等整条消息结束。
4. **可扩展**：pre-step、request、request-error、turn-stopping 都是 waterfall，插件可以在不改循环的前提下改变行为。

代价是状态机很大，读代码时容易迷失。我的经验是抓住三个轴：**turn/step 的生命周期、inbox 的认领、surface 的提交**。这三条线清楚了，剩下的都是细节。

## 小结

- 一个 turn 包含零个或多个 step；step 是一次模型请求加它的工具调用。
- `turn/start` 先于认领，`step/end` 放在 finally，保证崩溃后仍可恢复。
- `pre-step` 决定这一轮接受哪些输入；`agent/request` 决定用哪个模型；`prepareCall` 绑定 adapter 能力。
- 流式 chunk 走实时事件，落账走 `assistant/message` / `assistant/attempt`。
- 工具调度是“独占屏障 + 有界并发池”，结果按模型顺序提交。

下一篇拆工具系统：一个 tool call 从参数校验到真正执行，中间要过哪几道关，审批和沙箱又挂在哪里。
