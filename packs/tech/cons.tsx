import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pros-cons.css';

/**
 * `:::tech_cons{}` ... `:::`, a labeled Cons block. Registered as a
 * component in its own right (like the reference `tabs`/`tab` pair): it
 * renders fine standing alone, with its own "Cons" header and body.
 * Inside a `:::tech_tradeoff`, the tradeoff recognizes a `tech_cons` child
 * by directive name and builds its own two-column layout from the
 * child's pre-rendered content directly, so this component's own
 * rendering is only ever seen when `tech_cons` is used on its own.
 */
export function TechCons({ children }: MarkComponentProps): ReactElement {
  return (
    <div className="mk-tech_cons">
      <div className="mk-tech_cons__label">Cons</div>
      <div className="mk-tech_cons__body">{children}</div>
    </div>
  );
}
