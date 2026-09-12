/**
 * Child-content checking for `outline`'s components, adapted from
 * `packs/schema/children.ts`.
 *
 * `outline_tree` and `outline_branch` do not need to recognize their
 * children by name: unlike `schema_pipeline`, which has to find its own
 * `schema_stage` children to draw arrows between them, a tree or a branch
 * just lays out whatever markdown or nested directives it was given, in
 * the order written. The one thing every component here needs to know is
 * whether a leaf directive (`outline_item`) was written with bracket
 * content, so it can prefer that over its `label=` attribute. This module
 * only carries that one check; it does not carry the fuller
 * `readDirectiveChild` / `findDirectiveChildren` walk `schema` needs,
 * because nothing in this pack ever searches for a child by name.
 */

import { Children, type ReactNode } from 'react';

/**
 * Whether `node` carries anything worth showing: a non-blank string, or
 * any element at all. Used by `outline_item` to decide whether the
 * directive was written with bracket content (`::outline_item[Deploy]`) or
 * not (`::outline_item{label="Deploy"}`), since a leaf directive with no
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
