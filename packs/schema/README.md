# schema

Components for data engineering reading notes: the shape of a table, the
stages of a pipeline, and the constants worth remembering from a Spark or
warehousing document. Nothing here is data-bound; every value is typed in
the note.

| Directive | Form | Description |
| --- | --- | --- |
| `:::schema_schema{}` | container | A schema card for a table or dataset, holding `schema_col` children. |
| `::schema_col{}` | leaf | One column row: name, type, optional key marker and note. |
| `:::schema_pipeline{}` | container | A horizontal flow of `schema_stage` children with arrows between. |
| `::schema_stage[]{}` | leaf | One pipeline stage chip, with an optional technology line. |
| `::schema_fact[]{}` | leaf | A static figure worth remembering, shown above its caption. |

## `schema_schema`
<img width="975" height="315" alt="image" src="https://github.com/user-attachments/assets/98eded04-f855-45aa-bda3-05a0072fedbf" />

```markdown
:::schema_schema{name="events_raw"}
::schema_col{name="event_id" type=string pk}
::schema_col{name="occurred_at" type=timestamp note="event time, not ingest time"}
:::
```

Attributes:

- `name` (string, optional): the table or dataset name, shown in
  monospace. Without one the card is headed "unnamed dataset".

The body is normally a run of `schema_col` children, but the card only lays
out whatever it is given. Prose between columns still reads correctly, and
a schema with no columns yet renders as an empty card rather than an
error.

## `schema_col`

```markdown
::schema_col{name="user_id" type=bigint pk note="joins to dim_user"}
```

Attributes:

- `name` (string, optional): the column name, shown in monospace. Without
  one the row still renders, as an "unnamed column" placeholder.
- `type` (string, optional): shown as a muted tag. Omitted entirely when
  not written, which is the honest rendering of a type you have not
  looked up yet.
- `pk` (flag, optional): marks the column as a primary key. Write it bare
  (`{pk}`). `pk=true` and `pk=yes` work too; `pk=false`, `pk=no`, `pk=0`
  and `pk=off` turn it back off.
- `note` (string, optional): a short muted note at the end of the row.

## `schema_pipeline`
<img width="975" height="286" alt="image" src="https://github.com/user-attachments/assets/e95a8317-0f38-4a7d-a4e1-0351653f9b7b" />


```markdown
::::schema_pipeline{title="Nightly sessionization"}
::schema_stage[Ingest]{tech="Kafka"}
::schema_stage[Land]{tech="S3, parquet"}
::schema_stage[Model]{tech="Spark SQL"}
::::
```

Attributes:

- `title` (string, optional): a small heading above the flow.
- `min-width` (length, optional): the default width floor for every stage
  in the flow. See the note under `schema_stage` for the accepted lengths.

Recognizes `schema_stage` children by name and draws an arrow between each
pair, wrapping to further rows when the flow is wider than the page. Only
the container knows which stage is first, which is why it rebuilds the
chips rather than laying out its children directly; the chips use the same
markup a stage renders on its own. With no recognized stage children, the
content renders as written, without a flow layout imposed on it.

The flow has no frame, so it sizes to its own chips rather than filling
the column, and `:::center` or `align=right` can place it. A short
pipeline sits where you put it; a long one still fills the column and
wraps. The schema card is the other way round: it has a frame, so it
fills the column like any card.

## `schema_stage`

```markdown
::schema_stage[Ingest]{tech="Kafka"}
```

Attributes:

- `name` (string, optional): the stage label, for when you would rather
  not use bracket content.
- `tech` (string, optional): the technology, in smaller monospace under
  the label.
- `min-width` (length, optional): a floor on the chip's width, so a flow
  of stages with labels of very different lengths reads as an even row.

The label comes from the bracket content when it is written, and from
`name` otherwise. With neither, the chip renders an "unnamed stage"
placeholder.

`min-width` must be a plain CSS length in `px`, `rem`, `em`, or `ch`:
`7rem` and `96px` are accepted, `50%`, `calc(10rem + 2px)` and a bare
number are not. Anything unaccepted is ignored and the chip keeps its
natural width, quietly, since a note is not the place to report a CSS
mistake. Writing it on the flow sets the default for every stage, and a
stage's own value wins over that. It is a minimum only, so a flow that no
longer fits on one line still wraps.

```markdown
::::schema_pipeline{title="Nightly sessionization" min-width="7rem"}
::schema_stage[Ingest]{tech="Kafka"}
::schema_stage[Sessionize]{tech="Spark" min-width="10rem"}
::::
```

## `schema_fact`

<img width="981" height="239" alt="image" src="https://github.com/user-attachments/assets/908e8937-f6c9-4216-8850-011a96861466" />

```markdown
::schema_fact[default shuffle partitions]{value=200}
```

Attributes:

- `value` (string, optional): the figure, shown large in monospace.
- `label` (string, optional): the caption, for when you would rather not
  use bracket content.

This is not the standard `stat` with different colors. `stat` reads a
`data=` binding and shows a live value, so it also carries the states for
a binding that is stale, missing, or produced by a script that failed. A
fact is a constant copied out of a document while reading: no binding, no
failure states, and the same figure on every render.

Value and caption are independent. Either one alone still renders, and
with neither the component shows a quiet "no figure recorded" placeholder.
