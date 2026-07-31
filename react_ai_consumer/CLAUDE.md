# Harmony HTML Template — React + Vite

## What is this

An HTML template for the Mood Media Harmony platform. The template runs on media players (Android, SoC, Windows) inside an embedded browser. The player loads `index.html`, reads `mframe.json` for customization, and manages the template lifecycle via the `window.Loader` API.

## Documentation

This file is the always-loaded overview. Read the relevant sub-doc on demand — don't load them all up front:

- [`docs/mframe.md`](docs/mframe.md) — `mframe.json` config: structure, rules, parameter types & `typeOptions`, examples, advanced string options, how to add params/components, reading params in code. **Read when** editing `public/mframe.json` or wiring a Harmony parameter.
- [`docs/player-api.md`](docs/player-api.md) — Player API wrappers (from `@visualsolutions/player-api`) and the `P2PClient` class. **Read when** using Playback/Playlist/P2P/Analytics APIs or touching global callback registration.
- [`docs/styling.md`](docs/styling.md) — `AspectRatioContainer`, design dimensions, px-to-vw/vh helpers (Sass + JS), and layout rules. **Read when** writing any CSS/Sass or laying out content.

## Stack

- Vite, React, TypeScript, Sass, Zustand
- `mtemplate-loader` — SDK for Player communication (available as `window.Loader`)
- `mtemplate` — CLI to compile the template into a zip for uploading to Harmony
- `@vitejs/plugin-legacy` — transpilation for chrome 89+ (older devices)
- `@visualsolutions/player-api` — Player API wrappers + Harmony types, consumed from **GitHub Packages** (replaces the old local `src/services/api/` and `src/types/harmony.d.ts`)

## GitHub Packages auth (`@visualsolutions/player-api`)

`@visualsolutions/player-api` lives in the private **VisualSolutions** GitHub Packages registry, not on public npm. The project `.npmrc` only maps the scope to that registry:

```
@visualsolutions:registry=https://npm.pkg.github.com
```

Authentication is per-developer and must **not** be committed. If `npm install` fails on this package with **401 Unauthorized** or **403 Forbidden**, you are missing (or have an expired) token:

1. Create a **classic** Personal Access Token: github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → *Generate new (classic)*.
2. Scopes: `read:packages` (and `repo`, since the package repo is private).
3. Add it to your **global** `~/.npmrc` (never the project `.npmrc`):

   ```
   //npm.pkg.github.com/:_authToken=YOUR_PAT
   ```
4. Re-run `npm install`.

The same token (with `read:packages`) works across every VisualSolutions-scoped package. To publish the package itself you instead need `write:packages` — that is done from the `player-api` repo, not here.

## Project structure

Player API wrappers (`playback`, `playlist`, `p2p`, `analytics`, `player-params`, `debug`) and the Harmony types (`window.Loader` typings, `MframeComponent`, etc.) are **not** in this repo — they come from `@visualsolutions/player-api`, imported per-subpath, e.g. `import { P2PClient } from "@visualsolutions/player-api/p2p"`. Importing any subpath transitively registers the global `window.Loader`/`window.Player` typings.

```txt
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Main component with lifecycle initialization
├── store/templateStore.ts      # Zustand store (components, isStarted, getParam)
├── services/
│   └── template-loader.ts      # window.Loader lifecycle wrapper (init, ready, start, finish)
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

## Commands

Tooling: **oxlint** (linter, `.oxlintrc.json`) and **oxfmt** (formatter, `.oxfmtrc.json`) — used instead of ESLint/Prettier.

- `npm run dev` — dev server (port 3000)
- `npm run build` — lint + fmt check + tsc + vite build + `mtemplate compile` (via `scripts/compile.mjs`) → zip
- `npm run build:simple` — tsc + vite build only (no `mtemplate`)
- `npm run lint` — oxlint
- `npm run fmt` / `npm run fmt:check` — oxfmt format / check
