import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './header.css';

function str(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * `::blog_header{title="..." subtitle="..." date="..." author="..."}` — a
 * post masthead. Each attribute is independent: a missing one simply
 * leaves out its element, and a header with no attributes at all renders
 * nothing (returns `null`), so an empty directive never leaves a stray
 * empty box in the note.
 */
export function BlogHeader({ attributes }: MarkComponentProps): ReactElement | null {
  const title = str(attributes?.title);
  const subtitle = str(attributes?.subtitle);
  const date = str(attributes?.date);
  const author = str(attributes?.author);

  const hasMeta = date !== '' || author !== '';
  if (title === '' && subtitle === '' && !hasMeta) {
    return null;
  }

  return (
    <header className="mk-blog_header">
      {title !== '' && <h1 className="mk-blog_header__title">{title}</h1>}
      {subtitle !== '' && (
        <p className="mk-blog_header__subtitle">{subtitle}</p>
      )}
      {hasMeta && (
        <p className="mk-blog_header__meta">
          {author !== '' && (
            <span className="mk-blog_header__author">{author}</span>
          )}
          {author !== '' && date !== '' && (
            <span className="mk-blog_header__sep" aria-hidden="true">
              {' '}
              &middot;{' '}
            </span>
          )}
          {date !== '' && (
            <span className="mk-blog_header__date">{date}</span>
          )}
        </p>
      )}
    </header>
  );
}
