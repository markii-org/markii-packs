import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import './schema.css';

/**
 * `:::schema_schema{name="events_raw"}` ... `:::`, a schema card for one
 * table or dataset: a monospace name strip, then the column list below.
 *
 * The body is normally a run of `::schema_col` children, but this component
 * never re-implements column rendering. It lays out whatever `children`
 * already are, and each column renders itself exactly as it would
 * standing alone. That means prose mixed in between columns still reads
 * correctly, and a schema with no columns yet is an empty card rather
 * than an error.
 *
 * With no usable `name` the card still renders, headed by a quiet
 * "unnamed dataset" placeholder, since a schema you have not named yet is
 * a normal state while reading.
 */
export function DataSchema({ attributes, children }: MarkComponentProps): ReactElement {
  const name = str(attributes?.name);

  return (
    <div className="mk-schema_schema">
      <div className="mk-schema_schema__head">
        <span
          className={
            name !== ''
              ? 'mk-schema_schema__name'
              : 'mk-schema_schema__name mk-schema_schema__name--placeholder'
          }
        >
          {name !== '' ? name : 'unnamed dataset'}
        </span>
      </div>
      <div className="mk-schema_schema__body">{children}</div>
    </div>
  );
}
