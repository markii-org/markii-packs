import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pros-cons.css';

/**
 * `:::tech_pros{}` ... `:::`, a labeled Pros block. Registered as a
 * component in its own right (like the reference `tabs`/`tab` pair): it
 * renders fine standing alone, with its own "Pros" header and body. Inside
 * a `:::tech_tradeoff`, the tradeoff recognizes a `tech_pros` child by
 * directive name and builds its own two-column layout from the child's
 * pre-rendered content directly, so this component's own rendering is
 * only ever seen when `tech_pros` is used on its own.
 */
export function TechPros({ children }: MarkComponentProps): ReactElement {
  return (
    <div className="mk-tech_pros">
      <div className="mk-tech_pros__label">Pros</div>
      <div className="mk-tech_pros__body">{children}</div>
    </div>
  );
}
