import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import {
  clamp,
  failureTitle,
  isUnreadable,
  num,
  safeExtract,
  stateClassName,
  str,
} from './guard';
import './ring.css';

const DEFAULT_MAX = 100;
const SIZE = 100;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingFields {
  value?: number;
  max?: number;
}

/**
 * Reads `value`/`max` off a bound `data` value: a bare finite number
 * supplies `value` alone; a plain object may supply either/both fields.
 * Anything else contributes nothing, matching `@markii/react`'s own
 * `progress` component's data-binding shape.
 */
function readRingFields(data: unknown): RingFields {
  if (typeof data === 'number') {
    return { value: Number.isFinite(data) ? data : undefined };
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    const value = record.value;
    const max = record.max;
    return {
      value: typeof value === 'number' && Number.isFinite(value) ? value : undefined,
      max: typeof max === 'number' && Number.isFinite(max) ? max : undefined,
    };
  }
  return {};
}

/**
 * `::track_ring{data=progress label="Pages read" max=300}` — a hand-rolled
 * SVG progress ring with the percentage centered. The bound `data` supplies
 * `value` (a bare number) or `{value, max}`. Written `value`/`max`
 * attributes always win over the binding, matching `@markii/react`'s own
 * `progress`, so the ring also works in a note with no script at all;
 * `max` defaults to 100. Value is clamped to `[0, max]`. Fully offline: no
 * network anywhere.
 */
export function Ring({
  attributes,
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const label = str(attributes.label, '');

  const bound = safeExtract<RingFields>(
    () => (isUnreadable(dataStatus) ? {} : readRingFields(data)),
    () => ({}),
  );
  const fromData = bound.fields;

  const rawMax = num(attributes.max, fromData.max ?? DEFAULT_MAX);
  const max = rawMax > 0 ? rawMax : DEFAULT_MAX;
  const value = clamp(num(attributes.value, fromData.value ?? 0), 0, max);
  const percent = clamp((value / max) * 100, 0, 100);
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <div
      className={stateClassName('mk-track_ring', dataStatus)}
      title={failureTitle(dataError, bound.fault)}
    >
      <svg
        className="mk-track_ring__svg"
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        role="img"
        aria-label={label !== '' ? label : 'progress ring'}
      >
        <circle
          className="mk-track_ring__track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
        />
        <circle
          className="mk-track_ring__bar"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
        />
        <text
          className="mk-track_ring__percent"
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {Math.round(percent)}%
        </text>
      </svg>
      {label !== '' && <div className="mk-track_ring__label">{label}</div>}
    </div>
  );
}
