import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str, oneOf } from './guard';
import { hasContent } from './children';
import { ICON_NAMES } from './icon';
import { RowContent } from './row';
import './item.css';

/**
 * `::outline_item[Deploy runbook]{icon=doc meta="last checked Tue"}`, a
 * terminal row inside an `outline_tree` or an `outline_branch`: content
 * that has nothing further to expand.
 *
 * An item renders the same row chrome a branch's summary does (icon,
 * leading marker, label, meta note), through the shared `RowContent`
 * module, but without a chevron and without wrapping anything in
 * `<details>`: there is nothing to reveal. Because a leaf directive's
 * attributes do not survive a static HTML export (only its bracket content
 * does, as plain markdown), the label should normally be written as
 * bracket content rather than as `label=`; `label=` exists for the rare
 * case where the label needs characters that are awkward inside brackets.
 * Bracket content always wins when both are written, since it is the
 * closer of the two to "the text the author actually typed".
 *
 * With neither bracket content nor `label`, the row still renders, headed
 * by a quiet "untitled item" placeholder, so a half-written outline keeps
 * its shape instead of leaving a blank row.
 */
export function OutlineItem({ attributes, children }: MarkComponentProps): ReactElement {
  const label = str(attributes?.label);
  const num = str(attributes?.num);
  const meta = str(attributes?.meta);
  const icon = oneOf(attributes?.icon, ICON_NAMES, 'none');

  const written = hasContent(children);
  const hasLabel = written || label !== '';

  return (
    <div className="mk-outline_item">
      <RowContent
        icon={icon}
        num={num}
        label={written ? children : label}
        hasLabel={hasLabel}
        placeholder="untitled item"
        meta={meta}
      />
    </div>
  );
}
