---
title: Spark and warehouse notes
uses: [data]
---

# Spark and warehouse notes

Working through the tuning chapter and the warehouse migration doc in
parallel. Numbers and table shapes land here so I stop re-deriving them.

## Numbers to keep

::data_fact[default shuffle partitions]{value=200}

::data_fact[target partition size after a shuffle]{value="128 MB"}

::data_fact{value="10 GB" label="broadcast join threshold we settled on"}

::data_fact[rows before a broadcast stops being cheap]

The fact above has a caption and no figure, which happens while reading:
the claim is noted, the number is still somewhere in the appendix. A fact
with neither renders a quiet placeholder rather than an empty box:

::data_fact{}

## The raw events table

:::data_schema{name="events_raw"}
::data_col{name="event_id" type=string pk note="ULID, sortable by time"}
::data_col{name="user_id" type=bigint note="joins to dim_user"}
::data_col{name="occurred_at" type=timestamp note="event time, not ingest time"}
::data_col{name="ingested_at" type=timestamp}
::data_col{name="payload" type="map<string, string>" note="unvalidated, from the SDK"}
::data_col{name="dt" type=date note="partition column"}
:::

Partitioning is on `dt` rather than on `occurred_at` so a late arriving
event does not rewrite an old partition.

## The modeled session table

:::data_schema{name="fct_session"}
::data_col{name="session_id" type=string pk=yes}
::data_col{name="user_id" type=bigint}
::data_col{name="started_at" type=timestamp}
::data_col{name="events" type=int note="count, not an array"}
::data_col{type=boolean note="a column I have not named yet"}
:::

## How a session gets built

::::data_pipeline{title="Nightly sessionization" min-width="7rem"}
::data_stage[Ingest]{tech="Kafka"}
::data_stage[Land]{tech="S3, parquet"}
::data_stage[Clean]{tech="Spark SQL"}
::data_stage[Sessionize]{tech="Spark, window functions" min-width="11rem"}
::data_stage{name="Publish" tech="Iceberg"}
::::

The `min-width` on the flow gives every chip the same 7rem floor, so the
row reads evenly instead of tracking the length of each label. The
sessionize stage overrides it: that one carries the longest technology
line, and a wider chip keeps it on one line.

The sessionize step is the expensive one: it is the only stage that
shuffles on `user_id`, and it is where the 200 partition default stops
being a sensible number.

## Where the metadata lives

::::data_pipeline{title="Lineage capture"}
::data_stage[Job run]{tech="OpenLineage"}
::data_stage[Catalog]
::data_stage[Search]{tech="Amundsen"}
::::

A stage reads fine on its own too, outside a flow:
::data_stage[Backfill]{tech="Airflow"}

## Still sketching

:::data_pipeline{title="Streaming variant"}
Not written as stages yet, just a note: the same three steps, but the
sessionize window becomes a watermark and the publish step writes to the
same Iceberg table the batch job owns.
:::
