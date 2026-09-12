import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { GroupCard, resolveGroupHeader } from './group-card';

/**
 * `:::nav_group{title="Guides" desc="..." icon="book" tone="info"} ... :::`,
 * a group of `nav_link` rows under a heading. See `group-card.tsx` for the
 * card's own doc comment: this file only wires the raw directive props
 * (`attributes`, `children`) into `resolveGroupHeader` and `GroupCard`, the
 * same two functions `nav_index` calls when it rebuilds a group inline, so
 * a group looks identical whether it is written on its own or found inside
 * an index.
 */
export function NavGroup({ attributes, children }: MarkComponentProps): ReactElement {
  const header = resolveGroupHeader(attributes);
  return <GroupCard {...header}>{children}</GroupCard>;
}
