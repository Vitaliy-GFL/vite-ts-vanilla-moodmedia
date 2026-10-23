# Harmony HTML Template — React + Vite

## What is this

An HTML template for the Mood Media Harmony platform. The template runs on media players (Android, SoC, Windows) inside an embedded browser. The player loads `index.html`, reads `mframe.json` for customization, and manages the template lifecycle via the `window.Loader` API.

## Documentation

This file is the always-loaded overview. Read the relevant sub-doc on demand — don't load them all up front:

- [`docs/mframe.md`](docs/mframe.md) — `mframe.json` config: structure, rules, parameter types & `typeOptions`, examples, multiline strings, how to add params/components, reading params in code. **Read when** editing `public/mframe.json` or wiring a Harmony parameter.
- [`docs/player-api.md`](docs/player-api.md) — Player API wrappers (`src/services/api/`) and the `P2PClient` class. **Read when** using Playback/Playlist/P2P/Analytics APIs or touching global callback registration.
- [`docs/styling.md`](docs/styling.md) — `AspectRatioContainer`, design dimensions, px-to-vw/vh helpers (Sass + JS), and layout rules. **Read when** writing any CSS/Sass or laying out content.
- [`README.md`](README.md) — human-facing guide: setup, dev server & URL params, build/packaging, debug console, troubleshooting, plus a section for Harmony users. **Read when** the user asks how to run, build or ship the template, or when editing this guide.

## Stack

- Vite, React, TypeScript, Sass, Zustand
- `mtemplate-loader` — SDK for Player communication (available as `window.Loader`)
- `mtemplate` — CLI to compile the template into a zip for uploading to Harmony
- `@vitejs/plugin-legacy` — transpilation for chrome 89+ (older devices); ELO players need `chrome 74`, see Device constraints

## Project structure

```txt
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Main component with lifecycle initialization
├── types/harmony.d.ts          # Typings for window.Loader, Player API, mframe structures
├── store/templateStore.ts      # Zustand store (components, isStarted, getParam)
├── services/
│   ├── template-loader.ts      # window.Loader lifecycle wrapper (init, ready, start, finish)
│   └── api/
│       ├── playback.ts         # Playback API (openMediaInZone, createCustomZone, etc.)
│       ├── playlist.ts         # Playlist API (getPlaylistItems, setSchedules, mediaAvailability)
│       ├── p2p.ts              # P2P API (P2PClient class: pub/sub, auto ping/pong, server heartbeat)
│       ├── analytics.ts        # Analytics API (AnalyticsClient class: auto session, createEvent, startNewSession)
│       ├── player-params.ts    # Player parameters (getPlayerParameters)
│       └── debug.ts            # Debug tools (openDevTools)
├── components/
│   ├── AspectRatioContainer.tsx # Maintains aspect ratio on resize (wraps all content)
│   ├── AspectRatioContainer.scss
│   ├── DebugModal.tsx          # Draggable/resizable debug console overlay
│   ├── DebugModal.scss
│   ├── ErrorBoundary.tsx       # Catches render errors, reports them via Loader.error()
│   └── ErrorScreen.tsx         # Error UI (init + render errors), keeps DebugModal visible
├── hooks/
│   └── useConsoleCapture.ts    # Module-level console.log/warn/error capture (installed in main.tsx) + hook
├── config/
│   └── design.ts               # DESIGN_WIDTH / DESIGN_HEIGHT (single source for Sass + JS)
├── utils/
│   └── px.ts                   # JS px-to-vw/vh helpers (viewport + aspect-relative)
└── styles/
    ├── _functions.scss         # Sass px-to-vw/vh helpers (viewport + aspect-relative)
    ├── _variables.scss
    ├── _reset.scss
    └── main.scss
```

## Template lifecycle

Initialization order in `App.tsx` is **mandatory**:

1. `getComponents()` — load parameters from mframe.json
2. `ready()` — notify the player the template is ready to be shown
3. `isStarted()` — wait for the player to put the template on screen
4. After `isStarted` — animations can run and Playback API can be used

`window.mvTemplate` is registered for live-update in the Harmony Editor.

## Device constraints

- Do not use `autoplay` for video — only manual `play()` after `isStarted()`
- CSS: use `vw`/`vh` for sizes. Do not use `max()`, `min()`, `clamp()`
- Do not use `#RGBA` / `#RRGGBBAA` color format
- Do not animate `blur`
- Maximum 9–12 simultaneous CSS animations
- Use `transform` instead of `top`/`left` for animations
- `touchstart` works better than `click` on players
- `Node.appendChild()` instead of `ParentNode.append()`

### ELO players (Android 7.1.2)

Learned on Dyson PC-921 (mvision-templates, `custom/Dyson/PC/Apps/react_versions/Dyson-PC-921`):

- **The player renders with Chrome 74.** The page's user agent says `Chrome/74`, although Android settings show System WebView 89. Trust the UA, not the settings screen.
- **The default `chrome 89` target does not run there.** `?.` and `??` (Chrome 80) stay in `index-legacy-*.js`, the script fails with `Unexpected token .` and the template shows a black screen (or only its static preview). For ELO set `legacy({ renderModernChunks: false, targets: ["chrome 74"] })` in `vite.config.ts`.
- **No CSS newer than Chrome 74 either:** no flex `gap` (84; use margins), `inset` (87) or `aspect-ratio` (88); `min()`/`max()`/`clamp()` (79) are already banned above.
- **The template is served from `http://127.0.0.1`, not `file://`.** Leave `crossorigin` on the script tags: it is not the cause of a black screen, and without it the bundle starts running in the Harmony editor preview, where `getComponents()` gets no answer.
- **`chrome://inspect` does not reach the player.** To see why a build fails on the device, put an inline script in `main.html` that collects `error`/`unhandledrejection` events and, if the app has not started within ~15 s, prints `location.href`, `navigator.userAgent` and the errors over the page (Dyson PC-921's `main.html` has one).
- **Check the bundle after the build:** parse `dist/assets/index-legacy-*.js` (e.g. with acorn) and look for syntax newer than the target (optional chaining, `??`, logical assignment).

## Commands

Tooling: **oxlint** (linter, `.oxlintrc.json`) and **oxfmt** (formatter, `.oxfmtrc.json`) — used instead of ESLint/Prettier.

- `npm run dev` — dev server (port 3000)
- `npm run build` — lint + fmt check + tsc + vite build + `mtemplate compile` (via `scripts/compile.mjs`) → zip
- `npm run build:simple` — tsc + vite build only (no `mtemplate`)
- `npm run lint` — oxlint
- `npm run fmt` / `npm run fmt:check` — oxfmt format / check
