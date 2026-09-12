import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { LinkRow, resolveLink } from './link-row';

/**
 * `::nav_link[Docs]{href="https://example.com" desc="..." key="G D" icon="doc"}`,
 * one link row. See `link-row.tsx` for the row's own doc comment: this
 * file only wires the raw directive props (`attributes`, `children`) into
 * `resolveLink` and `LinkRow`, the same two functions `nav_index` calls
 * when it rebuilds a link inline, so a row looks identical whether it is
 * written on its own, inside a `nav_group`, or loose inside a `nav_index`.
 */
export function NavLink({ attributes, children }: MarkComponentProps): ReactElement {
  const resolved = resolveLink(attributes, children);
  return <LinkRow {...resolved} />;
}
