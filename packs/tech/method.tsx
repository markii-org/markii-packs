import type { ReactElement, ReactNode } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import './method.css';

const RECOGNIZED = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type RecognizedMethod = (typeof RECOGNIZED)[number];

/** Uppercases and checks `raw` against the recognized HTTP methods, returning `undefined` for anything else (including empty). */
function recognize(raw: string): RecognizedMethod | undefined {
  const upper = raw.toUpperCase();
  return (RECOGNIZED as readonly string[]).includes(upper) ? (upper as RecognizedMethod) : undefined;
}

/** Text pulled out of `children` (the directive's own bracket text), trimmed and capped, or `''` if `children` isn't plain text. */
function childText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  return '';
}

/**
 * `:tech_method[GET]{path="/users/{id}"}`, an HTTP method chip colored
 * by a token-derived tint per method, followed by an optional monospace
 * path. The five common methods (GET, POST, PUT, PATCH, DELETE) get their
 * own tint and are shown uppercased; anything else, including an empty or
 * missing method, renders as neutral text exactly as written (trimmed and
 * length-capped by `guard.ts`'s `str`), never guessed at. `path` is plain
 * text: a path containing `{`/`}` (a route template) renders as literal
 * characters, never interpreted.
 */
export function TechMethod({ attributes, children }: MarkComponentProps): ReactElement {
  const written = str(childText(children));
  const recognized = recognize(written);
  const label = recognized ?? written;
  const path = str(attributes?.path);
  const modifier = recognized ? recognized.toLowerCase() : 'other';

  return (
    <span className="mk-tech_method">
      <span className={`mk-tech_method__chip mk-tech_method__chip--${modifier}`}>
        {label !== '' ? label : '?'}
      </span>
      {path !== '' && <code className="mk-tech_method__path">{path}</code>}
    </span>
  );
}
