import type { ReactElement } from 'react';

/**
 * The closed set of glyphs `nav_group` and `nav_link` can show. Shared by
 * both so the same word means the same picture everywhere in the pack.
 * `'none'` is a real, valid choice (the default for both components), not
 * an error state: most rows in a plain link list carry no icon at all.
 */
export const ICON_NAMES = [
  'home',
  'doc',
  'book',
  'folder',
  'grid',
  'chart',
  'check',
  'star',
  'arrow',
  'none',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

interface IconSpec {
  d: string;
  strokeLinecap?: 'round';
  strokeLinejoin?: 'round';
}

/**
 * Hand-drawn glyphs on a 16x16 grid, stroke-only (`fill="none"`), so every
 * one of them inherits its color from `currentColor` and needs no
 * `--mk-*` token of its own: the caller (`GroupCard`'s icon tile,
 * `LinkRow`'s leading icon) sets the color, this module only draws the
 * shape. This is deliberately not an icon library: ten simple glyphs, kept
 * simple on purpose, is the entire footprint this pack needs.
 *
 * Kept as plain path DATA rather than pre-built `<path>` elements: a
 * prebuilt webview.js may only read React (and therefore only call
 * `React.createElement`, which JSX compiles to) from inside a function
 * that runs at render time, never while the script itself is loading
 * (docs/packs.md, "What a prebuilt webview.js must do"). A module-level
 * `Record<IconName, ReactElement>` would build every glyph the moment this
 * module loads, before a host has necessarily set `window.__markiiReact`,
 * and would throw. Building the `<path>` inside `Icon()` instead means
 * nothing here runs until a component actually renders.
 */
const ICON_PATHS: Record<Exclude<IconName, 'none'>, IconSpec> = {
  home: { d: 'M2 8 L8 2.5 L14 8 M4 6.8 V14 H12 V6.8', strokeLinecap: 'round', strokeLinejoin: 'round' },
  doc: { d: 'M4 1.5 H10 L12.5 4 V14.5 H4 Z M10 1.5 V4 H12.5', strokeLinecap: 'round', strokeLinejoin: 'round' },
  book: {
    d: 'M8 3.3 C6 2.2 4 2 2 2.8 V12.8 C4 12 6 12.2 8 13.3 C10 12.2 12 12 14 12.8 V2.8 C12 2 10 2.2 8 3.3 Z M8 3.3 V13.3',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  folder: { d: 'M2 4 H6.5 L8 6 H14 V13 H2 Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
  grid: { d: 'M2 2 H7 V7 H2 Z M9 2 H14 V7 H9 Z M2 9 H7 V14 H2 Z M9 9 H14 V14 H9 Z', strokeLinejoin: 'round' },
  chart: { d: 'M4 14 V8.5 M8 14 V4.5 M12 14 V10.5', strokeLinecap: 'round' },
  check: { d: 'M3 8.5 L6.5 12 L13 4.5', strokeLinecap: 'round', strokeLinejoin: 'round' },
  star: {
    d: 'M8 1.8 L9.7 5.9 L14.2 6.3 L10.8 9.2 L11.8 13.6 L8 11.2 L4.2 13.6 L5.2 9.2 L1.8 6.3 L6.3 5.9 Z',
    strokeLinejoin: 'round',
  },
  arrow: { d: 'M2 8 H13 M8.5 3.5 L13 8 L8.5 12.5', strokeLinecap: 'round', strokeLinejoin: 'round' },
};

/**
 * Renders one glyph from the closed set, or nothing at all for `'none'` or
 * any value this pack does not recognize: a note author can only ever
 * write a value from `ICON_NAMES`, but a hostile or hand-built registry
 * could hand this component any string, and an unrecognized icon should
 * quietly disappear rather than render a broken shape.
 */
export function Icon({ name, className }: { name: IconName; className?: string }): ReactElement | null {
  const spec = ICON_PATHS[name as Exclude<IconName, 'none'>];
  if (spec === undefined) return null;
  return (
    <svg
      viewBox="0 0 16 16"
      stroke="currentColor"
      fill="none"
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={spec.d} strokeLinecap={spec.strokeLinecap} strokeLinejoin={spec.strokeLinejoin} />
    </svg>
  );
}
