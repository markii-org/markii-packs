import type { ReactElement, ReactNode } from 'react';
import { hasContent } from './children';
import './stage.css';

/**
 * The chip markup for one pipeline stage, shared by `::data_stage` (which
 * renders one on its own) and `:::data_pipeline` (which rebuilds the flow
 * from the stage children it recognizes, so it can put arrows between
 * them).
 *
 * Keeping the markup in one place is the point: if a pipeline rendered
 * its stages with markup of its own, a stage would look different inside
 * a flow than it does standing alone, and the pack's stylesheet would
 * need two copies of every rule.
 *
 * The label can be written either way. Bracket content wins when it is
 * there, since it is the closest thing to the text; otherwise the `name`
 * attribute is used. With neither, the chip still renders, as a quiet
 * "unnamed stage" placeholder, so a half-written flow keeps its shape.
 *
 * `minWidth` is an already-validated CSS length (see `guard.ts`'s
 * `cssLength`) or `undefined`. Nothing else is accepted here: the caller
 * validates, so this component never puts a raw attribute string into a
 * `style`.
 */
export function StageChip({
  children,
  name,
  tech,
  minWidth,
}: {
  children?: ReactNode;
  name: string;
  tech: string;
  minWidth?: string;
}): ReactElement {
  const written = hasContent(children);
  const hasLabel = written || name !== '';
  const label: ReactNode = written ? children : name !== '' ? name : 'unnamed stage';

  return (
    <span className="mk-data_stage" style={minWidth !== undefined ? { minWidth } : undefined}>
      <span
        className={
          hasLabel ? 'mk-data_stage__label' : 'mk-data_stage__label mk-data_stage__label--placeholder'
        }
      >
        {label}
      </span>
      {tech !== '' && <span className="mk-data_stage__tech">{tech}</span>}
    </span>
  );
}
