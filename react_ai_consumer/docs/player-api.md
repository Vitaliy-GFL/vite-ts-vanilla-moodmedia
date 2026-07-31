# Player API

API is available through wrappers from `@visualsolutions/player-api`, imported per subpath (e.g. `@visualsolutions/player-api/playback`, `/p2p`). Playback API works **only after `isStarted()`**.

`createCustomZone(zoneName, left, top, width, height, ...)` — `left`/`top`/`width`/`height` are **percent** of the zone area, not pixels (e.g. `25, 25, 50, 50` = a 50%×50% zone centered on screen).

The `playlist` and `p2p` wrappers register callback functions on the global scope via `Object.defineProperty` — this is an Android Player requirement. Those callbacks live inside the package, but they are bundled into **this** template, so Terser here must preserve identifiers (`keep_fnames` and `keep_classnames` in `vite.config.ts`) — the Player looks up callbacks by name and minified names break it. Don't change.

## P2PClient

`@visualsolutions/player-api/p2p` exports a `P2PClient` class with a pub/sub API.

```ts
const p2p = new P2PClient("my-channel", "Device-A", true /* isServer */);
p2p.on("score", (data, from) => console.log(from, data));
p2p.emit("score", { points: 42 });
const peers = p2p.getPeers(); // server mode only
```

- Messages are JSON envelopes `{ type, clientId, data? }`. `clientId` is the device name.
- On construction the client joins the channel and broadcasts `ping`; on any incoming `ping` it replies with `pong` automatically.
- `"ping"` and `"pong"` are reserved type names but still delivered to user subscriptions if present.
- Server mode (`isServer: true`) broadcasts `ping` every 60 seconds and marks a peer `online: false` if it did not respond within 3 seconds of the ping. Peers are never removed from the list.
- No `off`/`once`/`dispose` — instances live for the template lifetime.
