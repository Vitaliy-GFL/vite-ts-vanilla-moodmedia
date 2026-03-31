# Harmony HTML Template — React + Vite

## What is this

An HTML template for the Mood Media Harmony platform. The template runs on media players (Android, SoC, Windows) inside an embedded browser. The player loads `index.html`, reads `mframe.json` for customization, and manages the template lifecycle via the `window.Loader` API.

## Stack

- Vite, React 18, TypeScript, Sass, Zustand
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
│       ├── p2p.ts              # P2P API (joinChannel, sendChannelMessage)
│       ├── analytics.ts        # Analytics API (getSessionId, createAnalyticsEvent)
│       ├── player-params.ts    # Player parameters (getPlayerParameters)
│       └── debug.ts            # Debug tools (openDevTools)
├── components/
│   ├── AspectRatioContainer.tsx # Maintains aspect ratio on resize (wraps all content)
│   ├── AspectRatioContainer.scss
│   ├── DebugModal.tsx          # Draggable/resizable debug console overlay
│   └── DebugModal.scss
├── hooks/
│   └── useConsoleCapture.ts    # Intercepts console.log/warn/error into state
└── styles/
    ├── _functions.scss         # px(), pxh(), font() — convert design px to vw/vh
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
          "type": "string",
          "value": "default value",
          "locked": false,
          "label": {
            "en-US": { "value": "Param Label", "tooltip": "Help text" }
          }
        }
      ]
    }
  ]
}
```

### Rules

- Component `name` must be **unique**. Convention: `camelCase` + numeric suffix (`myComponent0`). Duplicates will break Harmony.
- Parameter `name` must be **unique within its component**.
- `locked: true` — hides the component/parameter in Harmony Visuals (still visible in HTML Editor).
- `label` — object with localizations. Key is a language code (`en-US`). `tooltip` provides a hint for the user.

### Parameter types

| type             | value type   | renderType                                              | Description                                            |
| ---------------- | ------------ | ------------------------------------------------------- | ------------------------------------------------------ |
| `string`         | string       | `limited` (multiline)                                   | Text string                                            |
| `bool`           | boolean      | —                                                       | Toggle                                                 |
| `int`            | number       | —                                                       | Integer                                                |
| `rangedInt`      | number       | `slider`                                                | Number with slider, requires `typeOptions.min/max`     |
| `color`          | string       | —                                                       | Color                                                  |
| `select`         | string       | `btngroup`, `radio`, `fontSelect`, `fontSize`, `images` | Single choice from `typeOptions.values`                |
| `multiselect`    | object       | `btngroup`                                              | `{"opt1": true, "opt2": false}`                        |
| `feed`           | string (URL) | —                                                       | RSS feed, `typeOptions: {refreshRate, supportedTypes}` |
| `imageReference` | array        | —                                                       | Image reference                                        |
| `mediaReference` | array        | —                                                       | Media reference                                        |
| `videoReference` | array        | —                                                       | Video reference                                        |
| `array`          | array        | —                                                       | Array                                                  |
| `componentArray` | array        | —                                                       | Array of components                                    |

### Current mframe.json

Components:

- **debug** — debug options
  - `enabled` (bool): show the debug modal with console logs (DebugModal). The modal is draggable, collapsible/expandable, and resizable. The header displays the app version from package.json.

### How to add a new parameter

1. Add the parameter to the appropriate component in `public/mframe.json`
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

Callback functions for `playlist.ts` and `p2p.ts` are registered on the global scope via `Object.defineProperty` — this is an Android Player requirement.

## AspectRatioContainer

Wraps all template content. Maintains the given aspect ratio (e.g. `16/9`) when the player zone resizes. Uses `ResizeObserver` to fit the content area inside the available space.

```tsx
<AspectRatioContainer ratio={16 / 9}>{/* template content */}</AspectRatioContainer>
```

## Design dimensions

Defined once in `src/config/design.ts` (`DESIGN_WIDTH`, `DESIGN_HEIGHT`). Both Sass and JS utils read from this single source:

- **Sass**: Vite injects `$design-width` / `$design-height` via `css.preprocessorOptions.scss.additionalData`
- **JS**: `src/utils/px.ts` imports from `@/config/design`

To change the design size, edit `src/config/design.ts` only.

## Sass px-to-vw/vh functions

Defined in `src/styles/_functions.scss`. Convert design px to `vw`/`vh`.

```scss
@use "functions" as *;

.element {
  width: px(300); // → 300/1920 * 100vw
  height: pxh(100); // → 100/1080 * 100vh
  font-size: font(24); // → vh-based
  font-size: fontw(24); // → vw-based
}
```

## JS px-to-vw/vh utilities

Defined in `src/utils/px.ts`. Two groups of functions:

**CSS unit strings** (for `style` props) — return strings like `"15.625vw"`:

| Function   | Based on | Description           |
| ---------- | -------- | --------------------- |
| `px(v)`    | width    | design px → vw string |
| `pxh(v)`   | height   | design px → vh string |
| `font(v)`  | height   | font size via vh      |
| `fontw(v)` | width    | font size via vw      |

```tsx
import { px, pxh, fontw, pxAbs } from "@/utils/px";

// inline styles
<div style={{ width: px(300), fontSize: fontw(24) }} />;

// JS calculations (e.g. canvas)
const actualWidth = pxAbs(300); // → number
```

## Device constraints

- Do not use `autoplay` for video — only manual `play()` after `isStarted()`
- CSS: use `vw`/`vh` for sizes. Do not use `max()`, `min()`, `clamp()`
- Do not use `#RGBA` / `#RRGGBBAA` color format
- Do not animate `blur`
- Maximum 9–12 simultaneous CSS animations
- Use `transform` instead of `top`/`left` for animations
- `touchstart` works better than `click` on players
- `Node.appendChild()` instead of `ParentNode.append()`

## Linting & Formatting

Uses **oxlint** (linter) and **oxfmt** (formatter) instead of ESLint/Prettier.

- Config: `.oxlintrc.json` (linter), `.oxfmtrc.json` (formatter)
- `npm run lint` — run oxlint
- `npm run fmt` — format source files
- `npm run fmt:check` — check formatting without writing

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build + mtemplate compile → zip
- `npm run build:simple` — tsc + vite build only (no mtemplate)
- `npm run lint` — oxlint
- `npm run fmt` / `npm run fmt:check` — oxfmt format / check
