import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './aside.css';

function str(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * `:::blog_aside{label="Note"}` ... `:::` — a footnote-style side note:
 * smaller type, a subtle left rule, and an optional small-caps label. No
 * icon and no background fill, unlike the stdlib callout, so it reads as
 * marginal commentary rather than an alert.
 */
export function BlogAside({
  attributes,
  children,
}: MarkComponentProps): ReactElement {
  const label = str(attributes?.label);

  return (
    <aside className="mk-blog_aside">
      {label !== '' && (
        <span className="mk-blog_aside__label">{label}</span>
      )}
      <div className="mk-blog_aside__body">{children}</div>
    </aside>
  );
}
