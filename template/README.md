# template

One line describing what this pack is for. Copy this file, keep the shape,
replace the content.

| Directive | Form | Description |
| --- | --- | --- |
| `::template_hello{}` | leaf | A greeting box for a given name. |

Write each directive in the form its `kind` declares: `:name[text]{attrs}`
for `inline`, `::name{attrs}` for `leaf`, and a fenced `:::name{attrs} ...
:::` block for `container`.

## `template_hello`

```markdown
::template_hello{name="Ada"}
```

Attributes:

- `name` (string, optional): the name to greet. Defaults to "there".

This component is not data-bound, so it has no expected data shape. The
section for a component that reads `data=` documents the shape it expects,
for example:

```json
{ "value": 42, "label": "CPU" }
```
