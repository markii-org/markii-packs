import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import { StageChip } from './stage-chip';

/**
 * `::data_stage[Ingest]{tech="Kafka"}`, one stage of a data pipeline: a
 * chip carrying the stage name, with an optional smaller technology line
 * under it.
 *
 * A stage is normally written inside a `:::data_pipeline`, which lays a
 * run of them out with arrows between. It renders the same way standing
 * alone, because both use the same `StageChip` markup: a stage lifted out
 * of a flow into a paragraph does not change appearance.
 */
export function DataStage({ attributes, children }: MarkComponentProps): ReactElement {
  return (
    <StageChip name={str(attributes?.name)} tech={str(attributes?.tech)}>
      {children}
    </StageChip>
  );
}
