import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { safely, str } from './guard';
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
 */
export function DataPipeline({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);
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
              <StageChip name={str(stage.attributes.name)} tech={str(stage.attributes.tech)}>
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
