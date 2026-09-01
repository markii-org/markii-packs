# tech

Components for technical documentation and code notes: side-by-side
comparisons, a highlighted code diff, an HTTP method chip, lifecycle and
verification badges, and a pros/cons layout. Nothing here is data-bound;
every attribute is typed in the note.

| Directive | Form | Description |
| --- | --- | --- |
| `:::tech_pane{}` | container | A labeled box: header strip plus content. |
| `:::tech_compare{}` | container | Two or three `tech_pane` children side by side. |
| `:::tech_diff{}` | container | Two `tech_pane` children, diffed and highlighted. |
| `:tech_method[]{}` | inline | A colored HTTP method chip plus a path. |
| `:tech_status[]{}` | inline | A lifecycle badge: stable, beta, deprecated, and so on. |
| `::tech_verified{}` | leaf | A one-line manual-verification record. |
| `:::tech_tradeoff{}` | container | Two columns, Pros and Cons, from `tech_pros`/`tech_cons` children. |
| `:::tech_pros{}` | container | A labeled Pros block. |
| `:::tech_cons{}` | container | A labeled Cons block. |

## `tech_pane`
<img width="964" height="310" alt="image" src="https://github.com/user-attachments/assets/99579cae-7893-46cf-b1c3-22355ea04365" />

```markdown
:::tech_pane{label="Scala"}
Immutable by default.
:::
```

Attributes:

- `label` (string, optional): the header strip's text. Omit it for an
  unlabeled box.

`tech_pane` is usually written as a child of `tech_compare` or
`tech_diff`, but it renders the same way standing alone: the header strip,
then the markdown content below.

## `tech_compare`
<img width="964" height="310" alt="image" src="https://github.com/user-attachments/assets/ac732fcf-dace-4394-8ca9-9c9c88c7fe3f" />

```markdown
::::tech_compare{title="Collection defaults"}
:::tech_pane{label="Scala"}
Immutable by default.
:::

:::tech_pane{label="Kotlin"}
Mutable by default.
:::
::::
```

Attributes:

- `title` (string, optional): a small heading above the panes.

Lays two or three `tech_pane` children side by side, stacking to a
vertical list below roughly 480px of the component's own width. This is
pure layout: each pane renders itself exactly as it would standing alone,
so `tech_compare` never re-implements pane markup. Zero panes, or
children that are not panes, still render without error.

## `tech_diff`
<img width="964" height="310" alt="image" src="https://github.com/user-attachments/assets/5c21f63f-db2b-4531-b2e5-0bb53b5d8875" />

````markdown
::::tech_diff{title="Rate limiter"}
:::tech_pane{label="before"}
```python
def allow(self):
    return True
```
:::

:::tech_pane{label="after"}
```python
def allow(self):
    return self.tokens > 0
```
:::
::::
````

Attributes:

- `title` (string, optional): a small heading above the panes.

Holds exactly a before pane and an after pane. Order decides the side,
not the label text: the first pane is the removed side, the second is the
added side. Each pane's content must contain a fenced code block; the
diff pulls the code out of it and computes a line-level comparison,
tinting removed lines against the danger token and added lines against
the success token.

Diffing is capped at 2,000 lines per side. A note past that cap, a pane
with no code block, or fewer than two panes all fall back to the plain
`tech_compare` layout, quietly, with no highlighting and no error shown.

## `tech_method`
<img width="964" height="170" alt="image" src="https://github.com/user-attachments/assets/ffcc743a-eb5e-4d32-af4f-ca5a62d9346e" />

```markdown
:tech_method[POST]{path="/users/{id}/roles"}
```

Attributes:

- `path` (string, optional): shown in monospace after the chip.

The directive's text is the method. `GET`, `POST`, `PUT`, `PATCH`, and
`DELETE` each get their own tint and are shown uppercase; anything else
renders as neutral text exactly as written.

## `tech_status`
<img width="964" height="170" alt="image" src="https://github.com/user-attachments/assets/ae888089-954a-4fb4-9a9f-d065cf25375a" />

```markdown
:tech_status[deprecated]{since="3.5"}
```

Attributes:

- `since` (string, optional): appended inside the badge as "since
  <value>".

The directive's text is the lifecycle value: one of `stable`, `beta`,
`experimental`, `deprecated`, `removed`, `nightly`, `unsafe`. Each gets
its own tint; anything else renders neutral, with the text shown exactly
as written.

## `tech_verified`
<img width="964" height="170" alt="image" src="https://github.com/user-attachments/assets/7b856e30-cb32-4a18-97db-9feac91d1350" />

```markdown
::tech_verified{env="Spark 3.5.1" result=worked date="2026-08-12" note="Confirmed on a 12-node cluster"}
```

Attributes:

- `env` (string, optional): shown in monospace.
- `result` (string, optional): `worked`, `failed`, or `partial`. Anything
  else renders a neutral marker.
- `date` (string, optional): shown after the environment.
- `note` (string, optional): shown in muted text.

Every field is independent and optional. With nothing usable at all, the
line renders a quiet placeholder rather than an empty box.

## `tech_tradeoff`
<img width="974" height="298" alt="image" src="https://github.com/user-attachments/assets/14842e96-e6bb-4cd6-abe2-4c25a88bd80a" />

```markdown
::::tech_tradeoff{title="Switching to async I/O"}
:::tech_pros
- Higher throughput under load
- No thread-per-connection overhead
:::

:::tech_cons
- Harder to debug with a synchronous mindset
- Every call in the chain has to become async
:::
::::
```

Attributes:

- `title` (string, optional): a small heading above the columns.

Recognizes `tech_pros` and `tech_cons` children by name and lays out two
headed columns from their content. Either one alone still renders as a
single correctly headed column. With neither present, the content
renders as written, without a column layout.

## `tech_pros` / `tech_cons`

```markdown
:::tech_pros
- Simpler mental model
:::

:::tech_cons
- Slower for large batches
:::
```

Both are ordinary components in their own right: standing alone, each
renders its own labeled block. Their content is normally a markdown list;
the list's default outer margin is removed only inside the block, never
on the component's own root.
