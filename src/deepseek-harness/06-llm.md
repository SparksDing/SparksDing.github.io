---
title: 模型适配层：一次请求怎样变成流
isTimeLine: true
date: 2026-10-19
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - LLM
  - 流式
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。

DSH 支持 DeepSeek 官方 API、Messages 兼容网关，也支持通过 pi-ai 接其他 provider。但 agent 主循环里没有一行 provider-specific 的代码。

这条边界就是 `packages/llm`：它定义一套**与 provider 无关的词汇**（消息、内容块、流式 chunk、请求选项），每个 adapter 只负责把自家 wire format 翻译成这套词汇。这篇讲清楚 `prepareCall()`、`stream()`、`StreamChunk` 和重试之间的关系。

## 1. 三层职责

```text
agent-loop            决定“发什么”：历史、工具、route
    ↓
LlmRuntime            解析能力、补默认值、绑定 adapter、暴露流
    ↓
adapter (deepseek…)   把统一请求翻译成 provider wire，把响应翻译回 chunk
```

`LlmRuntime` 本身**没有 wire code**，也没有配置（[`llm/README.md#L30-L45`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/README.md#L30-L45)）。它只做注册表、能力解析和调用准备。真正发 HTTP 的是 adapter，比如 `dsh-llm-deepseek`。

这个分层的关键收益是：**agent 循环只依赖一套词汇**。换 provider 不影响 session log 的格式，也不影响 UI 怎样渲染消息。

## 2. 词汇表：消息、块、chunk

一次请求是 `GenerateOptions`：

```ts
interface GenerateOptions {
  provider: string
  model: string
  messages: RequestMessage[]
  tools?: ToolSchema[]
  reasoningEffort?: ReasoningEffortId
  maxTokens?: number
  signal?: AbortSignal
  // ...
}
```

见 [`types.ts#L529-L571`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/types.ts#L529-L571)。

`Message` 是带身份和来源的持久消息；`RequestUserInput` 是只用于本次请求、没有 id/source 的临时用户输入。这个区分很重要：**能进 session log 的必须是 `Message`，一次性输入不能假装成持久消息。**

模型的输出不走 `Message`，而是走 `StreamChunk`：

```ts
type StreamChunk =
  | { type: 'block-start'; index: number; blockType: ContentBlockType }
  | { type: 'text-delta'; index: number; text: string }
  | { type: 'reasoning-delta'; index: number; text: string }
  | { type: 'tool-call-delta'; index: number; id: ToolCallId; name?: string; argumentsDelta: string }
  | { type: 'block-end'; index: number; block: ContentBlock }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'finish'; reason: FinishReason; replayState?: ReplayEnvelope }
```

见 [`types.ts#L470-L484`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/types.ts#L470-L484)。

协议约束很明确：

- `index` 用来关联交错的 delta；
- `block-end` 带已经拼好的完整 block；
- `usage` 必须在 `finish` 之前；
- `finish` 之后不能再有 chunk；
- tool call 的参数始终是**原始 JSON 字符串**，框架不在流式阶段解析它。

最后一条是刻意的：模型可能分多段吐出同一个 tool call 的 JSON，过早解析会失败；把拼接留给 `BlockAssembler`，才能保证“半截 JSON”不会变成错误。

## 3. prepareCall：把能力绑定到一次调用

`prepareCall()` 是 adapter seam 上最重要的方法（[`index.ts#L956-L1020`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/index.ts#L956-L1020)）：

```ts
async prepareCall(config, signal?, configure?): Promise<PreparedLlmCall> {
  const registration = this.registration(provider)
  const adapterCall = await registration.adapter.prepareCall(provider, model, signal)
  const modelInfo = this.normalizeModelInfo(registration, model, adapterCall.model)
  const resolved = this.resolveCallWithInfo(proposed, modelInfo)
  // ...
  return Object.freeze({
    config: resolvedConfig,
    retryPolicy: registration.retryPolicy,
    adapterDefaults,
    systemPromptUpdate: modelInfo.systemPromptUpdate,
    toolUpdate: modelInfo.toolUpdate,
    stream: options => { /* one-shot dispatch */ },
  })
}
```

它做了五件事：

1. **查 adapter**：route 没注册就报 `NO_ADAPTER`；
2. **问模型能力**：context window、输出上限、reasoning efforts、输入模态、`systemPromptUpdate` / `toolUpdate` 模式；
3. **补默认值**：adapter 声明的默认 reasoning effort、max tokens 在这里物化；
4. **校验**：显式参数必须和这个模型的能力匹配；
5. **冻结并绑定**：返回的 prepared call 只能 dispatch 一次，而且 config 必须和准备时完全一致。

为什么要这么重？因为一次模型调用的“能力”和“参数”必须在同一个 adapter 代际上解析。否则 HMR 换掉 adapter 后，可能出现“用 A 的图片能力解析、用 B 的端点发送”的错配。

`adapterDefaults` 还区分了“用户显式设置”和“adapter 补的默认值”。这个区分会写进 `request/header`，让恢复时知道哪些值需要重新解析、哪些应该保留。

## 4. stream：一个终止 chunk 收口所有失败

`LlmRuntime.stream()` 很短（[`index.ts#L1166-L1180`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/index.ts#L1166-L1180)）：

```ts
stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
  return this.streamWithRegistration(options)
}

private streamWithRegistration(options, prepared?) {
  return this.ctx.waterfall(this, 'llm/stream', options, () => this.adapterStream(options, prepared))
}
```

`llm/stream` 是一个 waterfall，插件可以在 adapter 外面包一层（比如注入日志、改请求、做路由）。最内层是 `adapterStream()`。

`LlmRuntime` 用一个统一的 `adapterFailureChunk()` **把所有 adapter 失败收敛成一个终止 chunk**（[`index.ts#L1183-L1192`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/index.ts#L1183-L1192)）：

```ts
function adapterFailureChunk(error, signal) {
  const failure = normalizeLlmFailure(error)
  return {
    type: 'finish',
    reason: signal?.aborted || failure.code === 'ABORTED'
      ? { kind: 'aborted', failure }
      : { kind: 'error', failure },
  }
}
```

这意味着消费者只需要处理一种终止形态：`finish`。不管是 HTTP 401、限流、超时、取消，还是 adapter 自己抛错，最后都会变成 `finish.reason.kind` 和稳定的 `failure.code`。

**消费者按 code 路由，不按 message 文本路由。** 这是 DSH 里反复出现的约定：`NO_ADAPTER`、`MISSING_CREDENTIAL`、`AUTH`、`RATE_LIMIT`、`CONTEXT_WINDOW_EXCEEDED`、`QUOTA` 等。

## 5. 从 chunk 到消息

chunk 是过程，`assistant/message` 才是结果。中间有两层：

- **`BlockAssembler`**（[`assembler.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/assembler.ts)）：把交错的 delta 拼成 `ContentBlock[]`，处理 tool call 参数拼接、多 block 索引、block-end 校验；
- **`AssistantStreamAccumulator`**（[`assistant-stream.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm/src/assistant-stream.ts)）：保留带时间戳和 token 边界的紧凑流，供 session log 内嵌。

在 agent-loop 里，这两层被 `AssistantStreamAttempt` 包起来：它一边把 chunk 推给实时 UI，一边累积最终消息和 timed stream（[`agent.ts#L451-L460`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/agent-loop/src/agent.ts#L451-L460)）。

成功后写 `assistant/message`，失败或取消写 `assistant/attempt`。后者不进入模型历史，但保留紧凑流，用于诊断和重放。

## 6. adapter 做什么：以 DeepSeek 为例

`dsh-llm-deepseek` 负责：

- 把统一的 `Message` / `ContentBlock` 翻译成 DeepSeek Messages API 的 content blocks；
- 把 `reasoningEffort` 映射为 `output_config.effort`；
- 处理图片：上传 Files API 或内联 base64，按像素预算缩放；
- 维护 replay metadata（模型签名等），只在同一个 adapter 实例内传递；
- 声明模型的 context window、输出上限、`systemPromptUpdate` 和 `toolUpdate` 模式；
- 提供 provider 自己的 `retryPolicy`。

它的端点、认证、重试策略都在自己的 README 里（[`llm-deepseek/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm-deepseek/README.md)）。核心循环完全不知道这些细节。

有一个值得注意的能力协商：`systemPromptUpdate: 'in-history'`。

- 对支持的模型，系统提示词可以追加在缓存历史之后，而不是每次重写最前面的 system message；
- 对不支持的模型，loop 会在第一个 system node 上合并最新 prompt；
- 这个模式由 `prepareCall()` 解析，并写进 `request/context`，所以恢复时能重建同样的请求形态。

这直接关系到 KV cache 命中率：**能追加就不要重写前缀。**

## 7. 重试为什么不放在 stream 里

最直觉的做法是在 adapter 或 `LlmRuntime.stream()` 里做重试。DSH 没有这么做，而是把重试放到 agent-loop 的 `agent/request-error` 瀑布上（[`llm-retry/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/llm/llm-retry/README.md)）。

原因是**流式请求不能安全地重放**：

- 已经吐给用户的 chunk 可能已经被 UI 渲染；
- 一次失败的流可能已经产生了半截 tool call；
- 直接在 stream 内部重试，调用方无法区分“第一次的 chunk”和“第二次的 chunk”。

所以 `dsh-llm-retry` 的做法是：

1. 在 `agent/request-error` 上拿到失败和 provider 的 retry policy；
2. **先把 `llm/retry` 事件写进 session log**（durable before wait）；
3. 等待退避；
4. 写 `llm/retry-started`；
5. 返回 `{ kind: 'retry' }`，让 loop 在**同一个 open turn 内**重跑失败的 step。

这样即使进程在退避期间崩溃，日志里也有“曾经安排过一次重试”的记录；恢复后不会出现一个看不见的幽灵重试。

## 8. 这套分层的取舍

好处：

- provider 无关的 session 格式和 UI；
- adapter 可以独立升级、独立测试；
- 能力协商（context window、图片、prompt 更新模式）集中在一处；
- 失败有稳定的 code，消费者不需要解析字符串。

代价：

- **adapter 的职责很重**：图片缩放、文件上传、认证、重试策略、replay metadata 都在 adapter 里；
- **能力模型会漂移**：不同 provider 的“支持”程度不同，`normalizeModelInfo` 必须严格校验，否则 loop 会按错误的能力做决策；
- **一层抽象不够薄**：为了保留可重放性和可观测性，`prepareCall`、prepared call、terminal finish 都是必要的仪式。

## 小结

- `packages/llm` 定义 provider 无关的请求、消息、chunk 词汇；adapter 只做翻译。
- `prepareCall()` 绑定模型能力、默认值、校验结果和 adapter 代际，返回 one-shot 调用。
- 所有 adapter 失败都收敛为一个终止 `finish` chunk，消费者按稳定 code 处理。
- chunk 经 `BlockAssembler` 变成消息，经 `AssistantStreamAccumulator` 变成可重放的 timed stream。
- 重试放在 agent 的 `agent/request-error` 上，先落日志再等待，避免流式重放的歧义。

最后一篇把视角拉到进程外：SDK 的 JSON-RPC、Web 的 Remote/WebSocket，以及浏览器里的 UI 怎样驱动同一个 agent 运行时。
