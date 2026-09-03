# Harmony HTML Template (React + Vite)

An HTML template for the **Mood Media Harmony** platform. It runs on media players (Android, SoC,
Windows) inside an embedded browser: the player loads `index.html`, reads `mframe.json` for the
customization the Harmony user configured, and drives the template lifecycle through the
`window.Loader` API.

This repository is a working starting point — the lifecycle, layout scaling, Player API wrappers,
debug console and packaging are already wired up. You add the content.

- **Part 1 — [For developers](#part-1--for-developers)**: build a template from this repo.
- **Part 2 — [For Harmony users](#part-2--for-harmony-users)**: configure a finished template.

---

## Part 1 — For developers

### Prerequisites

- Node.js 24 and npm 11 (verified with `node v24.20.0` / `npm 11.19.0`)
- No global installs needed — the `mtemplate` packaging CLI comes as a dev dependency

```bash
npm ci
```

### Run locally

```bash
npm run dev
```

Opens `http://localhost:3000/main.html`. `main.html` is the dev entry point; `index.html` at the
repo root only exists for a moment during packaging (see [Build & package](#build--package)).

In the browser there is no real player, so the `mtemplate-loader` SDK stands in for it:

- `getComponents()` fetches `public/mframe.json` over HTTP
- `isStarted()` resolves **immediately**, so the template starts right away

Useful URL parameters the loader reads (append to `main.html`):

| Parameter        | Effect                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| `?autoPlay=false` | `isStarted()` never resolves — lets you inspect the pre-start state     |
| `?duration=15000` | Sets the duration returned by `getDuration()` (ms)                      |
| `?platformType=`  | Emulates a platform type (e.g. `WebStreaming`)                          |

Editing `public/mframe.json` triggers a full page reload, so parameter changes show up immediately.

### Where to put your content

| What you want to change     | File                                             |
| --------------------------- | ------------------------------------------------ |
| Markup / template content   | `src/App.tsx` — inside `<AspectRatioContainer>`  |
| Styles                      | `src/styles/`, or a `.scss` next to the component |
| Design canvas size          | `src/config/design.ts` (`1920 × 1080` by default) |
| Harmony-configurable params | `public/mframe.json`                             |

`AspectRatioContainer` keeps your content at a fixed aspect ratio when the player zone has a
different shape, and publishes its real rendered size as `--aspect-w` / `--aspect-h` so the
`pxa()` / `fonta()` helpers can scale against it. Write all sizes with the px-to-vw/vh helpers —
never raw `px`. See [`docs/styling.md`](docs/styling.md).

### Lifecycle

The order in `src/App.tsx` is **mandatory** — the player relies on it:

1. `getComponents()` — load the parameters from `mframe.json` (2 s timeout)
2. `ready()` — tell the player the template is ready to be shown
3. `isStarted()` — wait until the player actually puts the template on screen
4. only now — start animations, play video, call the Playback API

Nothing renders before `isStarted` (`App.tsx` returns `null`), so animations can't burn frames
off-screen and video can't start before the template is visible.

Two more pieces of the lifecycle:

- `signalFinished()` — call it when the template has finished its own content and the player may
  move on (only relevant for templates with a self-determined duration)
- `window.mvTemplate` — registered in `App.tsx` so the Harmony Editor can push parameter changes
  live while an author edits the template

### Reading Harmony parameters

Parameters come from `public/mframe.json` and are read through the Zustand store:

```tsx
// inside a React component (re-renders on live updates from the editor)
const title = useTemplateStore((s) => s.getParam<string>("textBlock", "title"));

// outside React
const debug = useTemplateStore.getState().getParam<boolean>("debug", "enabled");
```

To add a parameter: add it to the right component in `public/mframe.json` (`name`, `type`, `value`,
`label` are required), then read it with `getParam`. Types, `typeOptions`, `renderType` variants and
worked examples are in [`docs/mframe.md`](docs/mframe.md).

### Player API

Wrappers live in `src/services/api/` and are safe to call **only after `isStarted()`**:

| Module             | What it covers                                                     |
| ------------------ | ------------------------------------------------------------------- |
| `playback.ts`      | `openMediaInZone`, `createCustomZone`, stop/resume, playback actions |
| `playlist.ts`      | `getPlaylistItems`, item schedules, media availability              |
| `p2p.ts`           | `P2PClient` — pub/sub between players, auto ping/pong               |
| `analytics.ts`     | `AnalyticsClient` — session handling, `createEvent`                  |
| `player-params.ts` | `getPlayerParameters`                                               |
| `debug.ts`         | `openDevTools`                                                      |

Details and gotchas (percent-based custom zones, why callbacks are registered globally) are in
[`docs/player-api.md`](docs/player-api.md).

### Debug console

An on-screen console overlay, since players have no DevTools you can just open.

Turn it on by setting `debug.enabled` to `true` — in `public/mframe.json` for local work, or via
**Debug Options → Show Console** in Harmony on a real player.

- Drag the header to move it, drag the bottom-right corner to resize, `□` / `—` to expand/collapse
- Filter by `ALL` / `LOG` / `WRN` / `ERR`; `✕` clears the buffer
- `</>` asks the player to open its own DevTools
- `P2P` sends a loopback P2P message — a quick check that P2P works on the device
- Keeps the last 200 entries

`console.log/warn/error` are captured from the very first line of `main.tsx`, so messages logged
before the overlay mounts are not lost. Once the parameters are known and `debug.enabled` is
`false`, the capture is uninstalled and the original `console` methods are restored — no overhead
in production.

If the template fails to initialize or a render throws, an error screen appears with the message and
keeps the debug console visible (it defaults to visible there, even if the parameters never loaded).

### Build & package

```bash
npm run build         # lint → format check → tsc → vite build → mtemplate compile
npm run build:simple  # tsc + vite build only, no zip (fast check)
```

`npm run build` produces **`vite-react-ts-moodmedia-ai-1.0.0.zip`** in the repo root — the name is
`<name>-<version>` from `package.json`, so bump `version` there for each release. This zip is what
you upload to Harmony — see [Getting the template into Harmony](#getting-the-template-into-harmony)
for the upload and re-upload steps.

What `scripts/compile.mjs` does around `mtemplate compile`: copies `public/mframe.json` and
`dist/index.html` to the repo root (where the CLI expects them), deletes the sourcemaps from
`dist/assets` so they stay out of the zip, runs the CLI, then removes the temporary root files.

The zip contains `mframe.json`, `index.html`, `mtemplate.json`, `package.json` and the directories
mapped in `mtemplate.json` (`/assets`, `/fonts`, `/images` ← `dist/…`). To ship fonts or images, put
them in `public/fonts/` or `public/images/` — Vite copies `public/` into `dist/`, and the mapping
picks them up from there.

Two build settings must stay as they are: `keep_fnames` and `keep_classnames` in `vite.config.ts`.
The Android player looks up P2P callbacks **by function name**, and minified names break it.

### Device constraints

Players run old embedded browsers on weak hardware. Do not:

- use `autoplay` for video — only a manual `play()` after `isStarted()`
- use `max()`, `min()`, `clamp()` in CSS, or size anything in raw `px` (use the vw/vh helpers)
- use `#RGBA` / `#RRGGBBAA` colors
- animate `blur`
- run more than 9–12 CSS animations at once
- animate `top` / `left` — animate `transform`
- use `ParentNode.append()` (use `Node.appendChild()`) or rely on `click` where `touchstart` works better

### Troubleshooting

| Symptom                                        | Cause / what to check                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nothing renders, no error                      | `isStarted()` hasn't resolved. Locally: did you open the page with `?autoPlay=false`? On a player: the zone hasn't shown the template yet. |
| Nothing happens at all, no logs                | `window.Loader` is missing — `mtemplate-loader` didn't load. Check the imports at the top of `main.tsx`.     |
| `Template configuration load timed out`        | `getComponents()` took longer than 2 s — usually `mframe.json` is missing, unreachable, or invalid JSON.      |
| `Template Error` screen                        | Init failed or a component threw; the reason is on screen and in the debug console.                          |
| Parameter reads as `undefined`                 | Component or parameter `name` doesn't match `mframe.json` exactly (both are case-sensitive).                 |
| P2P works in dev but not on an Android player  | Minified callback names — verify `keep_fnames` / `keep_classnames` are still set in `vite.config.ts`.        |
| Layout is right in dev, cropped on the player  | The zone's aspect ratio differs from the design ratio. Use the aspect-relative helpers (`pxa`, `fonta`).      |

### Further reading

- [`docs/mframe.md`](docs/mframe.md) — `mframe.json`: structure, parameter types, `typeOptions`, examples
- [`docs/player-api.md`](docs/player-api.md) — Player API wrappers and `P2PClient`
- [`docs/styling.md`](docs/styling.md) — `AspectRatioContainer`, design dimensions, px-to-vw/vh helpers, layout rules
- [`CLAUDE.md`](CLAUDE.md) — project overview for AI assistants

---

## Part 2 — For Harmony users

### Getting the template into Harmony

The developer hands you a **zip file** (for example `vite-react-ts-moodmedia-ai-1.0.0.zip`). Do not
unpack it — Harmony expects the archive as-is.

Both flows below start the same way: **log in → select your workgroup → open "HTML Editor"**.

#### Uploading a new template

1. Top right, click the **plus icon in a circle**
2. Choose **"Upload template"**
3. Enter a name for the template
4. Click **"UPLOAD"**
5. Pick the zip archive and confirm
6. When the upload finishes, **double-click** the template to open it
7. Switch **"Template Status"** to active

Until "Template Status" is active, the template can't be used.

#### Updating an existing template

1. Find the template and open it — **double-click** it, or single-click it and press
   **"EDIT TEMPLATE"** at the bottom right
2. In the **bottom-left corner**, click the **re-upload icon** (an arrow pointing up with a line
   above it)
3. Pick the zip archive and confirm
4. Go back to the previous page and wait for the upload and re-encoding to finish

The template keeps its name, its status and the places it is used — only the contents are replaced.
Give the re-encoding time to complete before checking the result on a player.

### Creating a media item from the template

An uploaded template is only the blueprint — to actually use it, create a media item from it:

1. Click the **home icon** and choose **Visuals**
2. In the navigation panel, go to **"Media Library"** and click the **plus icon in a circle**
3. Choose **"Create from template"**
4. In the modal, pick your template and click **"SELECT"**

You can create as many media items from the same template as you need — each one keeps its own
settings.

### Adding it to a channel

1. Go to **Channel Library** and pick the channel you need from the list on the left
2. **Drag** your template from the **Media Library** into the **Channel Editor**

### Configuring it

In the **Channel Editor**, **click the template** to open its parameters. The form you get is
exactly the set of parameters the developer declared in the template's `mframe.json` — nothing more,
nothing less:

- **Sections** group related settings (text, colors, timing, …)
- **Each field** has a label and a tooltip written by the developer — the tooltip explains what the
  setting does
- Some settings are hidden on purpose (technical ones); if you need a setting that isn't there, ask
  the developer to expose it
- Field types differ: text, on/off toggles, numbers, sliders, ranges, color pickers, dropdowns, and
  pickers for images or media from your library

Your settings belong to this media item, not to the template itself — so the same template can be
reused with different settings in different places.

### Settings in this template

| Section           | Setting          | Default | What it does                                                                                            |
| ----------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| **Debug Options** | **Show Console** | Off     | Shows a small on-screen console with technical log messages. For troubleshooting with a developer only. |

**Turn Show Console off before publishing** — with it on, the console overlay is visible on screen
to everyone watching the display.

### Publishing to the devices

Once the template is configured, click the **checkmark** in the **Channel Editor** navigation panel.
That publishes it to every device bound to the selected channel.

### Checking it on a player

Let the player pick up the update and watch the template play in its zone. Things worth checking:

- text isn't cut off and fits the zone
- images and video appear and play
- nothing overlaps or sits off-screen — if the zone has a different shape than the template was
  designed for, tell the developer the zone size
- the debug console is **not** visible

If something looks wrong, turn **Show Console** on, take a photo or screenshot of the display
including the console, and send it to the developer — the messages there are what they need.
