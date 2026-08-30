import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pullquote.css';

function str(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * `:::blog_pullquote{cite="..."}` ... `:::` — a large-type excerpt set off
 * from the body, with an oversized quote mark (CSS pseudo-element) and an
 * optional cite line. `children` is the directive's inner markdown,
 * already rendered; a pullquote with no `cite` simply omits that line.
 */
export function BlogPullquote({
  attributes,
  children,
}: MarkComponentProps): ReactElement {
  const cite = str(attributes?.cite);

  return (
    <figure className="mk-blog_pullquote">
      <blockquote className="mk-blog_pullquote__quote">
        {children}
      </blockquote>
      {cite !== '' && (
        <figcaption className="mk-blog_pullquote__cite">{cite}</figcaption>
      )}
    </figure>
  );
}
