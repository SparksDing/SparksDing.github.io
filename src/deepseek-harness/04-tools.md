---
title: 工具调用的四道关卡：注册、校验、审批、执行
isTimeLine: true
date: 2026-10-19
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - 工具
  - 权限
  - 沙箱
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。

在很多 agent 实现里，工具就是一个函数：模型给出名字和参数，框架 `JSON.parse` 一下，直接调用。

DSH 不是这样。一个 tool call 从被模型生成，到真正产生副作用，中间有一条固定的流水线：

```text
pre-execute waterfall
  → 审批（ask 时）
  → 单调 guard
  → execute waterfall
  → 工具函数体
  → projectContent
  → post-execute waterfall
  → finalizeContent
  → tools/result 通知
```

这篇拆开这条链，重点回答两个问题：**为什么工具作者只需要写 `execute`，而审批、沙箱、超时、UI 展示都能插进来？** 以及 **审批（approval）和沙箱（sandbox）到底是不是一回事？**

## 1. 工具是一个带类型契约的定义

DSH 用 `defineTool()` 声明工具。一个最小的例子（来自 [`tools/README.md#L38-L62`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/README.md#L38-L62)）：

```ts
ctx.tools.register(defineTool({
  name: 'read_file',
  description: 'Read a file from disk.',
  parameters: {
    path: { type: 'string', required: true, description: 'Absolute file path' },
    offset: { type: 'number' },
    limit: { type: 'number' },
  },
  output: {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: value }],
  },
  async execute(args, exec) {
    return readFile(args.path, { encoding: 'utf8', signal: exec.signal })
  },
}))
```

这里有几个容易忽略的设计：

- **`parameters` 是 DSL，不是裸 JSON Schema。** `defineTool` 会把它编译成模型可见的 schema，并在执行前校验参数。支持 `string`、`number`、`integer`、`boolean`、`null`、`array`、`object`、精确多选一的 `oneOf`，以及 author-only 的 `json`。
- **`output` 是必填的。** 工具返回的 canonical value 必须先通过 `output.schema` 校验，再由 `render` 转成模型看到的内容。执行值和展示内容被刻意分开了。
- **`execute` 只返回 canonical JSON 值。** 它不负责拼 UI、不负责写日志、也不负责决定是否可见。
- **`timeoutMs`、`isConcurrencySafe`、`presentCall` 这些元数据不会出现在模型请求里。** `schemas()` 有显式 allowlist，只把 `name` / `description` / `parameters` 发给模型（[`index.ts#L1268`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1268)）。

后两点是整条流水线能成立的前提：**模型看到的是接口，Host 掌握的是实现和展示。**

## 2. 注册是 effect，作用域决定可见性

`ctx.tools.register()` 的返回值不是 `void`，而是一个精确的 disposer：

```ts
return this.layers.effect(
  this.ctx,
  layer => layer.tools.insert(name, definition),
  { label: 'tools.register()' },
)
```

见 [`index.ts#L1091-L1095`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1091-L1095)。

这带来三个结果：

1. 插件卸载时工具自动消失，不需要手写反注册；
2. 同一个工具可以按 agent scope 注册，只对那个 agent 可见；
3. 注册顺序不影响最终可见集合，最终由 scope 层叠决定。

DSH 还提供了 `restrict()` 做“只允许 / 禁止”掩码。它要求调用方有 scoped context（`agent.ctx`），因为一个全局 restriction 会把所有 agent 的工具都裁掉——这种“看起来像配置、实际上越权”的 API，DSH 选择直接报错而不是默认放宽（[`index.ts#L1104-L1125`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1104-L1125)）。

## 3. 第一道关：pre-execute 决定 allow / deny / ask

流水线的入口在 `prepareExecution()`（[`index.ts#L1501-L1545`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1501-L1545)）：

```ts
const gate = await this.ctx.waterfall(
  carrier, 'tools/pre-execute', exec,
  () => Promise.resolve<PreToolDecision>({ kind: 'allow' }),
)
const askResolution = gate.kind === 'ask'
  ? await this.serviceAsk(exec, gate)
  : { decision: gate, approvalCancelled: false }
```

`tools/pre-execute` 是一个 waterfall，监听器可以返回：

- `{ kind: 'allow' }`：继续；
- `{ kind: 'deny', reason, info? }`：跳过工具体，返回错误结果；
- `{ kind: 'ask', reason?, displayReason? }`：交给审批服务；
- `{ kind: 'cancel' }`：按取消处理。

注意默认值是 `allow`。也就是说，**没有策略插件时工具默认可执行**；需要审批的工具必须自己（或某个策略插件）声明 `ask`。这是 DSH 的默认信任模型：能力由 composition 决定，而不是由工具作者偷偷加一个“需要审批”的布尔值。

紧接着是**单调 guard**。`ctx.tools.guard()` 注册的检查在 pre-execute 之后运行，只能 deny 或弃权，不能把已经拒绝的调用重新放行：

```ts
const denialReason = decision.kind === 'allow' ? this.guardReason(exec) : decision.reason
```

见 [`index.ts#L1527-L1539`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1527-L1539)。

这个顺序是有意的：**可扩展的 ask 先走，不可撤销的 owner policy 后走。** 前者可以被用户批准，后者不能被后续监听器翻案。

## 4. 审批：一次性的、按调用的人机交互

当 gate 返回 `ask`，`serviceAsk()` 会去找 `ctx.approval`：

```ts
const approval = this.ctx.get('approval')
if (approval === undefined) {
  return { decision: { kind: 'deny', reason: '... requires approval (not yet supported)' }, ... }
}
const outcome = await approval.request({ agent, toolName, callId, reason, signal })
```

见 [`index.ts#L1735-L1765`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1735-L1765)。

`ApprovalOutcome` 有四种：`allowed-once`、`rejected`、`cancelled`、`unavailable`。只有 `allowed-once` 会继续；其余三种都变成 deny，但给出的 reason 不同，模型能区分“人拒绝”“调用被取消”“没有审批通道”。

几个重要约束：

- **审批是 per-call 的。** 没有“以后都允许”的隐式记忆；standing policy 属于 session/permission 配置，不在这条链上。
- **没有 approval 服务时，ask 退化为 deny。** 这是 fail-closed，不是“没装审批就放行”。
- **审批请求带 `agent` 和 `callId`。** 所以 UI 能把审批卡片挂到正确的会话和工具调用上，而不是一个全局弹窗。
- **`signal` 会被传进去。** 用户取消整个 turn 时，挂起的审批也会被取消。

## 5. 第二道关：execute 是 around-dispatch

审批和 guard 都通过后，进入 `tools/execute` waterfall（[`index.ts#L1609-L1616`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1609-L1616)）：

```ts
const result = await this.ctx.waterfall(
  carrier, 'tools/execute', mutableExec,
  () => this.dispatchToolBody(mutableExec),
)
```

这一层是 **around**，不是 before/after。它适合做：

- 超时（`dsh-tool-call-timeout-policy` 就是 `tools/execute` 的 wrapper）；
- 重试；
- 指标和审计；
- 替换 `exec.signal`（只有这一层允许）。

工具函数体拿到的 `exec` 里有 `signal`、`callId`、`agent` 等上下文。**工具作者必须观察 `exec.signal` 并把它转发给底层 IO**；DSH 不做进程内强杀，取消是协作式的。

## 6. 结果处理：project → post → finalize → result

工具返回后，结果还要过三段：

1. **`projectContent`**：工具自己安装“执行后准备好的内容”（比如把结构化结果转成文本/图片）；
2. **`tools/post-execute`**：策略层可以接受、替换内容、阻断并给出纠正反馈，或者附加 `additionalContexts`；
3. **`finalizeContent`**：工具自己最后一层内容变换，必须是同步、全函数、不抛错的；它不能改 `value`，只能改模型看到的内容。

```ts
const decision = await this.ctx.waterfall(
  scopeTarget(this, exec.agent), 'tools/post-execute', exec, result,
  () => Promise.resolve<PostToolDecision>({ kind: 'accept' }),
)
```

见 [`index.ts#L1789-L1793`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1789-L1793)。

最后，`tools/result` 是一个**只读通知**：结果已经冻结，监听器只能观察，不能修改。它适合做 telemetry、UI 卡片、计费统计。

## 7. 审批和沙箱不是一回事

这两个概念经常被混在一起。在 DSH 里：

| | 审批（approval） | 沙箱（sandbox） |
|---|---|---|
| 回答的问题 | 这次调用要不要让人点“允许”？ | 进程能写哪些路径？ |
| 粒度 | 每次 tool call | 每次受限执行 |
| 决策者 | 用户 / 审批通道 | 后端（bwrap、Seatbelt、ACL） |
| 失败方式 | 没有通道 → deny | 无法约束 → 报告 partial 或拒绝 |
| 代码位置 | `ctx.approval`，工具流水线 | `ctx.sandbox`，shell/fs 等消费者 |

沙箱的模式只有三种（[`sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/subsystems/sandbox.md)）：

- `read-only`：只允许必要的 sink（比如 `/dev/null`）；
- `workspace-write`：允许写 workspace 和 backend 提供的临时目录；
- `danger-full-access`：不约束，直接 spawn 原始 argv。

`ctx.sandboxPolicy.resolve()` 负责把 session 的 cwd、显式覆盖模式和部署默认值合成一个 per-call policy（[`sandbox-policy/src/index.ts#L164`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/sandbox/sandbox-policy/src/index.ts#L164)）。真正执行时，消费者把 argv 包成 `bwrap ...` / `sandbox-exec ...` 再 spawn；`danger-full-access` 的消费者直接 spawn，不经过 `ctx.sandbox`。

所以一次 `bash` 调用的完整路径是：

```text
tool call
  → tools/pre-execute（可能 ask）
  → approval（用户点允许）
  → tools/execute
  → shell 消费者读取 sandboxPolicy
  → 用 bwrap/Seatbelt 包装 argv
  → spawn 子进程
  → tool/result
```

**审批管“要不要做”，沙箱管“能做到什么程度”。** 两者都失败关闭，但职责完全不同。

## 8. 并发与取消

并发分类在 `executionMode()`（[`index.ts#L1311-L1325`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1311-L1325)）：

```ts
executionMode(exec: ToolExecutionInput): ToolExecutionMode {
  const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== undefined)
  if (!tool?.isConcurrencySafe) return { kind: 'exclusive' }
  try {
    return tool.isConcurrencySafe(exec.arguments) === true
      ? { kind: 'parallel' }
      : { kind: 'exclusive' }
  } catch {
    return { kind: 'exclusive' }
  }
}
```

这是典型的 **fail-closed 分类**：只有工具明确声明、且对这组参数返回严格 `true`，才算并发安全；未知工具、隐藏工具、分类器抛错，一律独占。

取消分两个阶段：

- 进入 `execute` 前已取消 → `ABORTED_BEFORE_DISPATCH`；
- 工具体已经开始 → 成功结果被替换为 `ABORTED`。

更具体的失败（denial、timeout、`UNKNOWN_TOOL`、工具自己抛的结构化错误）优先级更高，不会被一个笼统的取消覆盖。

## 9. 这套设计换来了什么

如果只写一个 `read_file`，这条流水线显然过重。但把视角拉到“一个可部署的 agent 产品”，它解决的是几个绕不开的问题：

- **策略跨工具族复用。** 审批挂在 `tools/*` 事件上，沙箱和 fs 检查则由 shell/fs 消费者在能力边界调用；工具作者不需要各写一遍。
- **模型可见与执行值分离。** 工具可以返回结构化值给程序调用，同时给模型渲染一段摘要；替换展示内容不会破坏 canonical 值。
- **失败不终止 turn。** 工具错误变成一条 `tool/result`，模型可以读到错误、决定重试或换方法；只有插件/流水线本身失败才会结束这一轮。
- **UI 可预测。** 调用开始就写 `tool/call`，结束写 `tool/result`；前端按事件重建卡片，不依赖工具自己发 UI 指令。

## 小结

- 工具是“schema + canonical output + execute”的定义，不是裸函数。
- 调用链固定为：pre-execute → 审批 → guard → execute → project → post-execute → finalize → result。
- 审批是 per-call 的人机决策，没有通道就 deny；沙箱是 per-execution 的进程约束，两者职责不同。
- 并发分类 fail-closed；取消协作式，且不会覆盖更具体的错误。
- 工具作者只写 `execute`，策略和展示通过事件挂载。

下一篇看会话日志：为什么“模型历史”不是存下来的一串 message，而是从 append-only 事件流里推导出来的，以及换一个进程为什么还能接着聊。
