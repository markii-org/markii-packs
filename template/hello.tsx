import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './hello.css';

/**
 * `::template_hello{name="..."}` — a minimal leaf component. Renders a
 * styled box greeting the given name, or a generic greeting when no name
 * is given. Copy this file as the starting point for a new pack's own
 * components: no outer margin (the document owns vertical rhythm), and
 * every color comes from a `--mk-*` token.
 */
export function Hello({ attributes }: MarkComponentProps): ReactElement {
  const name =
    typeof attributes?.name === 'string' && attributes.name.length > 0
      ? attributes.name
      : 'there';

  return (
    <span className="mk-template_hello">
      Hello, <span className="mk-template_hello__name">{name}</span>!
    </span>
  );
}
