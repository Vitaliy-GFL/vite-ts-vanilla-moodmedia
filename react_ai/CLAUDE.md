# Harmony HTML Template — React + Vite

## What is this

An HTML template for the Mood Media Harmony platform. The template runs on media players (Android, SoC, Windows) inside an embedded browser. The player loads `index.html`, reads `mframe.json` for customization, and manages the template lifecycle via the `window.Loader` API.

## Stack

- Vite, React, TypeScript, Sass, Zustand
- `mtemplate-loader` — SDK for Player communication (available as `window.Loader`)
- `mtemplate` — CLI to compile the template into a zip for uploading to Harmony
- `@vitejs/plugin-legacy` — transpilation for chrome 50+ (older devices)

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
│   └── DebugModal.scss
├── hooks/
│   └── useConsoleCapture.ts    # Intercepts console.log/warn/error into state
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

## mframe.json

The file `public/mframe.json` is the template configuration for customization through the Harmony UI.

### Structure

```json
{
  "components": [
    {
      "name": "uniqueComponentName0",
      "locked": false,
      "label": {
        "en-US": { "value": "Display Name", "tooltip": "Description" }
      },
      "params": [
        {
          "name": "paramName",
          "type": "rangedInt",
          "value": 50,
          "locked": false,
          "label": {
            "en-US": { "value": "Param Label", "tooltip": "Help text" }
          },
          "typeOptions": {
            "renderType": "slider",
            "min": 0,
            "max": 100
          }
        }
      ]
    }
  ]
}
```

### Rules

- Required fields on a parameter: `name`, `type`, `value`, `label`. `locked` and `typeOptions` are optional (some types require `typeOptions` — see the table).
- Component `name` must be **unique**. Convention: `camelCase` + numeric suffix (`myComponent0`). Duplicates will break Harmony.
- Parameter `name` must be **unique within its component**.
- `locked: true` — hides the component/parameter in Harmony Visuals (still visible in HTML Editor).
- `label` — object with localizations. Key is a language code (`en-US`). `tooltip` provides a hint for the user.
- `typeOptions` — extra configuration for the parameter (constraints, choices, render variant). The UI variant goes inside as `typeOptions.renderType`.

### Parameter types

The `renderType` column lists valid values for `typeOptions.renderType`.

| type             | value type           | typeOptions                                                  | Description                                                       |
| ---------------- | -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `string`         | string               | `renderType: "limited"` enables advanced options (see below) | Text input (single-line by default)                               |
| `bool`           | boolean              | —                                                            | Toggle                                                            |
| `int`            | number               | —                                                            | Integer                                                           |
| `rangedInt`      | number               | `renderType: "slider"`, `min`, `max`, `step?`                | Single integer with slider constraints                            |
| `intRange`       | `{min, max}`         | `min`, `max`, `step?`                                        | User-selected sub-range within bounds                             |
| `color`          | string               | —                                                            | Hex color, e.g. `"#ff0000"` (no alpha — see Device constraints)   |
| `select`         | string               | `renderType`, `values: string[]`                             | Single choice. renderType: `btngroup`, `radio`, `fontSelect`, `fontSize`, `images` |
| `imageReference` | `string[]`           | —                                                            | Image paths picked via Harmony UI                                 |
| `mediaReference` | `number[]`           | —                                                            | Media IDs, used with `getPlaylistItems`                           |
| `array`          | `string[]`           | —                                                            | Free-form list of user-entered strings                            |
| `separator`      | boolean (unused)     | —                                                            | Visual group header, not a data param. Groups the params that follow it — until the next `separator` or the end of the component |

### Examples

```jsonc
// rangedInt — single number with slider
{
  "name": "X",
  "type": "rangedInt",
  "value": 0,
  "label": { "en-US": { "value": "X", "tooltip": "..." } },
  "typeOptions": { "renderType": "slider", "min": 0, "max": 100 }
}

// intRange — user picks a sub-range within bounds
{
  "name": "fontSize",
  "type": "intRange",
  "value": { "min": 12, "max": 100 },
  "label": { "en-US": { "value": "Font Size", "tooltip": "..." } },
  "typeOptions": { "min": 10, "max": 100, "step": 1 }
}

// select — single choice rendered as a button group
{
  "name": "textTransform",
  "type": "select",
  "value": "none",
  "label": { "en-US": { "value": "Text Case", "tooltip": "..." } },
  "typeOptions": {
    "renderType": "btngroup",
    "values": ["none", "uppercase", "capitalize", "lowercase"]
  }
}

// separator — visual group header; groups all params after it,
// until the next separator or the end of the component
{
  "name": "alignmentSeparator",
  "type": "separator",
  "value": false,
  "label": { "en-US": { "value": "Alignment", "tooltip": "" } }
}
```

### Advanced string options (`renderType: "limited"`)

Setting `typeOptions.renderType: "limited"` on a `string` param enables multiline input and/or a character limit. Both features are configured via **sibling parameters in the same component** and apply to **every** `limited` string in that component:

- **Multiline** — add a `bool` param named `multiline` with `value: true`. The string preserves line breaks.
- **Character limit** — add an `int` param named `maxCharacters` with `typeOptions.renderType: "maxCharacters"` and `value` = the limit.

Both helper params can have `locked: true` to hide them from the Visuals UI.

