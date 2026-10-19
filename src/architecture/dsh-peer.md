---
title: 让两个 DeepSeek Harness 跨机器对话：dsh-peer 的后端设计与活动看板
isTimeLine: true
date: 2026-10-19
category:
  - 工程实践
tag:
  - DeepSeek Harness
  - 插件
  - 网络
  - 前端
---

最近在折腾一件事：让一台 Linux 上的 DeepSeek Harness（下称 dsh）和一台 Windows 上的 dsh 互相通信——不是 SSH 上去跑命令，而是**让两个 agent 互相派活、互相插话**。最后做出来的是一个叫 `dsh-peer` 的插件，加上一个能看到对端思考过程的活动看板。

代码在 [SparksDing/dsh-peer](https://github.com/SparksDing/dsh-peer)。这篇写清楚它是怎么设计的、交互长什么样，以及前端看板为什么做在"桥"上。

> English version: [Let Two DeepSeek Harness Instances Talk Across Machines](/en/architecture/dsh-peer.html)

<!-- more -->

## 1. 背景与约束

dsh 自带的 SDK 协议只走 stdio：父进程 spawn 一个 `dsh --profile sdk` 子进程，通过标准输入输出说 JSON-RPC。跨机器没有任何现成通道。

现实约束有三条：

1. **Windows 在内网**，只能主动往外连，不能接受入站连接。
2. **Linux 的入站端口被安全组挡住**，只有 80/3080 这类 HTTP 端口可达。
3. 被驱动的不是裸工具进程，而是一个**完整 runtime**：有自己的模型路由、工具集、会话持久化和文件系统。

所以设计目标很明确：在不改动 dsh 核心的前提下，复用它的 SDK 协议，补一层"跨机器连接 + 对等双向"。

## 2. 架构：连接方向与服务方向相反

这是整个设计里最容易绕晕、也最关键的一点：

|  | 建立连接 | 发 harness 请求 | 响应 |
|---|---|---|---|
| hub（公网侧） | 监听 | 发 `session/prompt` | 只响应 `peer/reply` |
| link（内网侧） | 拨号 | 不发 | 响应 harness 方法 |

NAT 只允许内网机器主动出站，所以必须让 Windows 当"连接的客户端"；但它同时是"能力的服务端"——把本机 agent 服务给 hub 用。

```
        公网侧 (hub)                              内网侧 (link)
  ┌──────────────────────┐                  ┌──────────────────────┐
  │ peer_ask / peer_send │  JSON-RPC 请求   │  HarnessSdkJsonRpc   │
  │ peer_wait / peer_inbox│ ───────────────► │  Server              │
  │                      │                  │   ├─ agents.create   │
  │  PeerHub             │ ◄─────────────── │   ├─ preset.mount    │
  │  链接注册 · 会话状态   │  session.event   │   └─ followup()      │
  └──────────────────────┘                  └──────────────────────┘
            │                                          ▲
            └──────── TCP / TLS / WebSocket ───────────┘
                       （由 link 主动拨号）
```

分层也很直接：

```
模型
 │  peer_ask / peer_send / peer_wait / peer_inbox        (lib/tools.js)
 ▼
PeerHub  链接注册表 · 会话状态 · 收件箱 · 超时          (lib/hub.js)
 │
PeerConnection  JSON-RPC 请求/响应 · 心跳 · 超时 · 关闭  (lib/protocol.js)
 │
LineTransport   换行分隔 JSON-RPC 2.0 帧               (lib/transport.js)
 │
Duplex:  TCP / TLS / WebSocket                          (lib/ws.js)
```

## 3. 协议：复用 SDK 方言，不另造 agent API

### 3.1 帧与传输

每一个帧就是一行 JSON-RPC 2.0：带 `method` 和 `id` 是请求，只有 `id` 是响应，只有 `method` 是通知。和 `@deepseek-ai/dsh-sdk-protocol` 完全一致，所以链路两端天然能说同一套 harness 方法：

- `initialize`：确定 cwd、provider、model
- `session/prompt`：投递一条用户消息
- `session/wait`、`session/working-directory/*`
- 通知：`session.event`、`session.status`

自定义的只有四个：`peer/hello`、`peer/ping`、`peer/info`、`peer/reply`，以及一个兼容用的 `peer/ensure-session`。

传输是可插拔的，因为同一条 JSON-RPC 只要落在 `Duplex` 上就行：

```js
// lib/protocol.js
this.#transport = new LineTransport(socket, socket)
socket.setNoDelay?.(true)
socket.setKeepAlive?.(true, 15_000)
```

### 3.2 握手

link 连上后发的第一个请求是：

```json
{
  "jsonrpc": "2.0",
  "id": "req_...",
  "method": "peer/hello",
  "params": {
    "protocol": 1,
    "name": "windows-pc",
    "role": "link",
    "token": "<共享密钥>",
    "platform": "win32",
    "cwd": "C:\\Users\\admin",
    "provider": "deepseek-official",
    "model": "deepseek-v4-flash"
  }
}
```

hub 校验协议版本与 token（常量时间比较），拒绝不匹配的连接。之后每条连接上：

- 应用层 `peer/ping` 每 25 秒一次，连续两次失败就断开；
- 断线后 link 指数退避重连，1s 起步、30s 封顶。

### 3.3 一次 `peer_ask` 的完整时序

```
我: peer_ask(peer="HP", prompt="查磁盘")
 │
 ├─ hub.require("HP")                     按名字/唯一子串找 link
 ├─ sessionId = peer-HP-default           会话身份 = 链接名 + 话题名
 ├─ initialize {cwd, provider, model}     每条连接只做一次
 ├─ peer/ensure-session {sessionId}       link 尝试 resume 历史，没有就等 prompt 建
 ├─ session/prompt {sessionId, blocks} ──► link
 │                                          └─ PeerHarnessServer
 │                                             ├─ agentPresets.resolve("standard")
 │                                             ├─ agents.create/resume
 │                                             │   setup: preset.mount(agentCtx)
 │                                             └─ agent.followup(userMessage)
 │                                                ↓ 真实模型 + 真实工具跑一轮
 │                                          ◄── session.event  (逐条流式)
 │                                          ◄── session.status (running/idle)
 ├─ hub 收到 agent/inbox/spliced          确认消息已入队（关联 messageId）
 ├─ hub 等到 idle 且 idleCount 递增        判定这一轮结束
 └─ 返回最后一条 assistant/message 的文本
```

这里有个不太直观的实现细节：**hub 不是靠 `session/wait` 判断回合结束的**。原因是 0.2.0 版本的 SDK server 根本没有 `session/wait`，只有 `initialize` / `session/prompt` / `shutdown`。所以 hub 自己在每条连接上维护每个会话的：

- `receipts`：哪些 messageId 已经被 `agent/inbox/spliced` 确认
- `idleCount`：`session.status` 变成 idle 的次数
- `lastAssistant`：最后一条助手消息的文本

等待条件写成"idleCount 相比投递前递增"，而不是"等一个 idle 通知"——后者会在"回合已经在等待开始前结束"时丢事件。

### 3.4 会话身份与续接

会话 id 是 `peer-<link>-<topic>`：

- 同一个 `session` 名字复用同一条对话，`fresh: true` 另起一条；
- 重连后 hub 重新 `initialize`，再对旧会话发 `peer/ensure-session`；
- link 侧先尝试 `session/resume` 载入持久化历史，失败（首次使用没有历史）就等 `session/prompt` 创建。

这样即使 hub 或 link 重启，对话也能接上。

### 3.5 事件过滤

`HarnessSdkJsonRpcServer` 会把**本机所有会话**的 `session.event` 都广播给 transport。对 peer 通道来说这既浪费又泄露隐私，所以 link 侧包了一层过滤 transport：

```js
notify(method, params) {
  if (method === 'session.event' || method === 'session.status') {
    if (!owned.has(params.sessionId)) return
  } else if (method === 'subagent.started' || method === 'subagent.finished') {
    if (!owned.has(params.parentSessionId)) return
  }
  conn.notify(method, params)
}
```

`owned` 在收到 `session/prompt` / `session/resume` 时登记，只包含这条 peer 连接自己创建的会话。

## 4. 后端实现里的几个关键点

### 4.1 工具是 preset 组成的，不是全局的

把 link 装进 `web` profile 时会遇到一个坑：peer 会话的 agent 只拿到全局注册的工具（`peer_reply`、`peer_status`），没有 `bash`、`read`、`write`——因为 Web profile 把模型可见的工具行都移进了 agent preset。

解法是继承 `HarnessSdkJsonRpcServer`，覆写 `createSession`，在 agent 发布前的 `setup` 里挂载 preset：

```js
const preset = await presets.resolve(this.presetId)   // 默认取 registry 的 default
setup = async (agentCtx) => {
  await presets.mount(agentCtx, preset.id)
}
const handle = await this.ctx.agents.create({
  sessionId,
  meta: { cwd: this.cwd, agentPreset: preset.id },
  agentOptions,
  setup,
})
```

`setup` 是 dsh 文档里的创建钩子：它在 agent 真正发布之前执行，所以 preset 里的工具在第一次组装 prompt 时就已存在。

### 4.2 旧版本没有 `session/resume`

0.2.0 的 SDK server 只有三个方法，重连后对已存在的 session id 调 `agents.create` 会报 `session "..." already exists`。兼容做法是捕获这个错误回退到 `agents.resume`：

```js
try {
  handle = await this.ctx.agents.create({ sessionId, meta, agentOptions, setup })
} catch (error) {
  if (!/already exists/i.test(error.message)) throw error
  handle = await this.ctx.agents.resume({ resumeSessionId: sessionId, agentOptions, setup })
}
```

### 4.3 只有 HTTP 端口可达时，用 WebSocket + 桥

公网侧 3099 被安全组挡住，但 3080 通（nginx）。于是加了一条路径：

```
link --ws--> nginx (/dsh-peer) --ws--> peer-ws-bridge --tcp--> hub:3099
```

桥本身很小：接受 WebSocket 升级，把每个连接 `pipe` 到 hub 的 TCP 端口。这样 hub 完全不用改，仍然只监听原始 TCP。

nginx 侧只需要一条精确匹配的路径，不影响 dsh 自己的 GUI：

```nginx
location = /dsh-peer {
    proxy_pass http://127.0.0.1:3098;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

### 4.4 二进制走独立上传口

协议只传 JSON 文本。截图、预览二维码这类二进制如果塞进 JSON-RPC（base64）既贵又脆，所以另开了一个带 token 的 HTTP 上传口：

```
PUT http://hub:3080/peer-files/upload/shot1.png?token=...
```

对面用 `Invoke-WebRequest -Method Put -InFile` 一推就完事。

## 5. 前端：活动看板

### 5.1 为什么做在"桥"上

需求是能看到对端的**思考过程**和细节：用户消息、reasoning、助手文本、工具调用与结果、回合边界、状态变化。

最直接的想法是做成 dsh 的客户端 UI 插件，但有两个问题：

1. 客户端插件的数据面要走 typert 的 Remote 描述符，而描述符是**构建期生成**的，出树插件很难接；
2. 更关键的是——不想为了加一个只读面板去重启正在运行的 hub。

而 WebSocket 桥正好夹在 link 和 hub 之间，**能看到全部 JSON-RPC 帧**。于是换个思路：桥旁路解析帧，喂一个内存事件存储，再吐一个极简的 HTTP 看板。

```
link --ws--> nginx(/dsh-peer) --> 桥 --tcp--> hub(3099)
                                  │
                                  ├─ 解析 session.event / session.status
                                  └─ nginx(/peer-ui/) --> GET / 与 GET /api/activity
```

hub 和 link 一行都不用改。

### 5.2 事件模型

dsh 的会话事件是带 `type` 的判别联合。看板只挑有展示价值的几类：

| 事件 | 展示 |
|---|---|
| `user/message` | 用户/系统注入的消息文本 |
| `assistant/message` | 拆成 `reasoning` 与 `text` 两段（content block 里分别是 两个 type） |
| `tool/call` | 工具名 + 参数 JSON |
| `tool/result` | 结果文本，`isError` 时标红 |
| `turn/start` / `turn/end` | 回合边界与结束原因 |
| `session.status` | running / idle |

每条事件压成一个扁平结构，进环形缓冲：

```js
{ seq, at, kind, title?, text? }
```

`seq` 是全局单调递增的，正好用来做增量拉取。

### 5.3 增量轮询

看板不做 WebSocket 推送，用最朴素的轮询——900ms 一次，带 `since`：

```
GET /api/activity?since=123&token=...
→ { now, seq, peers: [ { name, sessions: [ { id, status, events: [...] } ] } ] }
```

只返回 `seq > since` 的事件，所以每次响应都很小。服务端对每个会话保留最近 400 条、全局 4000 条，超出就丢最久未活动会话的最旧事件。

选择轮询而不是 SSE 的原因很实际：看板通常只看一会儿，轮询的失败恢复（刷新页面、断网重连）几乎不需要写代码。

### 5.4 渲染

页面是**一个自包含的 HTML 字符串**，没有外部资源、没有前端构建步骤——由一个函数直接返回：

```js
export function dashboardHtml(token) {
  return `<!doctype html>
  <html>…<script>
    let since = 0
    async function tick() {
      const r = await fetch('api/activity?since=' + since + '&token=' + encodeURIComponent(TOKEN))
      const data = await r.json()
      render(data)
      since = Math.max(since, data.seq)
    }
    setInterval(tick, 900)
  </script></html>`
}
```

渲染逻辑按"会话"分组，每个会话一个容器，新事件 append 到末尾；顶部是 peer 状态灯（有 running 会话就是绿点）。用户勾选"跟随"时自动滚到底部。

实际效果就是一条按时间排列的流水：紫色是 reasoning，黄色是工具调用，绿色是工具结果，红色是失败，灰色是回合边界。

### 5.5 安全

看板跑在公网 3080 上，所以：

- 页面和 JSON 接口都要 `token` 查询参数；
- token 只在 URL 里出现，页面内部把它拼进 fetch；
- 桥只读、不提供任何写接口。

## 6. 真实联调

这套东西不是纸上设计，最后是在真机上跑通的：

1. Windows 上 `dsh --profile sdk` 起 link，通过 `ws://…/dsh-peer` 连到 Linux 的 hub；
2. Linux 这边 `peer_ask(peer="HP", prompt="查磁盘")`，Windows 的 agent 用 pwsh 执行并返回结果；
3. 让它用 `mini-program-automator` 连微信开发者工具，读页面元素、截图、把二维码和截图通过上传口传回来；
4. 活动看板上能看到它每一步的 reasoning、工具调用和结果。

踩过的坑也值得记一下：

- **web profile 的工具在 preset 里**，全局只有 peer 自己的工具；
- **0.2.0 没有 `session/resume`**，重连必须回退 `agents.resume`；
- **HMR 只替换 profile 目录内的插件文件**，树外的新文件不会热加载——所以桥才做成了独立进程；
- **Windows 沙箱要求 temp 在工作区外**，工作区在主目录时 `%LOCALAPPDATA%\Temp` 正好落在里面，会直接拒绝启动；
- **微信开发者工具 CLI 要写 `%LOCALAPPDATA%`**，工作区不在主目录时会被沙箱拦；还要在设置里手动打开"服务端口"，预览码必须用真实 AppID（`touristappid` 会报 `不存在此 AppID`）。

## 7. 限制与后续

- link 侧 agent 是事件驱动的：只在被 prompt 时运行，不能凭空主动开一轮；但可以在跑任务中 `peer_reply` 插话。
- 看板目前只覆盖经过桥的连接；直连 TCP 的 link 需要把同样的录制逻辑放进 hub。
- 如果是多人/多机，可能要给事件加订阅与权限（现在 token 是全有或全无）。
- 想做"嵌进 dsh Web GUI 的面板"，需要客户端插件 + typert 描述符，工作量明显更大，暂时保持独立页面。

## 8. 代码

- 仓库：[SparksDing/dsh-peer](https://github.com/SparksDing/dsh-peer)
- 后端：`lib/protocol.js`、`lib/hub.js`、`lib/link.js`、`lib/link-server.js`
- 传输：`lib/transport.js`、`lib/ws.js`
- 前端看板：`lib/activity.js`（事件模型 + HTML）、`bin/peer-ws-bridge.mjs`（旁路解析 + HTTP 端点）
- 测试：`node test/hub.test.mjs`、`node test/tools.test.mjs`（无需模型、无需 dsh）

如果这个思路对你有用，欢迎拿去改。也欢迎在 issue 里聊聊更好的观测方案——尤其是"怎么在不改被观测进程的前提下做事件旁路"这件事。
