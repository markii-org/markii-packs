import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { optionalStr } from './guard';
import './verified.css';

type Result = 'worked' | 'failed' | 'partial' | 'other';

function normalizeResult(raw: string | undefined): Result {
  if (raw === 'worked' || raw === 'failed' || raw === 'partial') return raw;
  return 'other';
}

/** The marker's accessible label, since it is drawn as a bare glyph otherwise invisible to a screen reader. */
function resultLabel(result: Result): string {
  if (result === 'worked') return 'worked';
  if (result === 'failed') return 'failed';
  if (result === 'partial') return 'partial';
  return 'result unspecified';
}

/**
 * `::tech_verified{env="Spark 3.5.1" result=worked date="2026-08-12"
 * note="..."}`, a one-line record of a manual verification: a tinted
 * result marker, the environment in monospace, the date, and a muted
 * note. Every field is optional and independent: an attribute left out
 * simply omits its piece, and with nothing usable at all the line still
 * renders a quiet placeholder rather than collapsing to an empty box.
 */
export function TechVerified({ attributes }: MarkComponentProps): ReactElement {
  const env = optionalStr(attributes?.env);
  const date = optionalStr(attributes?.date);
  const note = optionalStr(attributes?.note);
  const result = normalizeResult(optionalStr(attributes?.result));

  const hasContent = env !== undefined || date !== undefined || note !== undefined;

  return (
    <span className="mk-tech_verified">
      <span
        className={`mk-tech_verified__marker mk-tech_verified__marker--${result}`}
        role="img"
        aria-label={resultLabel(result)}
      />
      {env !== undefined && <code className="mk-tech_verified__env">{env}</code>}
      {date !== undefined && <span className="mk-tech_verified__date">{date}</span>}
      {note !== undefined && <span className="mk-tech_verified__note">{note}</span>}
      {!hasContent && <span className="mk-tech_verified__note">no verification details</span>}
    </span>
  );
}
