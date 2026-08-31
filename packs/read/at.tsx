import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { safeHttpUrl, strCapped } from './guard';
import './at.css';

const MAX_TEXT_LENGTH = 200;
const MAX_DEPTH = 6;
const HREF_CAP = 2000;

/**
 * Walks `node` collecting plain text (strings and numbers), recursing into
 * arrays and into an element's own `children` prop, up to `MAX_DEPTH`
 * levels and `budget.remaining` characters. `children` here is rendered
 * React content, not raw markdown, so it can be an arbitrary element tree;
 * this only ever reads `props.children` and `props['data-mk-name']`, never
 * touches an unknown prop, and every branch is a plain type check, so
 * nothing here can throw on its own, but the caller still wraps the whole
 * walk in a try/catch as defense against a future change to this function.
 *
 * One quirk of the format matters here. A colon inside a text directive's
 * bracket text starts ANOTHER text directive, so `:read_at[12:34]` does
 * not parse as the text "12:34": it parses as the text "12" followed by a
 * nested directive named "34". Reading only the strings would silently
 * show "12" and drop half the timestamp, which is exactly the mute
 * failure this project forbids. A directive element carries its written
 * name on `data-mk-name` (the same prop `@markii/react`'s own
 * `readDirectiveChild` reads), so a nested directive is put back as
 * `:<name>` and the timestamp survives. An author can also write
 * `12\:34`, which the parser keeps as literal text; both spellings reach
 * this function as the same string.
 */
function collectText(
  node: ReactNode,
  depth: number,
  budget: { remaining: number },
  out: string[],
): void {
  if (budget.remaining <= 0 || depth > MAX_DEPTH) return;
  if (node === null || node === undefined || typeof node === 'boolean') return;

  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node);
    const take = text.slice(0, budget.remaining);
    out.push(take);
    budget.remaining -= take.length;
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      if (budget.remaining <= 0) return;
      collectText(child as ReactNode, depth + 1, budget, out);
    }
    return;
  }

  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    const directiveName = props['data-mk-name'];
    if (typeof directiveName === 'string' && directiveName !== '') {
      const piece = `:${directiveName}`.slice(0, budget.remaining);
      out.push(piece);
      budget.remaining -= piece.length;
    }
    if ('children' in props) {
      collectText(props.children as ReactNode, depth + 1, budget, out);
    }
  }
}

/** Best-effort plain text of `node`, capped in length and depth, never throwing. */
function extractPlainText(node: ReactNode): string {
  try {
    const budget = { remaining: MAX_TEXT_LENGTH };
    const out: string[] = [];
    collectText(node, 0, budget, out);
    return out.join('');
  } catch {
    return '';
  }
}

/**
 * Parses `mm:ss`, `m:ss`, or `hh:mm:ss` into total seconds. Every part
 * must be plain digits (no sign, no decimal); seconds and minutes (when a
 * further unit follows) are range-checked to 0..59. Anything else,
 * including an out-of-range part or a huge digit string that overflows to
 * a non-integer `Number`, yields `undefined`.
 */
function parseTimestamp(text: string): number | undefined {
  if (!/^\d+(:\d+){1,2}$/.test(text)) return undefined;
  const parts = text.split(':').map(Number);
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return undefined;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return undefined;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  if (minutes > 59 || seconds > 59) return undefined;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * `:read_at[12:34]{href="https://..."}`, a monospace timestamp chip. The
 * bracket text is read back with `extractPlainText`, which rejoins the
 * nested directive the parser makes of a colon (see that function), so a
 * timestamp written the natural way survives. The text is parsed as
 * `mm:ss` or `hh:mm:ss`; an unparseable
 * timestamp still renders (as the literal text, falling back to `--:--`
 * when there is no text at all) since the displayed text is never
 * withheld. `href` becomes a link only when it parses as a safe `http:`/
 * `https:` URL; when the timestamp also parsed, its seconds are appended
 * as `t=<seconds>` in the URL's query string (replacing any existing `t`,
 * preserving the rest). An unsafe or unparseable `href` renders a plain
 * unlinked chip; a safe `href` with an unparseable timestamp still links,
 * just without `t`.
 */
export function At({ attributes, children }: MarkComponentProps): ReactElement {
  const text = extractPlainText(children).trim();
  const display = text !== '' ? text : '--:--';
  const seconds = parseTimestamp(text);

  const hrefRaw = strCapped(attributes.href, '', HREF_CAP);
  const safeUrl = hrefRaw !== '' ? safeHttpUrl(hrefRaw) : undefined;

  if (safeUrl !== undefined) {
    if (seconds !== undefined) {
      safeUrl.searchParams.set('t', String(seconds));
    }
    return (
      <a className="mk-read_at" href={safeUrl.toString()}>
        {display}
      </a>
    );
  }

  return <span className="mk-read_at">{display}</span>;
}
