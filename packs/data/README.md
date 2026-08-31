# data

Components for data engineering reading notes: the shape of a table, the
stages of a pipeline, and the constants worth remembering from a Spark or
warehousing document. Nothing here is data-bound; every value is typed in
the note.

| Directive | Form | Description |
| --- | --- | --- |
| `:::data_schema{}` | container | A schema card for a table or dataset, holding `data_col` children. |
| `::data_col{}` | leaf | One column row: name, type, optional key marker and note. |
| `:::data_pipeline{}` | container | A horizontal flow of `data_stage` children with arrows between. |
| `::data_stage[]{}` | leaf | One pipeline stage chip, with an optional technology line. |
| `::data_fact[]{}` | leaf | A static figure worth remembering, shown above its caption. |

## `data_schema`

```markdown
:::data_schema{name="events_raw"}
::data_col{name="event_id" type=string pk}
::data_col{name="occurred_at" type=timestamp note="event time, not ingest time"}
:::
```

Attributes:

- `name` (string, optional): the table or dataset name, shown in
  monospace. Without one the card is headed "unnamed dataset".

The body is normally a run of `data_col` children, but the card only lays
out whatever it is given. Prose between columns still reads correctly, and
a schema with no columns yet renders as an empty card rather than an
error.

## `data_col`

```markdown
::data_col{name="user_id" type=bigint pk note="joins to dim_user"}
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

## `data_pipeline`

```markdown
::::data_pipeline{title="Nightly sessionization"}
::data_stage[Ingest]{tech="Kafka"}
::data_stage[Land]{tech="S3, parquet"}
::data_stage[Model]{tech="Spark SQL"}
::::
```

Attributes:

- `title` (string, optional): a small heading above the flow.

Recognizes `data_stage` children by name and draws an arrow between each
pair, wrapping to further rows when the flow is wider than the page. Only
the container knows which stage is first, which is why it rebuilds the
chips rather than laying out its children directly; the chips use the same
markup a stage renders on its own. With no recognized stage children, the
content renders as written, without a flow layout imposed on it.

## `data_stage`

```markdown
::data_stage[Ingest]{tech="Kafka"}
```

Attributes:

- `name` (string, optional): the stage label, for when you would rather
  not use bracket content.
- `tech` (string, optional): the technology, in smaller monospace under
  the label.

The label comes from the bracket content when it is written, and from
`name` otherwise. With neither, the chip renders an "unnamed stage"
placeholder.

## `data_fact`

```markdown
::data_fact[default shuffle partitions]{value=200}
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
