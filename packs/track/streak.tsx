import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import {
  clamp,
  failureTitle,
  int,
  isUnreadable,
  safeExtract,
  stateClassName,
  str,
} from './guard';
import './streak.css';

const DEFAULT_WEEKS = 12;
const MIN_WEEKS = 4;
const MAX_WEEKS = 26;
const MAX_DAYS_READ = 2000;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses one candidate date entry into a validated `YYYY-MM-DD` string, or
 * `undefined` for anything that is not one: wrong shape, an out-of-range
 * month/day, or a string `Date` would otherwise silently round-trip
 * (`Date.parse` accepts far more than a calendar date allows).
 */
function parseIsoDay(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const match = ISO_DATE.exec(raw);
  if (match === null) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return raw;
}

/**
 * Extracts a set of validated `YYYY-MM-DD` day strings off a bound array.
 * Junk entries (wrong type, malformed, or an impossible calendar date) are
 * dropped rather than propagated; the read is capped so an oversized array
 * cannot translate into unbounded work.
 */
function extractDays(data: unknown): Set<string> {
  const days = new Set<string>();
  if (!Array.isArray(data)) return days;
  const limit = Math.min(data.length, MAX_DAYS_READ);
  for (let i = 0; i < limit; i += 1) {
    const day = parseIsoDay(data[i]);
    if (day !== undefined) days.add(day);
  }
  return days;
}

function toIsoDay(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Cell {
  iso: string | undefined;
  done: boolean;
}

/** Builds `weeks` columns of 7 rows (Sun..Sat) ending on today's week, UTC-anchored so the grid is stable regardless of the viewer's timezone offset within a day. */
function buildGrid(weeks: number, done: Set<string>): Cell[][] {
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const endOfWeek = new Date(todayUtc);
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + (6 - endOfWeek.getUTCDay()));
  const start = new Date(endOfWeek);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));

  const columns: Cell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w += 1) {
    const column: Cell[] = [];
    for (let d = 0; d < 7; d += 1) {
      if (cursor.getTime() > todayUtc.getTime()) {
        column.push({ iso: undefined, done: false });
      } else {
        const iso = toIsoDay(cursor);
        column.push({ iso, done: done.has(iso) });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    columns.push(column);
  }
  return columns;
}

/**
 * `::track_streak{data=days weeks=12 label="..."}` — a GitHub-style
 * calendar grid over the last `weeks` weeks (clamped 4..26), one column
 * per week and 7 rows (Sun..Sat). The bound `data` is an array of
 * `YYYY-MM-DD` strings naming the days a habit was done; malformed entries
 * are ignored rather than breaking the grid. Fully offline: no network
 * involved anywhere in this pack.
 */
export function Streak({
  attributes,
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const weeks = clamp(int(attributes.weeks, DEFAULT_WEEKS), MIN_WEEKS, MAX_WEEKS);
  const label = str(attributes.label, '');

  const bound = safeExtract<Set<string>>(
    () => (isUnreadable(dataStatus) ? new Set<string>() : extractDays(data)),
    () => new Set<string>(),
  );
  const done = bound.fields;
  const grid = buildGrid(weeks, done);
  const doneCount = grid.reduce(
    (sum, column) => sum + column.filter((cell) => cell.done).length,
    0,
  );

  return (
    <div
      className={stateClassName('mk-track_streak', dataStatus)}
      title={failureTitle(dataError, bound.fault)}
    >
      {label !== '' && <div className="mk-track_streak__label">{label}</div>}
      <div
        className="mk-track_streak__grid"
        style={{ ['--track-weeks' as string]: String(weeks) }}
      >
        {grid.map((column, w) => (
          <div className="mk-track_streak__col" key={w}>
            {column.map((cell, d) => (
              <div
                key={d}
                className={
                  cell.done
                    ? 'mk-track_streak__cell mk-track_streak__cell--done'
                    : 'mk-track_streak__cell'
                }
                title={cell.iso}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mk-track_streak__count">{doneCount} days</div>
    </div>
  );
}
