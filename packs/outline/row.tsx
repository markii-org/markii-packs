import type { ReactElement, ReactNode } from 'react';
import { RowIcon, type IconName } from './icon';
import './row.css';

export interface RowContentProps {
  /** The closed-set glyph to draw at the start of the row, or `"none"` for no icon. */
  icon: IconName;
  /** A leading marker rendered verbatim before the label (for example `"2."`), or `""` for none. */
  num: string;
  /** The row's label: either the bracket content or the `label=` attribute, already resolved by the caller. */
  label: ReactNode;
  /** Whether a label was actually written. When `false`, `placeholder` is shown instead of `label`. */
  hasLabel: boolean;
  /** The quiet placeholder text shown when nothing was written for the label. */
  placeholder: string;
  /** A muted note at the end of the row, or `""` for none. */
  meta: string;
  /** Whether to draw the expand/collapse chevron. Only `outline_branch` sets this. */
  chevron?: boolean;
}

/**
 * The shared inner content of one outline row: an optional icon, an
 * optional leading marker, the label (or a quiet placeholder when none was
 * written), an optional trailing meta note, and an optional chevron.
 *
 * `outline_branch` renders this inside a native `<summary>` so expand and
 * collapse work with no script at all; `outline_item` renders it inside a
 * plain `<div>` with `chevron` left off. Each caller supplies its own
 * outer element and its own root class (`.mk-outline_branch__summary` or
 * `.mk-outline_item`); this module only owns the row's contents, under
 * `.mk-outline_row__contents`. Keeping that one piece of markup in one
 * place is what guarantees a branch's summary row and a standalone item
 * look identical apart from the chevron: two copies would drift the
 * moment one component's row styling changed and the other's did not.
 *
 * Every field here is already a plain string, a `ReactNode`, or a boolean:
 * this component does no attribute reading and no guarding of its own.
 * The caller (`branch.tsx`, `item.tsx`) is responsible for running raw
 * attributes through `guard.ts` first, so this module can never itself put
 * an unvalidated value on the page.
 */
export function RowContent({
  icon,
  num,
  label,
  hasLabel,
  placeholder,
  meta,
  chevron,
}: RowContentProps): ReactElement {
  return (
    <span className="mk-outline_row__contents">
      <RowIcon name={icon} />
      {num !== '' && <span className="mk-outline_row__num">{num}</span>}
      <span
        className={
          hasLabel
            ? 'mk-outline_row__label'
            : 'mk-outline_row__label mk-outline_row__label--placeholder'
        }
      >
        {hasLabel ? label : placeholder}
      </span>
      {meta !== '' && <span className="mk-outline_row__meta">{meta}</span>}
      {chevron === true && (
        <svg
          className="mk-outline_row__chevron"
          viewBox="0 0 16 16"
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 3l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
