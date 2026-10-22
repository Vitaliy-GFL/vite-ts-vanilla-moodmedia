# mframe.json

The file `public/mframe.json` is the template configuration for customization through the Harmony UI.

## Structure

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

## Rules

- Required fields on a parameter: `name`, `type`, `value`, `label`. `locked` and `typeOptions` are optional (some types require `typeOptions` — see the table).
- Component `name` must be **unique**. Convention: `camelCase` + numeric suffix (`myComponent0`). Duplicates will break Harmony.
- Parameter `name` must be **unique within its component**.
- `locked: true` — hides the component/parameter in Harmony Visuals (still visible in HTML Editor).
- `label` — object with localizations. Key is a language code (`en-US`). `tooltip` provides a hint for the user.
- `typeOptions` — extra configuration for the parameter (constraints, choices, render variant). The UI variant goes inside as `typeOptions.renderType`.

## Parameter types

The `renderType` column lists valid values for `typeOptions.renderType`.

| type             | value type           | typeOptions                                                  | Description                                                       |
| ---------------- | -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `string`         | string               | —                                                            | Text input, single-line. For multi-line text see "Multiline strings" below |
| `bool`           | boolean              | —                                                            | Toggle                                                            |
| `int`            | number               | —                                                            | Integer                                                           |
| `rangedInt`      | number               | `min?`, `max?`, `step?`, `renderType: "slider"?`             | Integer with min/max/step constraints. All `typeOptions` optional — give only `min` (or `max`) to bound the value (e.g. forbid negatives) and it renders as a plain number input; add `renderType: "slider"` for a slider paired with a number input for manual entry |
| `intRange`       | `{min, max}`         | `min`, `max`, `step?`                                        | User-selected sub-range within bounds                             |
| `color`          | string               | —                                                            | Hex color, e.g. `"#ff0000"` (no alpha — see Device constraints)   |
| `select`         | string               | `renderType: "radio"`, `values: string[]`                     | Single choice. Other renderTypes (`btngroup`, `fontSelect`, `fontSize`, `images`) render broken in the Harmony editor — do not use |
| `imageReference` | `string[]`           | —                                                            | Image paths picked via Harmony UI                                 |
| `mediaReference` | `number[]`           | —                                                            | Media IDs, used with `getPlaylistItems`                           |
| `array`          | `string[]`           | —                                                            | Free-form list of user-entered strings                            |
| `separator`      | boolean (unused)     | —                                                            | Visual group header, not a data param. Groups the params that follow it — until the next `separator` or the end of the component |

## Examples

```jsonc
// rangedInt — single number with slider
{
  "name": "X",
  "type": "rangedInt",
  "value": 0,
  "label": { "en-US": { "value": "X", "tooltip": "..." } },
  "typeOptions": { "renderType": "slider", "min": 0, "max": 100 }
}

// rangedInt — plain number input, min-only bound (forbids negatives / values below 11)
{
  "name": "charLimit",
  "type": "rangedInt",
  "value": 120,
  "label": { "en-US": { "value": "Character Limit", "tooltip": "..." } },
  "typeOptions": { "min": 11 }
}

// intRange — user picks a sub-range within bounds
{
  "name": "fontSize",
  "type": "intRange",
  "value": { "min": 12, "max": 100 },
  "label": { "en-US": { "value": "Font Size", "tooltip": "..." } },
  "typeOptions": { "min": 10, "max": 100, "step": 1 }
}

// select — single choice rendered as radio buttons
{
  "name": "textTransform",
  "type": "select",
  "value": "none",
  "label": { "en-US": { "value": "Text Case", "tooltip": "..." } },
  "typeOptions": {
    "renderType": "radio",
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

## Multiline strings

Do not use `renderType: "limited"`, `multiline` or `maxCharacters` — they render broken in the Harmony editor. Instead keep a plain `string` and write a literal `\n` for a line break (in `mframe.json` that is `"\\n"`; Harmony shows it as `\n`), then split it in code:

```ts
const lines = text.split(/\\n|\r?\n/); // accepts both the literal \n and real newlines
```

Mention it in the tooltip, e.g. `"Use \\n for a line break"`.

## Current mframe.json

Components:

- **debug** — debug options
  - `enabled` (bool, default `false`): show the DebugModal overlay with captured console logs.

## How to add a new parameter

1. Add the parameter to the appropriate component in `public/mframe.json`. Required: `name`, `type`, `value`, `label`. Add `typeOptions` if the type needs it (see Parameter types table) and `locked: true` to hide it from the Visuals UI.
2. Read the value in React via Zustand: `useTemplateStore.getState().getParam<T>('componentName', 'paramName')`

## How to add a new component

1. Add a component to the `components` array in `public/mframe.json`
2. Use a unique `name` (do not repeat existing ones)

## Accessing mframe parameters in code

```typescript
// In React components
const value = useTemplateStore((s) => s.getParam<string>("componentName", "paramName"));

// Outside React
const value = useTemplateStore.getState().getParam<boolean>("debug", "enabled");
```
