# Player API

API is available through wrappers from `@visualsolutions/player-api`, imported per subpath (e.g. `@visualsolutions/player-api/playback`, `/p2p`). Playback API works **only after `isStarted()`**.

`createCustomZone(zoneName, left, top, width, height, ...)` — `left`/`top`/`width`/`height` are **percent** of the zone area, not pixels (e.g. `25, 25, 50, 50` = a 50%×50% zone centered on screen).

`persistent` (6th argument, before `behind`) defaults to `false`: leave it so, and pass `true` only when the task explicitly asks for a persistent zone. Non-persistent zones created with the wrapper's `createCustomZone()` and not removed with its `deleteCustomZone()` are stopped and deleted by the package on `beforeunload`, so the template does not need its own `beforeunload` handler for them. Persistent zones, and zones created directly via `window.Loader`, are left in place.

`openDiagnosticsApp()` and `openSettingsApp({ pwd?, visibleHeaders? })` from `@visualsolutions/player-api/apps` open the player's Diagnostics / Settings app and **close playback**, the template included. Both need MAP v5.0+; the Settings options need MAP v6.0+ and older players ignore them. `DebugModal` (expanded) has buttons for both, shown only when `debug.enabled` is on in mframe (not on the `ErrorScreen` fallback when mframe did not load).

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

## Template helpers

Thin layers over the wrappers, in this repo:

- **`usePlaylistMedia(playlistId)`** (`src/hooks/usePlaylistMedia.ts`) — `{ [description]: url }` for the items of a playlist, keyed by the item's description, lowercased. Match by description, not name: Harmony appends a short hash to the name on upload. The URL is `../${contentPlayerFileName}` (media files sit one directory up from the template). The dev server has no playlists, so while the map is empty it returns `DEV_MEDIA` from `src/config/devMedia.ts`: put the files in `/dev-media` at the project root (outside `public/`, so they never reach the zip) and keep the map's values plain string literals, so the build drops them. A playlist picked in a `mediaReference` param comes as `number[]`; pass its first id:

  ```ts
  const playlistId = useTemplateStore((s) => s.getParam<number[]>("menu", "playlist")?.[0]);
  const images = usePlaylistMedia(playlistId);
  ```
- **`getPlayerParams(defaults, timeoutMs = 5000)`** (`src/utils/playerParams.ts`) — `getPlayerParameters` with a default per key: a missing (null/empty) key gets its default, and so does every key when the player does not answer in time (the editor preview and the dev server may never answer).

  ```ts
  const { LOCATION_ID } = await getPlayerParams({ LOCATION_ID: "12068" });
  ```

## Feeds

`useFeed<T>(path, { intervalMs, timeoutMs, enabled })` (`src/hooks/useFeed.ts`) polls a JSON feed and returns `{ data, error, updatedAt }`. A path is resolved against `VITE_FEEDS_BASE` (`.env.development` → `https://mood.local`, the local feeds-api; `.env.production` → the production host); a full URL is used as is. A failed request keeps the last good `data`, sets `error` and logs a `console.warn` (shown in `DebugModal`); requests never overlap. Pass `enabled: isStarted` to hold the requests until the template is on screen.

## Remote debug

`src/services/remote-debug.ts` sends the console output of one device to **template-logs-api** (HarmonyFeeds repo, branch `vs/template-logs`), page `https://uat-feeds.moodmedia.com/template-logs/` (password). It runs on the UAT feeds host only, to keep production clean; production builds send there too.

- **Switch:** the device parameter `REMOTE_DEBUG`, set in Harmony. Empty: off. Non-empty: on, and the value is the key the logs are filed under (pick one that names the screen; templates get no serial number). `App.tsx` starts it once mframe is loaded; it re-reads the parameter every 60 s, so a change takes effect within a minute without a restart.
- **What goes, unasked:** every 10 s a POST (empty if need be: a heartbeat) with every `console.log/warn/error` and uncaught error captured by `useConsoleCapture` (the console capture stays on while remote debug is on, whatever `debug.enabled` says), including what was captured before the switch; a state snapshot once per session (version, browser, screen, `location.href`, mframe params); and every failed request as a `warn` (see Request log).
- **Commands:** the page asks the device for more; the command comes back in the answer to the next POST, the result goes with the POST after. Fixed collectors in `src/services/remote-collectors.ts`, never `eval`: `state`; `playlists` (every playlist of a `mediaReference` param with its items: `description`, `name`, `type`, file, duration, schedule, and `available` from `areMediaFilesAvailable` asked by the item id — to be confirmed on a device; over 60 000 characters the items shrink to `description`, file and `available`); `params` (values of the player parameter keys typed on the page); `requests` (the request log); `dom` (visible elements with box, own text, img/video source and load state; the debug console is left out); `perf` (FPS over 5 s, JS memory, DOM node count); `storage` (localStorage: every item with its size; when the listing would not fit, values over 2000 characters are cut and marked, and the page does not offer to edit them); `storage-set` / `storage-remove` (`args.name`, `args.value`) and `storage-clear` (keeps `mvRemoteDebugKey` and `mvRemoteDebugBuffer`), each answering with the new listing; `reload` (answers, then `location.reload()`; the player sends a template only one `Loader.play()`, so `waitForStart()` in `template-loader.ts` starts the reloaded page itself when `mvRemoteReloadAt` in localStorage is under a minute old). A new collector is a `case` in `runCommand` plus the type in the service's `COMMAND_TYPES` and a button on its page.
- **Not lost:** unsent entries wait in `localStorage` (`mvRemoteDebugBuffer`, ≤ 200) and go after a restart, under the session they came from. The last key is kept as `mvRemoteDebugKey`: it keeps the capture on from the start, and the crash path in `main.html` uses it.
- **Off:** clearing the parameter stops sending and empties the buffer.
- **Host:** `VITE_LOGS_BASE` (`.env.development` → the service on `localhost:3302`, `.env.production` → `https://uat-feeds.moodmedia.com/template-logs`). The module must not write to the console while handling an entry: that would be captured again.

### Request log

`src/services/network-log.ts`, imported first in `main.tsx` so it wraps `fetch` and `XMLHttpRequest` before the Loader loads `mframe.json`. It also records `<img>`, `<video>`, `<audio>`, `<script>` and `<link>` loads and errors from capture-phase listeners (a detached `new Image()` is not seen). It keeps the last 100: time, kind, method, URL, `ok` with the status and duration, or the error: the status and the first 500 characters of the body, or the network reason (Chrome reports a dead host, a refused connection and CORS alike as `Failed to fetch`). Every failure is a `console.warn("Request failed: …")`, so it shows in `DebugModal` too. Requests to `VITE_LOGS_BASE` and `data:`/`blob:` URLs are not recorded.

