import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { flag, str } from './guard';
import './col.css';

/**
 * `::data_col{name="user_id" type=bigint pk note="joins to dim_user"}`,
 * one row of a schema card: the column name in monospace, a muted type
 * tag, an optional primary-key marker, and an optional note pushed to the
 * end of the row.
 *
 * Every field is independent and optional. A column with no `name` still
 * renders, as a quiet "unnamed column" placeholder, rather than leaving a
 * gap in the middle of a schema; a column with no `type` simply has no
 * type tag, which is the honest rendering of a type you have not written
 * down yet.
 *
 * `pk` is normally written bare (`{pk}`), which the parser hands over as
 * `null` rather than as a string. `flag` reads that, and also reads the
 * spellings people type by hand (`pk=true`, `pk=yes`), while treating the
 * explicit negatives as false.
 */
export function DataColumn({ attributes }: MarkComponentProps): ReactElement {
  const name = str(attributes?.name);
  const type = str(attributes?.type);
  const note = str(attributes?.note);
  const isKey = flag(attributes?.pk);

  return (
    <div className="mk-data_col">
      <code
        className={
          name !== '' ? 'mk-data_col__name' : 'mk-data_col__name mk-data_col__name--placeholder'
        }
      >
        {name !== '' ? name : 'unnamed column'}
      </code>
      {isKey && (
        <span className="mk-data_col__pk" title="primary key">
          PK
        </span>
      )}
      {type !== '' && <span className="mk-data_col__type">{type}</span>}
      {note !== '' && <span className="mk-data_col__note">{note}</span>}
    </div>
  );
}
