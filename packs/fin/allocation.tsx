import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { failureTitle, isUnreadable, safeExtract, stateClassName, str } from './guard';
import './allocation.css';

const MAX_SLICES = 10;
const SIZE = 120;
const RADIUS = 50;
const STROKE = 18;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Slice {
  label: string;
  value: number;
}

/**
 * Extracts one allocation slice. A slice without a usable label, or whose
 * value is not a finite positive number, is skipped by the caller: a
 * zero or negative value has no honest angle on a donut.
 */
function extractSlice(entry: unknown): Slice | undefined {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  const label = str(record.label);
  const value = record.value;
  if (label === '') return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return { label, value };
}

function extractSlices(data: unknown): Slice[] {
  if (!Array.isArray(data)) return [];
  const slices: Slice[] = [];
  for (const entry of data) {
    if (slices.length >= MAX_SLICES) break;
    const slice = extractSlice(entry);
    if (slice !== undefined) slices.push(slice);
  }
  return slices;
}

/**
 * A palette of `MAX_SLICES` colors, none of them a raw literal: every stop
 * is `--mk-accent` mixed with `--mk-bg` (lighter stops) or `--mk-fg`
 * (darker stops) at a varying ratio, so the whole palette rides the same
 * two theme tokens and stays correct in both a light and a dark host.
 */
const PALETTE = [
  'color-mix(in srgb, var(--mk-accent) 100%, var(--mk-bg))',
  'color-mix(in srgb, var(--mk-accent) 55%, var(--mk-fg))',
  'color-mix(in srgb, var(--mk-accent) 70%, var(--mk-bg))',
  'color-mix(in srgb, var(--mk-accent) 40%, var(--mk-bg))',
  'color-mix(in srgb, var(--mk-accent) 85%, var(--mk-fg))',
  'color-mix(in srgb, var(--mk-accent) 25%, var(--mk-fg))',
  'color-mix(in srgb, var(--mk-accent) 55%, var(--mk-bg))',
  'color-mix(in srgb, var(--mk-accent) 70%, var(--mk-fg))',
  'color-mix(in srgb, var(--mk-accent) 15%, var(--mk-bg))',
  'color-mix(in srgb, var(--mk-accent) 90%, var(--mk-bg))',
];

/**
 * `::fin_allocation{data=... label="..."}` — a hand-rolled SVG donut chart
 * plus a legend listing each slice's share of the total. Slices with a
 * zero, negative, or non-numeric value are skipped rather than drawn as a
 * zero-width arc. `label` is a caption under the chart, not a data key.
 * An unbound, failed, or empty binding renders a quiet empty state with
 * the reason in a tooltip, per spec §4.
 */
export function FinAllocation({
  attributes,
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const label = typeof attributes?.label === 'string' ? attributes.label : '';

  const bound = safeExtract<Slice[]>(
    () => (isUnreadable(dataStatus) ? [] : extractSlices(data)),
    () => [],
  );
  const slices = bound.fields;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;
  const arcs = slices.map((slice, index) => {
    const fraction = total > 0 ? slice.value / total : 0;
    const dash = fraction * CIRCUMFERENCE;
    const arc = {
      slice,
      color: PALETTE[index % PALETTE.length],
      dashArray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashOffset: -offset,
      pct: fraction * 100,
    };
    offset += dash;
    return arc;
  });

  return (
    <div
      className={stateClassName('mk-fin_allocation', dataStatus)}
      title={failureTitle(dataError, bound.fault, slices.length === 0 ? 'no allocation data' : undefined)}
    >
      {slices.length > 0 && (
        <>
          <svg
            className="mk-fin_allocation__chart"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={label !== '' ? label : 'allocation donut chart'}
          >
            <circle
              className="mk-fin_allocation__track"
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
            />
            {arcs.map((arc, index) => (
              <circle
                key={`${arc.slice.label}-${index}`}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            ))}
          </svg>
          <div className="mk-fin_allocation__side">
            {label !== '' && <div className="mk-fin_allocation__label">{label}</div>}
            <ul className="mk-fin_allocation__legend">
              {arcs.map((arc, index) => (
                <li key={`${arc.slice.label}-${index}`} className="mk-fin_allocation__item">
                  <span
                    className="mk-fin_allocation__swatch"
                    style={{ background: arc.color }}
                    aria-hidden="true"
                  />
                  <span className="mk-fin_allocation__item-label">{arc.slice.label}</span>
                  <span className="mk-fin_allocation__item-pct">{arc.pct.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
