# P2PClient — Design

Date: 2026-04-22
File: `src/services/api/p2p.ts`

## Goal

Replace the current `joinChannel` / `sendChannelMessage` / `sendChannelMessageJson` functions in `src/services/api/p2p.ts` with a `P2PClient` class that:

- Encapsulates join-to-channel plus a single internal dispatcher callback
- Offers pub/sub by message type (`on` / `emit`)
- Automatically sends `ping` on connect and replies with `pong` to other peers' `ping`
- In server mode, periodically pings the channel and maintains a peer list with online status

## Public API

```ts
type Envelope = { type: string; clientId: string; data?: unknown };
type MessageHandler = (data: unknown, fromClientId: string) => void;
type Peer = { clientId: string; online: boolean; lastSeen: number };

class P2PClient {
  constructor(channelName: string, clientId: string, isServer?: boolean);

  on(type: string, handler: MessageHandler): void;
  emit(type: string, data?: unknown): void;
  getPeers(): Peer[];
}
```

### Semantics

- **`constructor(channelName, clientId, isServer = false)`**
  - Calls `window.Loader.joinChannel(clientId, channelName, dispatcher)` to register a **single** internal callback.
  - Immediately sends an initial `ping` to the channel (via `emit("ping")`).
  - If `isServer === true` — starts `setInterval(60_000)` that emits `ping` and evaluates peer online status.
  - The dispatcher is registered as a global `window["__p2pCb_<N>"]` property with a per-instance counter (Android player requirement; existing pattern).

- **`on(type, handler)`**
  - Appends `handler` to `Map<string, MessageHandler[]>`.
  - No unsubscribe (YAGNI — the template lives until `finished()`).
  - No `once()`.

- **`emit(type, data?)`**
  - Builds an envelope `{ type, clientId: self.clientId, data }`, serializes via `JSON.stringify`, sends through `window.Loader.sendChannelMessage(self.clientId, channelName, payload)`.

- **`getPeers()`**
  - Returns a snapshot `Peer[]` (a copy, not the internal array).
  - In client mode (`isServer === false`) the peer registry is **not** maintained → always returns `[]`.

## Global-callback naming requirement

The Android player looks up the channel callback by its function `name`, not just by the `window` property key. Therefore:

- Before `Object.defineProperty(window, callbackName, { value: callback, configurable: true })`, the `callback` function itself must have `callback.name === callbackName`.
- Anonymous arrow functions and class methods do not satisfy this — their `.name` is either `""` or the method name.
- Implementation approach: use a computed object-property name to name the function, then take it out. Example:

  ```ts
  const callbackName = `__p2pCb_${++p2pCallbackCounter}`;
  const named = { [callbackName]: (senderId: string, channel: string, payload: string) => dispatch(senderId, payload) };
  const callback = named[callbackName]; // callback.name === callbackName
  Object.defineProperty(window, callbackName, { value: callback, configurable: true });
  ```

- This applies to the P2P dispatcher; the same pattern is recommended anywhere a Loader callback needs a stable function name.

## Dispatcher behavior

For each incoming `(senderId, _channel, payload)`:

1. **Parse**. `JSON.parse(payload)`. If it throws or the result lacks `type` / `clientId` fields → `console.warn("P2PClient: malformed message", payload)` and return.
2. **Echo filter**. If `envelope.clientId === self.clientId` — ignore.
3. **Peer registry update** (only when `isServer === true`):
   - If the peer with `envelope.clientId` is not in the map — add it with `online: true, lastSeen: Date.now()`.
   - Otherwise update `lastSeen = Date.now()` and `online = true`.
4. **Auto-pong**. If `envelope.type === "ping"` — call `self.emit("pong")`. Then **continue** dispatch so subscriptions on `"ping"` still fire.
5. **Dispatch**. For each handler in `handlers.get(type) ?? []` — call `handler(envelope.data, envelope.clientId)` inside `try/catch`; errors are logged via `console.error` without aborting the remaining handlers.

## Server mode: heartbeat and online status

- The initial ping from the constructor is sent in **both** modes (so other nodes respond with `pong` immediately). The difference is whether an evaluation cycle runs afterwards.
- If `isServer === true`: after the initial constructor ping schedule `setTimeout(() => evaluate(initialPingTime), 3_000)`, and start `setInterval(() => tick(), 60_000)`.
- `tick()`:
  1. `const pingTime = Date.now();`
  2. `self.emit("ping");`
  3. `setTimeout(() => evaluate(pingTime), 3_000);`
- `evaluate(pingTime)`:
  - For each peer in the map: `peer.online = peer.lastSeen >= pingTime`.
  - Peers are **not removed** — they remain with `online: false` until they reply again.
- Client mode sends only the initial constructor `ping`, keeps no registry, and `getPeers()` always returns `[]`.
- The client's own `clientId` never ends up in the registry (echo filter in the dispatcher rejects it).

## File structure

`src/services/api/p2p.ts` after refactoring:

- Exports types: `Envelope`, `MessageHandler`, `Peer`
- Exports class: `P2PClient`
- Does **not** export anymore: `joinChannel`, `sendChannelMessage`, `sendChannelMessageJson`, `ChannelMessageCallback`
- Module-scope counter `p2pCallbackCounter` (outside the class) provides unique callback names across instances.

## Errors and edge cases

- **Non-JSON payload** → `console.warn`, do not throw.
- **Envelope without `type` or `clientId`** → `console.warn`, do not throw.
- **Handler throws** → `console.error`, other handlers keep running.
- **`emit` before Loader is available** — not handled specially; `new P2PClient()` is called from app code after `isStarted()`, so `window.Loader` is guaranteed to exist (same contract as the rest of the API modules).

## Documentation updates (in parallel with refactoring)

### CLAUDE.md

The `Player API` section briefly mentions `src/services/api/p2p.ts`. Updates:

- Add a note that `p2p.ts` now exports a `P2PClient` class with a pub/sub API, auto ping/pong, and optional server heartbeat.
- Usage example (a few lines):

  ```ts
  const p2p = new P2PClient("my-channel", "Device-A", true /* isServer */);
  p2p.on("score", (data, from) => console.log(from, data));
  p2p.emit("score", { points: 42 });
  const peers = p2p.getPeers();
  ```

- Mention that `"ping"` and `"pong"` are reserved type names and handled automatically.

### Code comments

One short comment next to the global-callback registration explaining why `Object.defineProperty(window, ...)` is used and why the function must have a specific `.name` (Android player lookup). Nothing else.

## Out of scope (YAGNI)

- No `off`, `once`, `dispose`, `leave`.
- No peer registry in client mode.
- No `setPingInterval`, `setGraceTimeout` — values are fixed (60_000 / 3_000) until a real use case appears.
- No peer events (`peerOnline`/`peerOffline`) — consumers read `getPeers()` when they need it.

## Manual test plan

- Open the template in dev with `new P2PClient("test", "A")` and a second instance `"B"`; verify `B` receives `ping` from `A` and replies with `pong`.
- Enable `isServer: true` on one instance — after 60 seconds verify `getPeers()` contains other clients with `online: true`; stop one of them — after ~63 seconds `online: false`.
- Send a broken payload (bypass `emit` and push raw non-JSON into the channel) → expect `console.warn` without a crash.
- Inspect `window["__p2pCb_<N>"].name` in the devtools console — confirm it equals the property key (`__p2pCb_<N>`).
