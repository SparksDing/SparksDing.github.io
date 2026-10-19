---
title: Cordis：DSH 为什么没有“核心”
isTimeLine: true
date: 2026-10-19
category:
  - DeepSeek Harness
tag:
  - DeepSeek Harness
  - Cordis
  - 插件
  - 源码阅读
---

> 源码基于 [`deepseek-harness@0.2.1-rc.2`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)，对应 commit [`687f282`](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)。

DSH 的架构文档第一句话就是：**Everything is a plugin**。模型 adapter、工具注册表、会话日志、系统提示词，甚至 agent 主循环，都是插件。

这句话听起来像宣传语，但它有非常具体的工程含义。读完 Cordis 的设计，我最大的感受是：DSH 并不是“写了一个可扩展的 agent”，而是**把 agent 本身变成了插件组合的结果**。没有哪段代码天然拥有特权，扩展点也不是事后加的钩子。

这篇讲清楚 Cordis 的四个核心概念：Context、Service、Event、Effect。它们解释了 DSH 里大量看起来“反直觉”的写法。

## 1. 插件不是一个函数，是“向 Context 注册能力”

Cordis 支持三种插件形态：

```ts
// 1. 函数插件
export function apply(ctx: Context) { /* ... */ }

// 2. 对象插件
export const plugin = { name: 'x', apply(ctx: Context) {} }

// 3. Service 子类
export class MyService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'myService')
  }
}
```

