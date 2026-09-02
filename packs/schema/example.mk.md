---
title: Spark and warehouse notes
uses: [schema]
---

# Spark and warehouse notes

Working through the tuning chapter and the warehouse migration doc in
parallel. Numbers and table shapes land here so I stop re-deriving them.

## Numbers to keep

::schema_fact[default shuffle partitions]{value=200}

::schema_fact[target partition size after a shuffle]{value="128 MB"}

::schema_fact{value="10 GB" label="broadcast join threshold we settled on"}

::schema_fact[rows before a broadcast stops being cheap]

The fact above has a caption and no figure, which happens while reading:
the claim is noted, the number is still somewhere in the appendix. A fact
with neither renders a quiet placeholder rather than an empty box:

::schema_fact{}

## The raw events table

:::schema_schema{name="events_raw"}
::schema_col{name="event_id" type=string pk note="ULID, sortable by time"}
::schema_col{name="user_id" type=bigint note="joins to dim_user"}
::schema_col{name="occurred_at" type=timestamp note="event time, not ingest time"}
::schema_col{name="ingested_at" type=timestamp}
::schema_col{name="payload" type="map<string, string>" note="unvalidated, from the SDK"}
::schema_col{name="dt" type=date note="partition column"}
:::

Partitioning is on `dt` rather than on `occurred_at` so a late arriving
event does not rewrite an old partition.

## The modeled session table

:::schema_schema{name="fct_session"}
::schema_col{name="session_id" type=string pk=yes}
::schema_col{name="user_id" type=bigint}
::schema_col{name="started_at" type=timestamp}
::schema_col{name="events" type=int note="count, not an array"}
::schema_col{type=boolean note="a column I have not named yet"}
:::

## How a session gets built

::::schema_pipeline{title="Nightly sessionization" min-width="7rem"}
::schema_stage[Ingest]{tech="Kafka"}
::schema_stage[Land]{tech="S3, parquet"}
::schema_stage[Clean]{tech="Spark SQL"}
::schema_stage[Sessionize]{tech="Spark, window functions" min-width="11rem"}
::schema_stage{name="Publish" tech="Iceberg"}
::::

The `min-width` on the flow gives every chip the same 7rem floor, so the
row reads evenly instead of tracking the length of each label. The
sessionize stage overrides it: that one carries the longest technology
line, and a wider chip keeps it on one line.

The sessionize step is the expensive one: it is the only stage that
shuffles on `user_id`, and it is where the 200 partition default stops
being a sensible number.

## Where the metadata lives

::::schema_pipeline{title="Lineage capture"}
::schema_stage[Job run]{tech="OpenLineage"}
::schema_stage[Catalog]
::schema_stage[Search]{tech="Amundsen"}
::::

A stage reads fine on its own too, outside a flow:
::schema_stage[Backfill]{tech="Airflow"}

## Still sketching

:::schema_pipeline{title="Streaming variant"}
Not written as stages yet, just a note: the same three steps, but the
sessionize window becomes a watermark and the publish step writes to the
same Iceberg table the batch job owns.
:::
