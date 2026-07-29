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
| `string`         | string               | `renderType: "limited"` enables advanced options (see below) | Text input (single-line by default)                               |
| `bool`           | boolean              | —                                                            | Toggle                                                            |
| `int`            | number               | —                                                            | Integer                                                           |
| `rangedInt`      | number               | `min?`, `max?`, `step?`, `renderType: "slider"?`             | Integer with min/max/step constraints. All `typeOptions` optional — give only `min` (or `max`) to bound the value (e.g. forbid negatives) and it renders as a plain number input; add `renderType: "slider"` for a slider paired with a number input for manual entry |
| `intRange`       | `{min, max}`         | `min`, `max`, `step?`                                        | User-selected sub-range within bounds                             |
| `color`          | string               | —                                                            | Hex color, e.g. `"#ff0000"` (no alpha — see Device constraints)   |
| `select`         | string               | `renderType`, `values: string[]`                             | Single choice. renderType: `btngroup`, `radio`, `fontSelect`, `fontSize`, `images` |
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

## Advanced string options (`renderType: "limited"`)

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