```jsonc
{
  "name": "textBlock",
  "params": [
    {
      "name": "body",
      "type": "string",
      "value": "Multi\nline\ntext",
      "label": { "en-US": { "value": "Body", "tooltip": "..." } },
      "typeOptions": { "renderType": "limited" }
    },
    {
      "name": "multiline",
      "type": "bool",
      "value": true,
      "locked": true,
      "label": { "en-US": { "value": "Multiline", "tooltip": "..." } }
    },
    {
      "name": "maxCharacters",
      "type": "int",
      "value": 280,
      "locked": true,
      "label": { "en-US": { "value": "Max chars", "tooltip": "..." } },
      "typeOptions": { "renderType": "maxCharacters" }
    }
  ]
}
```

### Current mframe.json

Components:

- **debug** — debug options
  - `enabled` (bool): show the DebugModal overlay with captured console logs.

### How to add a new parameter

1. Add the parameter to the appropriate component in `public/mframe.json`. Required: `name`, `type`, `value`, `label`. Add `typeOptions` if the type needs it (see Parameter types table) and `locked: true` to hide it from the Visuals UI.
2. Read the value in React via Zustand: `useTemplateStore.getState().getParam<T>('componentName', 'paramName')`

### How to add a new component

1. Add a component to the `components` array in `public/mframe.json`
2. Use a unique `name` (do not repeat existing ones)

## Accessing mframe parameters in code

```typescript
// In React components
const value = useTemplateStore((s) => s.getParam<string>("componentName", "paramName"));

// Outside React
const value = useTemplateStore.getState().getParam<boolean>("debug", "enabled");
```

## Player API

API is available through wrappers in `src/services/api/`. Playback API works **only after `isStarted()`**.

Callback functions for `playlist.ts` and `p2p.ts` are registered on the global scope via `Object.defineProperty` — this is an Android Player requirement. For the same reason, Terser is configured to preserve identifiers (`keep_fnames` and `keep_classnames` in `vite.config.ts`) — the Player looks up callbacks by name and minified names break it. Don't change.

### P2PClient

`src/services/api/p2p.ts` exports a `P2PClient` class with a pub/sub API.

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

## AspectRatioContainer

Wraps all template content. Maintains the given aspect ratio (e.g. `16/9`) when the player zone resizes. Uses `ResizeObserver` to fit the content area inside the available space.

```tsx
<AspectRatioContainer ratio={16 / 9}>{/* template content */}</AspectRatioContainer>
```

The content element publishes its actual rendered size as CSS custom properties on itself (in `px`):

- `--aspect-w` — content width
- `--aspect-h` — content height

These are consumed by the aspect-relative `*a` helpers in Sass and `utils/px.ts` (see below).

## Design dimensions

Defined once in `src/config/design.ts` (`DESIGN_WIDTH`, `DESIGN_HEIGHT`). Both Sass and JS utils read from this single source:

- **Sass**: Vite injects `$design-width` / `$design-height` via `css.preprocessorOptions.scss.additionalData`
- **JS**: `src/utils/px.ts` imports from `@/config/design`

To change the design size, edit `src/config/design.ts` only.

## Px-to-vw/vh helpers

Convert design px to viewport- or container-relative lengths. Defined in `src/styles/_functions.scss` (Sass) and `src/utils/px.ts` (JS — return `style`-prop strings like `"15.625vw"`).

### Viewport-relative (default)

Use when content fills the whole viewport (no `AspectRatioContainer`).

| Function   | Sass | JS  | Based on | Description       |
| ---------- | :--: | :-: | -------- | ----------------- |
| `px(v)`    |  ✓   |  ✓  | width    | design px → vw    |
| `pxh(v)`   |  ✓   |  ✓  | height   | design px → vh    |
| `font(v)`  |  ✓   |  ✓  | height   | font size via vh  |
| `fontw(v)` |  ✓   |  —  | width    | font size via vw  |

```scss
@use "functions" as *;

.element {
  width: px(300); // → 300/1920 * 100vw
  height: pxh(100); // → 100/1080 * 100vh
  font-size: font(24);
}
```

```tsx
import { px, pxh, font } from "@/utils/px";

<div style={{ width: px(300), fontSize: font(24) }} />;
```

### Aspect-relative (inside `AspectRatioContainer`)

Scale with the container's actual rendered size (read from `--aspect-w` / `--aspect-h`), not the viewport. Use when the player zone may be wider/taller than the chosen aspect ratio (letterbox/pillarbox bars).

| Function    | Sass | JS  | Based on | Description                                |
| ----------- | :--: | :-: | -------- | ------------------------------------------ |
| `pxa(v)`    |  ✓   |  ✓  | width    | design px → `calc(... * var(--aspect-w))`  |
| `pxha(v)`   |  ✓   |  ✓  | height   | design px → `calc(... * var(--aspect-h))`  |
| `fonta(v)`  |  ✓   |  ✓  | height   | font size, container-height relative       |
| `fontwa(v)` |  ✓   |  ✓  | width    | font size, container-width relative        |

```scss
.element {
  width: pxa(300);
  height: pxha(100);
  font-size: fonta(24);
}
```

```tsx
import { pxa, pxha, fonta } from "@/utils/px";

<div style={{ width: pxa(300), height: pxha(100), fontSize: fonta(24) }} />;
```

## Layout rules

- When building menus/blocks, do NOT default to `position: absolute` for everything. Agree on the CSS layout approach with the user first: some menus should stretch to fill the free space (flex/flow), others must sit at a specific spot.

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
- `npm run build` — lint + tsc + vite build + `mtemplate compile` → zip
- `npm run build:simple` — tsc + vite build only (no `mtemplate`)
- `npm run lint` — oxlint
- `npm run fmt` / `npm run fmt:check` — oxfmt format / check
