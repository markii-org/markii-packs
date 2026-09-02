import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { cssLength, str } from './guard';
import { StageChip } from './stage-chip';

/**
 * `::schema_stage[Ingest]{tech="Kafka"}`, one stage of a data pipeline: a
 * chip carrying the stage name, with an optional smaller technology line
 * under it.
 *
 * A stage is normally written inside a `:::schema_pipeline`, which lays a
 * run of them out with arrows between. It renders the same way standing
 * alone, because both use the same `StageChip` markup: a stage lifted out
 * of a flow into a paragraph does not change appearance.
 *
 * `min-width` sets a floor on the chip's width, so a flow of stages with
 * labels of very different lengths reads as a row of even chips rather
 * than a ragged one. It must be a plain CSS length in `px`, `rem`, `em`,
 * or `ch`; anything else is ignored and the chip keeps its natural width.
 */
export function DataStage({ attributes, children }: MarkComponentProps): ReactElement {
  return (
    <StageChip
      name={str(attributes?.name)}
      tech={str(attributes?.tech)}
      minWidth={cssLength(attributes?.['min-width'])}
    >
      {children}
    </StageChip>
  );
}
