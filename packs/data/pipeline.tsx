import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { cssLength, safely, str } from './guard';
import { findDirectiveChildren } from './children';
import { StageChip } from './stage-chip';
import './pipeline.css';

const STAGE_NAME = 'data_stage';

/**
 * `:::data_pipeline{title="..."}` ... `:::`, holding a run of
 * `::data_stage` children: a horizontal flow with an arrow drawn between
 * each pair of stages.
 *
 * The arrows are why this component rebuilds its stages from the child
 * directives it recognizes rather than simply laying out `children`: only
 * the container knows which stage is first, so only the container can say
 * where an arrow does and does not belong. The chips themselves come from
 * the same `StageChip` markup `::data_stage` uses on its own, so nothing
 * about a stage's appearance depends on where it was written.
 *
 * With no recognized stage children, `children` render exactly as
 * written, without a flow layout imposed on content that is not a
 * pipeline. That covers a container holding prose, a container still
 * being drafted, and a typo in a child's directive name.
 *
 * `min-width` written here is the default width floor for every stage the
 * flow lays out, which is the usual way to get evenly sized chips without
 * repeating the same length on each one. A stage that writes its own
 * `min-width` wins over the flow's. Both are validated as plain CSS
 * lengths before they reach a style; an unusable value is ignored, and the
 * chips keep their natural widths. The floor is a minimum only, so a flow
 * that no longer fits on one line still wraps.
 */
export function DataPipeline({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);
  const defaultMinWidth = cssLength(attributes?.['min-width']);
  const stages = safely(
    () => findDirectiveChildren(children, new Set([STAGE_NAME])),
    () => [],
  );

  return (
    <div className="mk-data_pipeline">
      {title !== '' && <div className="mk-data_pipeline__title">{title}</div>}
      {stages.length > 0 ? (
        <div className="mk-data_pipeline__flow">
          {stages.map((stage, index) => (
            <span className="mk-data_pipeline__step" key={index}>
              {index > 0 && (
                <span className="mk-data_pipeline__arrow" aria-hidden="true">
                  &#8594;
                </span>
              )}
              <StageChip
                name={str(stage.attributes.name)}
                tech={str(stage.attributes.tech)}
                minWidth={cssLength(stage.attributes['min-width']) ?? defaultMinWidth}
              >
                {stage.children}
              </StageChip>
            </span>
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
