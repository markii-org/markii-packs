import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import {
  failureTitle,
  isUnreadable,
  safeExtract,
  stateClassName,
  str,
} from './guard';
import './log.css';

const MAX_ROWS = 50;

interface LogEntry {
  date: string;
  text: string;
  value: number | undefined;
}

/**
 * Extracts up to `MAX_ROWS` log entries off a bound `data` array. An entry
 * that is not a plain object is skipped; a numeric `value` field is kept
 * only when finite. Entries whose `date` parses are ordered newest first;
 * entries whose `date` does not parse sink to the end in their original
 * relative order, since there is no reliable position for them.
 */
function extractEntries(data: unknown): LogEntry[] {
  if (!Array.isArray(data)) return [];
  const entries: { entry: LogEntry; key: number; index: number }[] = [];
  let index = 0;
  for (const raw of data) {
    if (entries.length >= MAX_ROWS) break;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const date = str(record.date, '');
    const text = str(record.text, '');
    const rawValue = record.value;
    const value =
      typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? rawValue
        : undefined;
    const parsed = Date.parse(date);
    entries.push({
      entry: { date, text, value },
      key: Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed,
      index,
    });
    index += 1;
  }
  entries.sort((a, b) => {
    if (a.key !== b.key) return b.key - a.key;
    return a.index - b.index;
  });
  return entries.map((row) => row.entry);
}

/**
 * `::track_log{data=entries}` — a minimal dated log table: date, entry
 * text, and an optional right-aligned numeric value. The bound `data` is
 * an array of `{date, text, value?}`; capped at 50 rows, newest first when
 * dates parse. Fully offline: no network anywhere in this pack.
 */
export function Log({
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const bound = safeExtract<LogEntry[]>(
    () => (isUnreadable(dataStatus) ? [] : extractEntries(data)),
    () => [],
  );
  const entries = bound.fields;

  return (
    <div
      className={stateClassName('mk-track_log', dataStatus)}
      title={failureTitle(dataError, bound.fault)}
    >
      {entries.length === 0 ? (
        <div className="mk-track_log__empty">No log entries</div>
      ) : (
        <table className="mk-track_log__table">
          <tbody>
            {entries.map((entry, i) => (
              <tr className="mk-track_log__row" key={i}>
                <td className="mk-track_log__date">{entry.date || '–'}</td>
                <td className="mk-track_log__text">{entry.text}</td>
                <td className="mk-track_log__value">
                  {entry.value !== undefined ? entry.value : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
