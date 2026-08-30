import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import {
  failureTitle,
  isUnreadable,
  safeExtract,
  stateClassName,
  str,
} from './guard';
import './habits.css';

const MAX_ROWS = 20;
const MAX_DAYS = 14;

interface HabitRow {
  name: string;
  done: boolean[];
}

interface HabitsFields {
  days: string[];
  rows: HabitRow[];
}

/** Coerces one array entry to a boolean, treating any non-boolean as `false` rather than propagating a stray type. */
function toBool(value: unknown): boolean {
  return value === true;
}

/**
 * Extracts `{days, rows}` off a bound `data` value. A junk row (not a
 * plain object) is skipped entirely rather than rendered blank; a row
 * missing `name`/`done` degrades to an empty name / no checked days
 * instead of being dropped, since a partially-usable row is still useful
 * in a tracker. Both rows and each row's days are capped so a hostile or
 * oversized payload cannot blow up the grid.
 */
function extractHabits(data: unknown): HabitsFields {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { days: [], rows: [] };
  }
  const record = data as Record<string, unknown>;

  const rawRows = Array.isArray(record.rows) ? record.rows : [];
  const rows: HabitRow[] = [];
  for (const entry of rawRows) {
    if (rows.length >= MAX_ROWS) break;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const rowRecord = entry as Record<string, unknown>;
    const name = str(rowRecord.name, '');
    const rawDone = Array.isArray(rowRecord.done) ? rowRecord.done : [];
    const done = rawDone.slice(0, MAX_DAYS).map(toBool);
    rows.push({ name, done });
  }

  const dayCount = Math.min(
    MAX_DAYS,
    Math.max(0, ...rows.map((row) => row.done.length)),
  );
  const rawDays = Array.isArray(record.days) ? record.days : [];
  const days: string[] = [];
  for (let i = 0; i < dayCount; i += 1) {
    const label = str(rawDays[i], '');
    days.push(label !== '' ? label : String(i + 1));
  }

  return { days, rows };
}

/**
 * `::track_habits{data=week}` — a compact grid: habit names down the left,
 * one check cell per day across. The bound `data` is
 * `{days:["Mon",...]?, rows:[{name, done:[bool,...]}]}`; `days` is
 * optional and falls back to numbered columns. Rows cap at 20, days at 14;
 * a row that is not a plain object is skipped. Fully offline: no network
 * anywhere in this pack.
 */
export function Habits({
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const bound = safeExtract<HabitsFields>(
    () =>
      isUnreadable(dataStatus) ? { days: [], rows: [] } : extractHabits(data),
    () => ({ days: [], rows: [] }),
  );
  const { days, rows } = bound.fields;

  return (
    <div
      className={stateClassName('mk-track_habits', dataStatus)}
      title={failureTitle(dataError, bound.fault)}
    >
      {rows.length === 0 ? (
        <div className="mk-track_habits__empty">No habits tracked</div>
      ) : (
        <table className="mk-track_habits__table">
          <thead>
            <tr>
              <th className="mk-track_habits__name-head" />
              {days.map((day, i) => (
                <th className="mk-track_habits__day-head" key={i}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <th className="mk-track_habits__name" scope="row">
                  {row.name !== '' ? row.name : 'Untitled'}
                </th>
                {days.map((_day, i) => (
                  <td className="mk-track_habits__cell" key={i}>
                    <span
                      className={
                        row.done[i] === true
                          ? 'mk-track_habits__check mk-track_habits__check--done'
                          : 'mk-track_habits__check'
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
