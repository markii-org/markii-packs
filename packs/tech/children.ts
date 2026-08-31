/**
 * Child-directive and pre-rendered-text walkers shared by `tech`'s
 * container components (`compare`, `diff`, `tradeoff`).
 *
 * A container's `children` prop is a tree of already-rendered React
 * elements, not yet-invoked component instances: every directive child
 * (a `tech_pane`, a `tech_pros`) is the SAME shared element type until
 * React actually renders it, so `child.type === Pane` never identifies
 * one. `@markii/react`'s internal `render.js` reads three props off a
 * directive element instead (`data-mk-name`, `data-mk-attrs`,
 * `children`) through its own `readDirectiveChild` helper, which is not
 * exported through the package. This module reimplements the same
 * pattern for `tech`'s own use, plus a depth-capped recursive walk (a
 * pane may be nested inside a wrapping element rather than a direct
 * child) and a walker that pulls code text out of a pane's rendered
 * body.
 */

import { Children, isValidElement, type ReactNode } from 'react';

/** One recognized directive child: its full written name, its attributes (string/null only), and its own pre-rendered inner content. */
export interface DirectiveChild {
  name: string;
  attributes: Record<string, string | null>;
  children: ReactNode;
}

/** How deep `findDirectiveChildren` descends into wrapping elements looking for directive markers. Deep enough for any realistic nesting, shallow enough that a hostile or cyclic-looking tree cannot make the walk expensive. */
const MAX_WALK_DEPTH = 6;

/** Total DOM text length any code-extraction walk will read before giving up, so an adversarial tree cannot make `extractCodeText` slow. */
const MAX_CODE_TEXT_LENGTH = 200_000;

/** Parses a `data-mk-attrs` JSON string into `string | null` attributes only. Never throws: invalid JSON, a non-object, or an array all yield `{}`; a value that is neither a string nor `null` is dropped rather than coerced. */
function parseAttrs(raw: unknown): Record<string, string | null> {
  if (typeof raw !== 'string' || raw === '') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' || value === null) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Reads a directive name/attributes/children back off `node`, following
 * the same wire encoding `@markii/react`'s internal `readDirectiveChild`
 * reads (`data-mk-name` the full written name, `data-mk-attrs` a JSON
 * string of attributes, `children` the pre-rendered body). Returns
 * `undefined` for anything that is not one of the renderer's own
 * directive elements: plain text, a fragment, some other component.
 * Never throws.
 */
export function readDirectiveChild(node: unknown): DirectiveChild | undefined {
  if (!isValidElement<{ 'data-mk-name'?: unknown; 'data-mk-attrs'?: unknown; children?: ReactNode }>(node)) {
    return undefined;
  }
  const name = node.props['data-mk-name'];
  if (typeof name !== 'string' || name === '') return undefined;
  return {
    name,
    attributes: parseAttrs(node.props['data-mk-attrs']),
    children: node.props.children,
  };
}

/**
 * Recursively collects every directive child whose written name is in
 * `names`, in document order, descending up to `MAX_WALK_DEPTH` levels
 * into non-directive wrapping elements (so a pane wrapped in a stray
 * `<div>` is still found). A node that itself matches is not descended
 * into further: its own children belong to it, not to the search.
 * Never throws: any failure reading a node's props is treated as "not
 * a match, no children to descend into".
 */
export function findDirectiveChildren(
  node: ReactNode,
  names: ReadonlySet<string>,
  depth = MAX_WALK_DEPTH,
): DirectiveChild[] {
  const found: DirectiveChild[] = [];
  collect(node, names, depth, found);
  return found;
}

function collect(
  node: ReactNode,
  names: ReadonlySet<string>,
  depth: number,
  found: DirectiveChild[],
): void {
  if (node === null || node === undefined || typeof node === 'boolean') return;

  Children.forEach(node, (child) => {
    const directive = safeReadDirectiveChild(child);
    if (directive !== undefined && names.has(directive.name)) {
      found.push(directive);
      return;
    }
    if (depth <= 0) return;
    if (isValidElement<{ children?: ReactNode }>(child)) {
      collect(child.props.children, names, depth - 1, found);
    }
  });
}

function safeReadDirectiveChild(node: unknown): DirectiveChild | undefined {
  try {
    return readDirectiveChild(node);
  } catch {
    return undefined;
  }
}

/**
 * Finds the first fenced code block inside `node` and joins its string
 * descendants into one code text, or `undefined` if there is none.
 * Depth- and length-capped so a hostile or enormous rendered tree cannot
 * hang the walk; a total that would exceed `MAX_CODE_TEXT_LENGTH` stops
 * early rather than throwing.
 *
 * A fenced block's text always ends with a newline. That one trailing
 * newline is dropped, so a diff does not show a phantom empty last line
 * on both sides.
 */
export function extractCodeText(node: ReactNode): string | undefined {
  const codeElement = findCodeBlock(node, MAX_WALK_DEPTH, false);
  if (codeElement === undefined) return undefined;
  const chunks: string[] = [];
  const total = { length: 0 };
  collectText(codeElement, MAX_WALK_DEPTH, chunks, total);
  const text = chunks.join('');
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

/**
 * Whether an element of this type can wrap a fenced code block.
 *
 * Testing for the literal `'pre'` tag alone is not enough, and getting
 * this wrong fails silently. `@markii/react` does not render a code fence
 * as a plain `<pre>`: it swaps every `pre` for its own `PreElement`
 * component (the one that folds a `{name=...}` script fence into a
 * collapsed marker), so the rendered tree a pane hands over is
 * `PreElement > code`, and a check for `child.type === 'pre'` finds
 * nothing at all. Matching a component type as well as the `'pre'` tag
 * covers both that renderer and a plainer one, while still excluding
 * inline code, whose parent is a text tag such as `p` or `li`.
 */
function isPreLike(type: unknown): boolean {
  if (type === 'pre') return true;
  return typeof type === 'function' || (typeof type === 'object' && type !== null);
}

/**
 * Finds the first `code` element whose parent can wrap a code block (see
 * `isPreLike`), descending up to `depth` levels. `parentPreLike` says
 * whether the node being scanned sits inside such a wrapper, so inline
 * code in a paragraph is skipped rather than mistaken for a code block.
 */
function findCodeBlock(
  node: ReactNode,
  depth: number,
  parentPreLike: boolean,
): ReactNode | undefined {
  if (depth < 0) return undefined;
  let result: ReactNode | undefined;
  Children.forEach(node, (child) => {
    if (result !== undefined) return;
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    if (child.type === 'code' && parentPreLike) {
      result = child;
      return;
    }
    result = findCodeBlock(child.props.children, depth - 1, isPreLike(child.type));
  });
  return result;
}

function collectText(
  node: ReactNode,
  depth: number,
  chunks: string[],
  total: { length: number },
): void {
  if (total.length >= MAX_CODE_TEXT_LENGTH) return;
  if (typeof node === 'string') {
    const remaining = MAX_CODE_TEXT_LENGTH - total.length;
    const piece = node.length > remaining ? node.slice(0, remaining) : node;
    chunks.push(piece);
    total.length += piece.length;
    return;
  }
  if (typeof node === 'number') {
    const piece = String(node);
    chunks.push(piece);
    total.length += piece.length;
    return;
  }
  if (depth < 0) return;
  if (isValidElement<{ children?: ReactNode }>(node)) {
    collectText(node.props.children, depth - 1, chunks, total);
    return;
  }
  Children.forEach(node, (child) => {
    if (total.length >= MAX_CODE_TEXT_LENGTH) return;
    collectText(child, depth - 1, chunks, total);
  });
}
