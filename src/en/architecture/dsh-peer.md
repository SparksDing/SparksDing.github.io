---
title: "Let Two DeepSeek Harness Instances Talk Across Machines: dsh-peer's Backend and Activity Dashboard"
isTimeLine: true
date: 2026-10-19
category:
  - Engineering
tag:
  - DeepSeek Harness
  - Plugin
  - Networking
  - Frontend
---

I recently built something small but useful: a channel that lets a DeepSeek Harness (dsh) instance on Linux and another on Windows talk to each other — not "SSH in and run a command", but **two agents delegating turns and messaging each other**. The result is a plugin called `dsh-peer`, plus an activity dashboard that shows the remote agent's thinking as it happens.

Code: [SparksDing/dsh-peer](https://github.com/SparksDing/dsh-peer). This post covers the design, the interaction flow, and why the dashboard lives inside the bridge.

> 中文版: [让两个 DeepSeek Harness 跨机器对话](/architecture/dsh-peer.html)

<!-- more -->

## 1. Background and constraints

dsh ships an SDK protocol over stdio: a parent process spawns `dsh --profile sdk` and speaks JSON-RPC over stdin/stdout. There is no cross-machine channel.

Three real constraints shaped the design:

1. **Windows sits behind NAT.** It can only make outbound connections.
2. **The Linux side's inbound ports are blocked** by the cloud security group; only HTTP-ish ports such as 80/3080 are reachable.
3. The thing being driven is not a bare tool process but a **complete runtime**: its own model route, tool set, session persistence, and filesystem.

So the goal was explicit: reuse dsh's SDK protocol and add a "cross-machine + symmetric" layer without touching the core.

## 2. Architecture: connection direction and service direction are opposite

This is the easiest part to get confused about, and the most important:

|  | Establishes the connection | Sends harness requests | Responds |
|---|---|---|---|
| hub (public side) | listens | yes (`session/prompt`) | only `peer/reply` |
| link (private side) | dials | no | serves harness methods |

NAT only allows the private machine to dial out, so Windows must be the "connection client" — while it is simultaneously the "capability server", exposing its local agent to the hub.

```
        public side (hub)                         private side (link)
  ┌──────────────────────┐                  ┌──────────────────────┐
  │ peer_ask / peer_send │  JSON-RPC reqs   │  HarnessSdkJsonRpc   │
  │ peer_wait / peer_inbox│ ───────────────► │  Server              │
  │                      │                  │   ├─ agents.create   │
  │  PeerHub             │ ◄─────────────── │   ├─ preset.mount    │
  │  links · sessions    │  session.event   │   └─ followup()      │
  └──────────────────────┘                  └──────────────────────┘
            │                                          ▲
            └──────── TCP / TLS / WebSocket ───────────┘
                       (the link always dials)
```

The stack is straightforward:

```
model
 │  peer_ask / peer_send / peer_wait / peer_inbox        (lib/tools.js)
 ▼
PeerHub  link registry · session state · inbox · timeouts (lib/hub.js)
 │
PeerConnection  JSON-RPC requests · heartbeat · timeouts  (lib/protocol.js)
 │
LineTransport   newline-delimited JSON-RPC 2.0 frames     (lib/transport.js)
 │
Duplex:  TCP / TLS / WebSocket                            (lib/ws.js)
```

## 3. Protocol: reuse the SDK dialect

### 3.1 Frames and transport

Every frame is one line of JSON-RPC 2.0: `method` + `id` is a request, `id` alone is a response, `method` alone is a notification. This matches `@deepseek-ai/dsh-sdk-protocol`, so both ends already understand the harness methods:

- `initialize`: cwd, provider, model
- `session/prompt`: enqueue one user message
- `session/wait`, `session/working-directory/*`
- notifications: `session.event`, `session.status`

Only four methods are custom: `peer/hello`, `peer/ping`, `peer/info`, `peer/reply`, plus `peer/ensure-session` for compatibility.

Transport is pluggable because the same JSON-RPC only needs a `Duplex`:

```js
// lib/protocol.js
this.#transport = new LineTransport(socket, socket)
socket.setNoDelay?.(true)
socket.setKeepAlive?.(true, 15_000)
```

### 3.2 Handshake

The first request from a link is:

```json
{
  "jsonrpc": "2.0",
  "id": "req_...",
  "method": "peer/hello",
  "params": {
    "protocol": 1,
    "name": "windows-pc",
    "role": "link",
    "token": "<shared secret>",
    "platform": "win32",
    "cwd": "C:\\Users\\admin",
    "provider": "deepseek-official",
    "model": "deepseek-v4-flash"
  }
}
```

The hub checks the protocol version and compares the token in constant time, refusing anything that does not match. After that:

- an application-level `peer/ping` every 25 seconds, dropping the connection after two consecutive misses;
- on disconnect, the link reconnects with exponential backoff from 1s up to 30s.

### 3.3 One `peer_ask`, end to end

```
me: peer_ask(peer="HP", prompt="check disk")
 │
 ├─ hub.require("HP")                     resolve by name (or unique substring)
 ├─ sessionId = peer-HP-default           identity = link name + topic
 ├─ initialize {cwd, provider, model}     once per connection
 ├─ peer/ensure-session {sessionId}       link tries to resume; otherwise prompt creates it
 ├─ session/prompt {sessionId, blocks} ──► link
 │                                          └─ PeerHarnessServer
 │                                             ├─ agentPresets.resolve("standard")
 │                                             ├─ agents.create/resume
 │                                             │   setup: preset.mount(agentCtx)
 │                                             └─ agent.followup(userMessage)
 │                                                ↓ a real model turn with real tools
 │                                          ◄── session.event  (streamed)
 │                                          ◄── session.status (running/idle)
 ├─ hub sees agent/inbox/spliced           message admitted (correlated by messageId)
 ├─ hub waits for idle and idleCount bump  turn is over
 └─ returns the last assistant/message text
```

One subtle implementation detail: **the hub does not use `session/wait` to detect the end of a turn**. The 0.2.0 SDK server only implements `initialize`, `session/prompt`, and `shutdown`. Instead, the hub keeps per-session state on each connection:

- `receipts`: messageIds confirmed by `agent/inbox/spliced`
- `idleCount`: how many times `session.status` became idle
- `lastAssistant`: text of the last assistant message

The wait condition is "idleCount increased since before the prompt", not "wait for an idle notification" — the latter loses the event when the turn finishes before the wait starts.

### 3.4 Session identity and continuity

Session ids are `peer-<link>-<topic>`:

- reusing a `session` name continues the same conversation; `fresh: true` starts a new one;
- after a reconnect the hub re-runs `initialize`, then `peer/ensure-session` for existing conversations;
- the link first tries `session/resume` to load persisted history; if that fails (first use), the next prompt creates it.

Conversations therefore survive restarts of either side.

### 3.5 Event filtering

`HarnessSdkJsonRpcServer` broadcasts `session.event` for **every session in the runtime**. For a peer channel that is both wasteful and a privacy leak, so the link wraps the transport:

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

`owned` is populated when `session/prompt` or `session/resume` arrives, so only sessions created by this peer connection are forwarded.

## 4. Backend details worth noting

### 4.1 Tools come from agent presets, not the global plane

Mounting the link in the `web` profile hits a snag: peer sessions only see globally registered tools (`peer_reply`, `peer_status`) — no `bash`, `read`, or `write`, because the Web profile moves every model-facing tool row into an agent preset.

The fix is to subclass `HarnessSdkJsonRpcServer` and override `createSession` so the preset is mounted in the pre-publication `setup` hook:

```js
const preset = await presets.resolve(this.presetId)   // defaults to the registry default
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

`setup` runs before the agent is published, so the preset's tools exist when the first prompt is assembled.

### 4.2 Older versions have no `session/resume`

0.2.0's SDK server exposes only three methods, and `agents.create` on an existing session id fails with `session "..." already exists`. The compatibility path catches that and falls back to `agents.resume`:

```js
try {
  handle = await this.ctx.agents.create({ sessionId, meta, agentOptions, setup })
} catch (error) {
  if (!/already exists/i.test(error.message)) throw error
  handle = await this.ctx.agents.resume({ resumeSessionId: sessionId, agentOptions, setup })
}
```

### 4.3 When only an HTTP port is reachable: WebSocket plus a bridge

The public side's 3099 is blocked by the security group, but 3080 works (nginx). So one path was added:

```
link --ws--> nginx (/dsh-peer) --ws--> peer-ws-bridge --tcp--> hub:3099
```

The bridge is tiny: it accepts the WebSocket upgrade and pipes each connection to the hub's TCP port. The hub stays unchanged and keeps listening on raw TCP.

nginx needs one exact-match location that does not disturb the dsh GUI:

```nginx
location = /dsh-peer {
    proxy_pass http://127.0.0.1:3098;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

### 4.4 Binary artifacts get a separate upload endpoint

The protocol carries JSON text only. Pushing screenshots or preview QR codes through JSON-RPC (base64) is expensive and fragile, so there is a small token-checked upload endpoint:

```
PUT http://hub:3080/peer-files/upload/shot1.png?token=...
```

On the remote side, `Invoke-WebRequest -Method Put -InFile` is enough.

## 5. Frontend: the activity dashboard

### 5.1 Why it lives in the bridge

The requirement was to see the remote agent's **thinking** and details: user messages, reasoning, assistant text, tool calls and results, turn boundaries, status changes.

The obvious approach — a dsh client UI plugin — has two problems:

1. Its data plane needs typert Remote descriptors, which are **generated at build time**; out-of-tree plugins have a hard time wiring that up.
2. More importantly, adding a read-only panel should not require restarting the hub that is already running.

The WebSocket bridge happens to sit between the link and the hub and **sees every JSON-RPC frame**. So the dashboard was implemented there: the bridge parses frames on the side, feeds an in-memory store, and serves a minimal HTTP page.

```
link --ws--> nginx(/dsh-peer) --> bridge --tcp--> hub(3099)
                                   │
                                   ├─ parse session.event / session.status
                                   └─ nginx(/peer-ui/) --> GET / and GET /api/activity
```

Neither the hub nor the link changed.

### 5.2 Event model

dsh session events are a discriminated union. The dashboard keeps the ones worth showing:

| Event | Display |
|---|---|
| `user/message` | user or injected message text |
| `assistant/message` | split into `reasoning` and `text` blocks |
| `tool/call` | tool name + argument JSON |
| `tool/result` | result text, red when `isError` |
| `turn/start` / `turn/end` | turn boundaries and end reason |
| `session.status` | running / idle |

Each event is flattened into a ring buffer:

```js
{ seq, at, kind, title?, text? }
```

`seq` is globally monotonic, which makes incremental fetching trivial.

### 5.3 Incremental polling

No push channel — just polling every 900 ms with a `since` cursor:

```
GET /api/activity?since=123&token=...
→ { now, seq, peers: [ { name, sessions: [ { id, status, events: [...] } ] } ] }
```

Only events with `seq > since` come back, so responses stay small. The server keeps the last 400 events per session and 4000 overall, dropping the oldest from the least recently active session.

Polling instead of SSE is a pragmatic choice: a dashboard is usually watched briefly, and failure recovery (refresh, reconnect) costs almost no code.

### 5.4 Rendering

The page is **one self-contained HTML string** with no external assets and no frontend build step — a function returns it directly:

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

Rendering groups by session; new events are appended to the end. The header shows a peer status dot (green when any session is running), and an optional "follow" checkbox keeps the view scrolled to the bottom.

The result is a chronological stream: purple for reasoning, yellow for tool calls, green for results, red for failures, gray for turn boundaries.

### 5.5 Security

The dashboard runs on the public 3080, so:

- both the page and the JSON endpoint require a `token` query parameter;
- the page embeds that token into its fetches;
- the bridge is read-only and exposes no write endpoint.

## 6. Real-world validation

This was not a paper design; it ran end to end on real machines:

1. Windows runs `dsh --profile sdk` as a link and connects to the Linux hub over `ws://…/dsh-peer`;
2. on Linux, `peer_ask(peer="HP", prompt="check disk")` makes the Windows agent run pwsh and return the result;
3. the agent then drives WeChat DevTools through `miniprogram-automator`, reads page elements, takes screenshots, and uploads the preview QR code and screenshots back through the upload endpoint;
4. the dashboard shows its reasoning, tool calls, and results step by step.

Pitfalls worth recording:

- **Web profile tools live in presets**, and only peer tools are global;
- **0.2.0 has no `session/resume`**, so reconnects must fall back to `agents.resume`;
- **HMR only replaces plugin files inside the profile directory**; new files outside it are not hot-loaded — which is why the bridge became a standalone process;
- **The Windows sandbox requires temp to be outside the workspace**; when the workspace is the home directory, `%LOCALAPPDATA%\Temp` is inside it and startup is refused;
- **The WeChat DevTools CLI writes to `%LOCALAPPDATA%`**, so a workspace outside the home directory blocks it; its service port must be enabled manually, and preview requires a real AppID (`touristappid` fails with "AppID does not exist").

## 7. Limitations and next steps

- The link agent is event-driven: it runs only when prompted. It can interject with `peer_reply` during a turn, but cannot start one on its own.
- The dashboard only covers links that go through the bridge; a direct TCP link would need the same recording logic inside the hub.
- With multiple users or machines, events would need subscriptions and per-peer permissions (today the token is all-or-nothing).
- Embedding the panel inside the dsh Web GUI would need a client plugin plus typert descriptors — significantly more work, so it stays a standalone page for now.

## 8. Code

- Repository: [SparksDing/dsh-peer](https://github.com/SparksDing/dsh-peer)
- Backend: `lib/protocol.js`, `lib/hub.js`, `lib/link.js`, `lib/link-server.js`
- Transport: `lib/transport.js`, `lib/ws.js`
- Dashboard: `lib/activity.js` (event model + HTML), `bin/peer-ws-bridge.mjs` (side parsing + HTTP endpoints)
- Tests: `node test/hub.test.mjs`, `node test/tools.test.mjs` (no model and no dsh required)

If the approach is useful to you, take it and adapt it. Issues about better observability are welcome — especially "how to observe a process without modifying it".
