import type { ReactElement, ReactNode } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import { hasContent } from './children';
import './fact.css';

/**
 * `::schema_fact[default shuffle partitions]{value=200}`, a figure worth
 * remembering: the number large, its caption underneath.
 *
 * This is not the standard `stat` component with different colors. `stat`
 * reads a `data=` binding and shows a live value, which means it also
 * carries the machinery for a binding that is stale, missing, or
 * produced by a script that failed. A fact is a constant copied out of a
 * document while reading: it has no binding, so it has no failure states,
 * and it never changes between one render and the next.
 *
 * The caption can be written either way, bracket content winning over the
 * `label` attribute. Value and caption are independent: either one alone
 * still renders, and with neither the component shows a quiet "no figure
 * recorded" placeholder rather than an empty box.
 */
export function DataFact({ attributes, children }: MarkComponentProps): ReactElement {
  const value = str(attributes?.value);
  const label = str(attributes?.label);
  const written = hasContent(children);
  const caption: ReactNode = written ? children : label !== '' ? label : undefined;
  const hasCaption = written || label !== '';

  if (value === '' && !hasCaption) {
    return (
      <div className="mk-schema_fact">
        <span className="mk-schema_fact__empty">no figure recorded</span>
      </div>
    );
  }

  return (
    <div className="mk-schema_fact">
      {value !== '' && <span className="mk-schema_fact__value">{value}</span>}
      {hasCaption && <span className="mk-schema_fact__label">{caption}</span>}
    </div>
  );
}
