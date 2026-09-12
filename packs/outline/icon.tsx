import type { ReactElement } from 'react';

/** The closed set of glyphs `outline_branch` and `outline_item` accept for `icon=`. */
export const ICON_NAMES = ['folder', 'doc', 'dot', 'none'] as const;
export type IconName = (typeof ICON_NAMES)[number];

/**
 * Hand-drawn glyphs for a row's leading icon, shared by `outline_branch`
 * and `outline_item` through `row.tsx`.
 *
 * Every glyph is simple geometry on a `0 0 16 16` viewBox, stroked with
 * `currentColor` so it always matches the row's own text color rather than
 * carrying a fill of its own, and marked `aria-hidden`/`focusable="false"`
 * since it is decoration, not content: the row's text already says what
 * the row is. `icon="none"` (the default) and anything outside the closed
 * set both render nothing, quietly; `oneOf` in `guard.ts` is what maps an
 * unrecognized value to `"none"` before it ever reaches this module, so
 * this component itself never has to guess at an unknown name.
 */
export function RowIcon({ name }: { name: IconName }): ReactElement | null {
  if (name === 'none') return null;
  if (name === 'folder') {
    return (
      <svg
        className="mk-outline_row__icon"
        viewBox="0 0 16 16"
        stroke="currentColor"
        fill="none"
        strokeWidth={1.5}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M1.5 3.5h4l1.2 1.5h7.3v7.5h-12.5z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'doc') {
    return (
      <svg
        className="mk-outline_row__icon"
        viewBox="0 0 16 16"
        stroke="currentColor"
        fill="none"
        strokeWidth={1.5}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3.5 1.5h6l3 3v10h-9z" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M9.5 1.5v3h3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }
  // "dot"
  return (
    <svg
      className="mk-outline_row__icon"
      viewBox="0 0 16 16"
      stroke="currentColor"
      fill="none"
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="2.25" />
    </svg>
  );
}
