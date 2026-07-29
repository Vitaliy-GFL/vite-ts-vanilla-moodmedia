# Styling & layout

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

- **Sass**: Vite loads the `functions` module globally into every `.scss` file via `css.preprocessorOptions.scss.additionalData` (`@use "functions" as * with ($design-width..., $design-height...)`), so the helpers below need no `@use`
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
// no @use needed — helpers are available globally in every .scss file

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

- **Prefer `flex`/`grid` over `position: absolute`.** Use flow-based layout wherever possible so blocks free up or reclaim space when content changes in Harmony (e.g. a menu should grow/shrink and reflow its neighbours instead of overlapping them). Reach for `position: absolute` only for elements that genuinely must sit at a fixed spot.
- **Discuss the CSS layout approach with the user before implementing.** Don't default to `position: absolute` for everything: some menus should stretch to fill the free space (flex/grid/flow), others must sit at a specific spot — agree on this first.
- **Anchor spacing to the edge the element is pinned to.** For a banner fixed at the bottom, set the offset on the bottom (not the top); same for disclaimers, which usually sit at the bottom. When such a block's line count changes, the bottom offset must stay constant and the block should grow upward / shrink downward — anchor it to the bottom so its baseline doesn't move.
- If a template contains several menus, add a dev-mode-only popup overlay to switch between them (for previewing each menu without rebuilding).
