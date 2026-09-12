# outline

A titled card whose rows expand to reveal nested detail: a runbook, a
project breakdown, or any note that reads better collapsed first and
expanded on demand.

| Directive | Form | Description |
| --- | --- | --- |
| `:::outline_tree{}` | container | The card an outline lives in, holding `outline_branch` and `outline_item` children. |
| `:::outline_branch{}` | container | An expandable row that reveals a body of nested content. |
| `::outline_item[]{}` | leaf | A terminal row with nothing further to expand. |

Container fences grow with nesting, per the format's rule that the outer
scope always carries more colons than anything inside it (see
`docs/format.md`, "More colons means a bigger scope"). The rows below are
each written on their own, so they use the minimum fence for a container
holding only markdown or leaves. The moment you nest an `outline_branch`
inside another `outline_branch`, or inside an `outline_tree` that also
holds one, the outer one needs to add a colon. See "Nesting a third
level" below for the worked example.

## `outline_tree`

<!-- screenshot: outline_tree -->

```markdown
::::outline_tree{title="Deploy runbook" subtitle="Staging, then production"}
::outline_item[Confirm the branch is green]

:::outline_branch{label="Deploy" icon=folder open}
Ship staging first, then promote once the dashboards are quiet.
:::
::::
```

Attributes:

- `title` (string, optional): the always-visible section header.
- `subtitle` (string, optional): a muted line under the title.

With neither `title` nor `subtitle` written, the header strip is omitted
and the card falls straight to its body. The body is laid out exactly as
written, so prose between rows reads correctly and an outline with no rows
yet is an empty card, not an error.

Because the example above nests an `outline_branch` inside the tree, the
tree's own fence had to grow to four colons to stay outside the branch's
three. A tree holding only leaves (`outline_item`) can stay at three.

## `outline_branch`

<!-- screenshot: outline_branch -->

```markdown
:::outline_branch{label="Rollback" icon=dot meta="if it goes wrong"}
Revert the merge commit and redeploy the previous tag. Do not hotfix under
pressure.
:::
```

Attributes:

- `label` (string, optional): the row title. Without one the row shows a
  quiet "untitled section" placeholder.
- `num` (string, optional): a leading marker rendered verbatim, so write
  `num="2."` if you want the dot to show.
- `meta` (string, optional): muted text at the end of the row.
- `icon` (`folder` / `doc` / `dot` / `none`, default `none`): a small glyph
  at the start of the row. An unrecognized value renders no glyph.
- `open` (flag, optional): starts the branch expanded. Write it bare
  (`{open}`). Without it the branch starts collapsed.

Renders as a native `<details>`/`<summary>` pair, so expanding and
collapsing work with no script. A collapsed branch keeps its body in the
document the whole time; `open` only changes what a reader sees first.

The body can hold plain markdown, a list, a code block, or another
`outline_branch`, which is how a third level of nesting appears: there is
no separate component for it, because a branch inside a branch's body
already reads as a nested, indented section.

### Nesting a third level

A branch written inside another branch's body needs one more colon than
the inner one, and the tree holding both needs one more again:

```markdown
:::::outline_tree{title="Deploy runbook"}
::::outline_branch{label="Deploy" open}
Ship staging, then production.

:::outline_branch{label="If it goes wrong" icon=dot}
Rollback is a revert and a redeploy.

- Revert the merge commit
- Redeploy the previous tag
:::
::::
:::::
```

Here the innermost branch ("If it goes wrong") holds only markdown, so it
stays at three colons. The branch around it ("Deploy") holds that inner
branch, so it grows to four. The tree around both grows to five.

## `outline_item`

<!-- screenshot: outline_item -->

```markdown
::outline_item[Notify #eng before promoting to production]{icon=dot}
```

Attributes:

- `label` (string, optional): the row label, used only when the directive
  has no bracket content. Bracket content wins when both are written.
- `num` (string, optional): as on `outline_branch`.
- `meta` (string, optional): as on `outline_branch`.
- `icon` (`folder` / `doc` / `dot` / `none`, default `none`): as on
  `outline_branch`.

Renders the same row chrome as a branch's summary, minus the chevron: an
item has nothing to expand. Write the label as bracket content rather than
`label=` where you can, since a leaf directive's attributes do not survive
a static HTML export, only its bracket content does, as plain markdown.
With neither bracket content nor `label`, the row shows a quiet "untitled
item" placeholder rather than an empty line.
