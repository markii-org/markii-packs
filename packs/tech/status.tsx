import type { ReactElement, ReactNode } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { optionalStr, str } from './guard';
import './status.css';

const LIFECYCLE = [
  'stable',
  'beta',
  'experimental',
  'deprecated',
  'removed',
  'nightly',
  'unsafe',
] as const;
type Lifecycle = (typeof LIFECYCLE)[number];

function recognize(raw: string): Lifecycle | undefined {
  return (LIFECYCLE as readonly string[]).includes(raw) ? (raw as Lifecycle) : undefined;
}

function childText(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  return '';
}

/**
 * `:tech_status[deprecated]{since="3.5"}`, a lifecycle badge for
 * `stable | beta | experimental | deprecated | removed | nightly |
 * unsafe`, each with its own token-derived tint. An unrecognized value
 * (including empty) renders neutral, showing the text exactly as
 * written rather than guessing at a lifecycle. With `since` present, a
 * quieter "since <value>" line is appended inside the badge.
 */
export function TechStatus({ attributes, children }: MarkComponentProps): ReactElement {
  const written = str(childText(children));
  const recognized = recognize(written);
  const since = optionalStr(attributes?.since);
  const modifier = recognized ?? 'other';

  return (
    <span className={`mk-tech_status mk-tech_status--${modifier}`}>
      <span className="mk-tech_status__label">{written !== '' ? written : 'unspecified'}</span>
      {since !== undefined && since !== '' && (
        <span className="mk-tech_status__since">since {since}</span>
      )}
    </span>
  );
}