见官方教程 [`01-first-plugin.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/cordis-tutorial/01-first-plugin.md)。

区别在于“贡献什么”：

- 函数/对象插件**做事情**：注册事件监听、注册工具、挂子插件。
- Service 子类**提供能力**：它把自己注册到 `ctx.<name>` 上，其他插件通过这个 key 找到它。

关键在于：插件拿到的 `ctx` 不是全局单例，而是**当前插件自己的上下文**。通过它注册的东西，默认随这个插件的 fiber 一起出现、一起消失。

## 2. Context 是服务仓库，`inject` 是依赖声明

DSH 的代码里几乎看不到 `import { ToolRuntime } from ...` 然后 `new` 一个实例。工具插件只写 `ctx.tools.register(...)`，它不关心 `ctx.tools` 是谁实现的。

`Service` 的构造函数做了这件事：

```ts
// vendor/cordis/src/service.ts
constructor(protected ctx: Context, name: string) {
  // ...
  self.ctx.reflect.provide(name, self, this[Service.check])
  return self
}
```

见 [`service.ts#L42-L59`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/cordis/src/service.ts#L42-L59)。`provide()` 不是普通赋值，它登记的是“这个服务由当前 fiber 提供”，因此：

- 插件卸载时，服务自动撤销；
- 服务可以按 scope 隔离或覆盖（DSH 的 agent preset 就用 `isolate` realm 给单个 agent 换一套能力）；
- 消费者拿到的是**接口**，不是实现。

服务之间有依赖怎么办？用 `inject` 声明，而不是靠加载顺序：

```ts
// packages/core/tools/src/index.ts
export class ToolRuntime extends Service {
  static inject = ['systemPrompt']
  // ...
}
```

见 [`index.ts#L808-L812`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L808-L812)。

`inject` 让 Cordis 把插件放进 `PENDING` 状态，直到 `systemPrompt` 出现才真正 `apply`。这解决了一个非常现实的问题：**配置文件里行的顺序不代表加载顺序**。你可以把 `dsh-tools` 写在 `dsh-system-prompt` 前面，只要依赖声明正确，Cordis 会等到服务就绪。

这带来一个调试经验：插件“没反应”时，先看它是不是卡在 PENDING，而不是先怀疑配置没生效。

## 3. 事件有五种调度方式，waterfall 是拦截器

Cordis 的事件不是简单的 pub/sub。事件在声明时就带一种调度模式（[`events.ts#L24-L32`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/cordis/src/events.ts#L24-L32)）：

| 模式 | 是否等待 | 顺序 | 返回值 | 典型用途 |
|---|---|---|---|---|
| `emit` | 否 | 注册顺序 | 无 | 纯通知 |
| `waterfall` | 否 | 注册顺序，包裹 `next` | 有 | 中间件、拦截、改写 |
| `parallel` | 是 | 并行 | 无 | 多个独立观察者 |
| `serial` | 是 | 注册顺序，可短路 | 有 | 终止检查 |
| `bail` | 否 | 注册顺序，遇到非空即停 | 有 | 快速决策 |

DSH 里最重要的扩展点是 waterfall。它的语义是 **around-middleware**：监听器收到 `(...args, next)`，调用 `next()` 表示“把控制权交给下一个监听器”，不调用就直接短路。

一个真实例子是 `time-context` 插件，它在每个 step 前把当前时间注入用户消息：

```ts
ctx.on('agent/pre-step', async ({ agent, turn, step, signal }, next) => {
  const decision = await next()
  if (decision.kind === 'reject' || signal.aborted) return decision
  // ... 计算时间文本
  return {
    ...decision,
    messages: [...decision.messages, timeMessage],
  }
})
```

见 [`time-context/src/index.ts#L185-L217`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/context/time-context/src/index.ts#L185-L217)。

这个写法的精妙之处在于：它既可以让下游先决定（`await next()`），又可以在下游结果上追加内容。主循环完全不知道“时间上下文”这个插件的存在，但每个请求都会带上它。

DSH 的约定是：**waterfall 监听器必须调用 `next()` 才能真正委托**。只观察、不委托的监听器会让整条链断掉，这是写插件时最容易犯的错误之一。

## 4. 注册即 effect，卸载自动回滚

Cordis 的 fiber 有明确的状态机：

```text
PENDING → LOADING → ACTIVE → UNLOADING → DISPOSED
                 ↘ FAILED
```

见 [`02-lifecycle-and-effects.md`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/cordis-tutorial/02-lifecycle-and-effects.md)。

`ctx.effect()` 接收一个函数，函数体在加载时执行，返回的 disposer 在卸载时执行：

```ts
ctx.effect(() => {
  const timer = setInterval(tick, 200)
  return () => clearInterval(timer)
})
```

实现见 [`fiber.ts#L415-L420`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/cordis/src/fiber.ts#L415-L420)。

更重要的是，**框架自带的注册 API 本身就是 effect**：

- `ctx.on(event, listener)` 注册的监听器随 fiber 卸载；
- `ctx.plugin(child)` 挂载的子插件随父插件卸载；
- `ctx.tools.register(tool)` 返回的 disposer 也挂在调用方 fiber 上。

看 `ToolRuntime.register()` 的最后一行：

```ts
return this.layers.effect(
  this.ctx,
  layer => layer.tools.insert(name, definition),
  { label: 'tools.register()' },
)
```

见 [`tools/src/index.ts#L1091-L1095`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/packages/core/tools/src/index.ts#L1091-L1095)。

这就是为什么插件作者不需要手写 `unregister`，也不需要担心 HMR 后旧工具残留：注册和撤销是同一个 effect 的两端。

## 5. 再进一步：连“agent 循环”也是服务

`ctx.agents` 是一个服务，`ctx.agentLoop` 也是一个服务。`dsh-agent` 包定义 `Agent` 接口和事件，`dsh-agent-loop` 实现默认驱动。

这意味着：

- 你可以只挂 `dsh-agent`，换一个自己的 loop 实现；
- 也可以在 agent 的 scope 里覆盖 `ctx.tools`，让某个 agent 看到不同的工具集；
- `agent/pre-step`、`agent/request`、`agent/turn-stopping` 这些事件不属于某个具体实现，而属于 `agent/*` 这个域。

DSH 的架构文档把事件分成三类（[`architecture.md#L67-L77`](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/docs/architecture.md#L67-L77)）：

- **Session events**：持久事实，进日志，重启可重放；
- **Agent events**：当前进程的实时协作面；
- **Capability events**：给能力缝挂策略和 adapter，比如 `fs/*`、`tools/*`。

分清这三类，基本就不会把“该落日志的东西”写成“只在内存里发个事件”。

## 6. 写一个最小插件

下面这个插件不实现服务，只在系统提示词里加一段：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'response-language'

export function apply(ctx: Context) {
  ctx.systemPrompt.section({
    name: 'response-language',
    order: 100,
    text: 'Always answer in Chinese unless the user asks otherwise.',
  })
}
```

把它放进 profile 的 `cordis.patch.yml`：

```yaml
- insert:
    - id: response-language
      name: './response-language.ts'
```

PLUGIN 会被 Loader 当作一个 entry 挂载；`ctx.systemPrompt.section()` 的注册随插件 fiber 生效和撤销。不需要改任何核心代码。

## 7. 这套设计的代价

“一切皆插件”不是免费的：

- **阅读成本高。** 一个行为可能由多个插件通过 waterfall 叠加而成，只看一个包很难看清全貌。
- **顺序敏感。** 虽然服务依赖由 `inject` 解决，但 waterfall 监听器的注册顺序仍会影响结果；DSH 用 `prepend` 和显式的 order 字段管理这一点。
- **约束必须显式。** “注册即 effect”要求所有资源都走 `ctx.effect()` 或框架 API；绕过它直接 `setInterval`，HMR 后就会泄漏。
- **失败要响。** 插件加载失败不能静默跳过，否则组合出来的树是残缺的。DSH 的 startup audit 就是为此存在的。

但换来的能力也很实在：同一个 runtime 可以被 web、SDK、desktop 复用；换模型、换工具、换沙箱、换 loop 都不需要 fork 主流程。

## 小结

- Context 是服务仓库，Service 是能力的提供者，消费者只认 key。
- `inject` 表达依赖，加载顺序由服务可用性决定，不由配置文件行序决定。
- waterfall 是 DSH 最主要的拦截机制，监听器必须调用 `next()` 才能委托。
- 注册是 effect，卸载自动回滚；这是 HMR 和插件热插拔能成立的基础。
- agent 循环本身也是插件，所以“扩展”不需要改核心。

下一篇进入最核心的调用链：一次用户输入怎样变成一个 `turn`、若干 `step`，模型返回的 tool call 又怎样被调度和执行。
