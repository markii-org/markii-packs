/**
 * Child-directive walking for `nav`'s container components, adapted from
 * `packs/schema/children.ts`.
 *
 * A container's `children` prop is a tree of already-rendered React
 * elements, not yet-invoked component instances: every directive child
 * (a `nav_group`, say) is the SAME shared element type until React
 * actually renders it, so `child.type === Group` never identifies one.
 * `@markii/react`'s internal `render.js` reads three props off a directive
 * element instead (`data-mk-name`, `data-mk-attrs`, `children`) through
 * its own `readDirectiveChild` helper, which is not exported through the
 * package. This module reimplements the same pattern for `nav`'s own use,
 * plus a depth-capped walk so a directive nested inside a wrapping element
 * is still found, and a plain-text extractor `nav_index` uses to build the
 * filter's match text.
 */

import { Children, isValidElement, type ReactNode } from 'react';

/** One recognized directive child: its full written name, its attributes (string or null only), and its own pre-rendered inner content. */
export interface DirectiveChild {
  name: string;
  attributes: Record<string, string | null>;
  children: ReactNode;
}

/** How deep `findDirectiveChildren` descends into wrapping elements looking for directive markers. Deep enough for any realistic nesting, shallow enough that a hostile or deeply nested tree cannot make the walk expensive. */
const MAX_WALK_DEPTH = 6;

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
 * Reads a directive name, attributes, and children back off `node`,
 * following the same wire encoding `@markii/react`'s internal
 * `readDirectiveChild` reads. Returns `undefined` for anything that is
 * not one of the renderer's own directive elements: plain text, a
 * fragment, some other component. Never throws.
 */
export function readDirectiveChild(node: unknown): DirectiveChild | undefined {
  if (
    !isValidElement<{ 'data-mk-name'?: unknown; 'data-mk-attrs'?: unknown; children?: ReactNode }>(
      node,
    )
  ) {
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
 * into non-directive wrapping elements. A node that itself matches is not
 * descended into further: its own children belong to it, not to the
 * search. This is what lets `nav_index` collect its `nav_group` children
 * and its LOOSE `nav_link` children in one pass without also pulling in a
 * `nav_link` that lives inside one of those groups: once a `nav_group`
 * matches, the walk stops there and leaves that group's own links for a
 * second, separate call scoped to `group.children`. Never throws: any
 * failure reading a node's props is treated as "not a match, no children
 * to descend into".
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
 * Whether `node` carries anything worth showing: a non-blank string, or
 * any element at all. Used by the leaf component to decide whether the
 * directive was written with bracket content (`::nav_link[Docs]`) or not
 * (`::nav_link{label="Docs"}`), since a leaf directive with no brackets
 * arrives with an empty child list rather than with `undefined`. Never
 * throws: a hostile child list reads as "no content", which falls back to
 * the component's own attribute.
 */
export function hasContent(node: ReactNode): boolean {
  try {
    let found = false;
    Children.forEach(node, (child) => {
      if (found) return;
      if (child === null || child === undefined || typeof child === 'boolean') return;
      if (typeof child === 'string') {
        if (child.trim() !== '') found = true;
        return;
      }
      found = true;
    });
    return found;
  } catch {
    return false;
  }
}

/** How deep `plainText` descends into an already-rendered tree collecting strings. Kept small: a link's label is a short phrase, not a document. */
const MAX_TEXT_WALK_DEPTH = 6;

/** The most `plainText` will collect before giving up and truncating, so a pathological or enormous bracket body cannot make the filter's match text unbounded. */
const MAX_PLAIN_TEXT_LENGTH = 300;

interface TextCollectState {
  parts: string[];
  length: number;
  truncated: boolean;
}

/**
 * Walks a pre-rendered node collecting only its string content, joined
 * back together and trimmed. Used by `nav_index` to build the text a
 * search query is matched against, when a link's label was written as
 * bracket content (which can carry inline markdown, an image, or another
 * directive) rather than as a plain `label=` string.
 *
 * Returns `undefined` only when the walk itself throws, for example a
 * hostile child whose `props` getter throws partway through. `nav_index`
 * treats that as "cannot tell whether this row matches" and leaves the row
 * visible under every query, per this pack's "never hide content because a
 * read failed" rule: the alternative, returning `''` on failure, silently
 * hides a row it could not read, which is exactly the mistake to avoid.
 * A bracket body that genuinely has no text (an icon-only image, say)
 * still returns `''` on success, which is the honest, correct read.
 */
export function plainText(node: ReactNode): string | undefined {
  try {
    const state: TextCollectState = { parts: [], length: 0, truncated: false };
    collectText(node, MAX_TEXT_WALK_DEPTH, state);
    return state.parts.join('').trim();
  } catch {
    return undefined;
  }
}

function collectText(node: ReactNode, depth: number, state: TextCollectState): void {
  if (state.truncated) return;
  if (node === null || node === undefined || typeof node === 'boolean') return;

  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node);
    const room = MAX_PLAIN_TEXT_LENGTH - state.length;
    if (room <= 0) {
      state.truncated = true;
      return;
    }
    const piece = text.length > room ? text.slice(0, room) : text;
    state.parts.push(piece);
    state.length += piece.length;
    if (piece.length < text.length) state.truncated = true;
    return;
  }

  Children.forEach(node, (child) => {
    if (state.truncated) return;
    if (isValidElement<{ children?: ReactNode }>(child)) {
      if (depth <= 0) return;
      collectText(child.props.children, depth - 1, state);
    } else {
      collectText(child, depth, state);
    }
  });
}
