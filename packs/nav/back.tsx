import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { hasAnchor } from './children';
import { safely, str } from './guard';
import { Icon } from './icon';
import './back.css';

/**
 * `::nav_back[[Projects](../projects)]`, one quiet line: a back arrow, a
 * muted label, then the content, which holds the link as ordinary markdown.
 * The pack lays the line out and never builds an `<a>` of its own, so the
 * link keeps the host's own handling. Content with no link still renders,
 * with a `title` saying so. Never throws.
 */
export function NavBack({ attributes, children }: MarkComponentProps): ReactElement {
  const label = safely(
    () => str(attributes?.label, 'Back to'),
    () => 'Back to',
  );
  const linked = hasAnchor(children);
  return (
    <div className="mk-nav_back" title={linked ? undefined : 'This line has no link'}>
      <Icon name="back" className="mk-nav_back__icon" />
      <span className="mk-nav_back__label">{label}</span>
      <span className="mk-nav_back__target">{children}</span>
    </div>
  );
}
