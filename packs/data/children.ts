/**
 * Child-directive walking for `data`'s container components, adapted from
 * `packs/tech/children.ts`.
 *
 * A container's `children` prop is a tree of already-rendered React
 * elements, not yet-invoked component instances: every directive child
 * (a `data_stage`, say) is the SAME shared element type until React
 * actually renders it, so `child.type === Stage` never identifies one.
 * `@markii/react`'s internal `render.js` reads three props off a directive
 * element instead (`data-mk-name`, `data-mk-attrs`, `children`) through
 * its own `readDirectiveChild` helper, which is not exported through the
 * package. This module reimplements the same pattern for `data`'s own
 * use, plus a depth-capped walk so a stage nested inside a wrapping
 * element is still found.
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
 * search. Never throws: any failure reading a node's props is treated as
 * "not a match, no children to descend into".
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
 * any element at all. Used by the leaf components to decide whether the
 * directive was written with bracket content (`::data_stage[Ingest]`) or
 * not (`::data_stage{name="Ingest"}`), since a leaf directive with no
 * brackets arrives with an empty child list rather than with `undefined`.
 * Never throws: a hostile child list reads as "no content", which falls
 * back to the component's own attribute.
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
