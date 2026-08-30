import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './byline.css';

function str(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * `::blog_byline{author="..." role="..." date="..."}` — a compact one-line
 * author strip for an article's end or a multi-author piece. The monogram
 * circle is generated from the author's first letter, plain CSS, no
 * images. With no `author`, the monogram falls back to a generic mark and
 * the strip still renders (role/date alone can be meaningful, e.g. an
 * "Edited" line).
 */
export function BlogByline({ attributes }: MarkComponentProps): ReactElement | null {
  const author = str(attributes?.author);
  const role = str(attributes?.role);
  const date = str(attributes?.date);

  if (author === '' && role === '' && date === '') {
    return null;
  }

  // `Array.from` rather than `author[0]`: indexing a string yields one UTF-16
  // code unit, which for a name starting outside the BMP is half a surrogate
  // pair and renders as a replacement character.
  const initial = (Array.from(author)[0] ?? '?').toUpperCase();

  return (
    <p className="mk-blog_byline">
      <span className="mk-blog_byline__monogram" aria-hidden="true">
        {initial}
      </span>
      <span className="mk-blog_byline__text">
        {author !== '' && (
          <span className="mk-blog_byline__author">{author}</span>
        )}
        {role !== '' && (
          <span className="mk-blog_byline__role">{role}</span>
        )}
        {date !== '' && (
          <span className="mk-blog_byline__date">{date}</span>
        )}
      </span>
    </p>
  );
}
