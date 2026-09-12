# nav

A command-style index for the links you keep coming back to: a searchable
list of grouped or loose rows, each with an icon, a label, a description,
and a keyboard hint.

| Directive | Form | Description |
| --- | --- | --- |
| `::::nav_index{}` | container | A filterable frame holding `nav_group` and `nav_link` children. |
| `:::nav_group{}` | container | A card grouping `nav_link` rows under a heading. |
| `::nav_link[]{}` | leaf | One row: icon, label, description, key-cap hint, and an optional link. |

Write the directives in the form their `kind` requires: `::nav_link[text]{attrs}`
for the leaf, and a fenced block for the two containers. A `nav_group`
nested inside a `nav_index` needs MORE colons on the outer fence than on
the inner one, which is why the examples below open `nav_index` with four
colons and `nav_group` with three: the outer fence has to use more colons
than any fence it contains, or the parser cannot tell where the outer one
closes.

## `nav_index`

<!-- screenshot: nav_index -->

```markdown
::::nav_index{search hint="/"}
:::nav_group{title="Guides" icon="book" tone="info"}
::nav_link[Getting started]{href="/docs/start" desc="Install and first note" key="G S"}
::nav_link[Scripting]{href="/docs/scripting" desc="Bind a value, run Lua"}
:::
::::
```

Attributes:

- `search` (optional): shows the filter field. Written bare (`{search}`)
  the field appears with the default placeholder "Search"; written with a
  value (`search="Filter commands..."`) that value becomes the
  placeholder. Left out entirely, no field is shown at all.
- `hint` (string, optional): a key-cap chip at the end of the search
  field. It is a label only, the same as `nav_link`'s `key`: this pack does
  not bind any actual keyboard shortcut.

`nav_index` looks for `nav_group` and `nav_link` children anywhere inside
it (a loose `nav_link` not wrapped in a group renders in its own
ungrouped list, above the groups) and rebuilds them so it can filter them.
The rebuilt rows use the exact same `nav_group`/`nav_link` markup those
directives render on their own, so nothing about a row's appearance
depends on whether it was found by the index or written standalone.

Typing in the field is case-insensitive and matches against a row's
label, description, and key hint, plus its group's title and description:
matching a group's own heading keeps the whole group visible, rows and
all. A group with no title/description match and no matching row is
hidden; an unmatched loose link is hidden the same way. If nothing at all
survives the query, the index shows a single quiet "No matches" line.
Every row is always rendered, even the hidden ones; the field only
toggles visibility, so nothing here is reachable only through a
successful search.

With no `nav_group` or `nav_link` found anywhere inside it, `nav_index`
renders its content exactly as written and shows no field: there is
nothing for it to filter.

## `nav_group`

<!-- screenshot: nav_group -->

```markdown
:::nav_group{title="Guides" desc="Start here" icon="book" tone="info"}
::nav_link[Getting started]{href="/docs/start"}
::nav_link[Scripting]{href="/docs/scripting"}
:::
```

Attributes:

- `title` (string, optional): the heading at the top of the card. Without
  one the card still renders, headed by a quiet "untitled group"
  placeholder.
- `desc` (string, optional): a muted line under the title.
- `icon` (`home` / `doc` / `book` / `folder` / `grid` / `chart` / `check` /
  `star` / `arrow` / `none`, default `none`): the glyph in the heading's
  icon tile.
- `tone` (`accent` / `info` / `success` / `warning` / `danger` / `neutral`,
  default `accent`): the color tint applied to that tile.

A `nav_group` renders exactly the same whether it is written on its own,
as in the snippet above, or found by an enclosing `nav_index`. Its body is
laid out as written: a run of `nav_link` rows is the normal case, but any
markdown renders correctly too.

## `nav_link`

<!-- screenshot: nav_link -->

```markdown
::nav_link[Getting started]{href="/docs/start" desc="Install and first note" key="G S" icon="doc"}
```

Attributes:

- `label` (string, optional): the row's text, used only when the
  directive has no bracket content. Bracket content wins when both are
  written.
- `desc` (string, optional): a muted description under the label.
- `href` (string, optional): the row's destination. Accepted: `http:`,
  `https:`, and `mailto:` absolute addresses, plus anything with no scheme
  at all (a relative path, a `#fragment`, a query string). Rejected:
  everything else, including `javascript:` and `data:` addresses and any
  value carrying a stray control character. A rejected `href` does not
  break the row: the row renders without a link and carries a small "no
  link" marker whose tooltip says why, so a dropped address is visible
  rather than silent. A row with no `href` written at all shows no marker,
  since nothing was dropped.
- `key` (string, optional): a key-cap hint at the end of the row. A label
  only, matching `nav_index`'s `hint`: this pack binds no keyboard
  shortcut for it.
- `icon` (same set as `nav_group`'s `icon`, default `none`): the glyph at
  the start of the row.

With neither bracket content nor `label`, the row still renders, with a
quiet "untitled link" placeholder, rather than a gap in the list.

Write the label as bracket content rather than `label=` where you can. A
leaf directive's attributes do not survive a static HTML export, only its
bracket content does, as plain markdown, so a bracket label keeps the row
readable in an exported note.

Where a link actually goes is the host's decision, not this pack's. An
absolute `http(s)` address behaves the same everywhere. A relative path is
resolved by whatever renders the note, which is not the same in every
host, so prefer absolute addresses for anything you expect to work in more
than one place.

This component is not data-bound; every value is typed into the note by
hand.
