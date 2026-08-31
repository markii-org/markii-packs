/**
 * Shared defensive helpers for the `data` pack, following the same shape
 * as `packs/tech/guard.ts`.
 *
 * Nothing in this pack reads a bound `data=` value: a schema, a pipeline
 * sketch, and a number worth remembering are all typed into the note by
 * hand while reading. Every component still reads raw attributes, which
 * arrive as untrusted strings (or `null` for a bare attribute), and the
 * container components walk pre-rendered React children that may
 * themselves be hostile (a hand-built registry, a forged `data-mk-attrs`
 * string). Every one of those reads goes through a helper here or in
 * `./children.ts`, so a malformed or oversized value degrades to a quiet
 * default instead of throwing.
 */

/**
 * A generous but finite cap on any single displayed string. Attribute
 * values come straight out of the note, so nothing stops an author from
 * pasting a very long string into `note=`; without a cap that reaches the
 * DOM unbounded.
 */
const MAX_TEXT_LENGTH = 500;

/** Coerces an unknown value to a trimmed string capped at `MAX_TEXT_LENGTH`, or `fallback`. */
export function str(raw: unknown, fallback = ''): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

/**
 * Like `str`, but tells "written as an empty string" apart from "not
 * written at all": a non-string (including the `null` a bare attribute
 * arrives as) yields `undefined`, an empty string stays an empty string.
 */
export function optionalStr(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

/**
 * Reads a flag attribute that is normally written bare (`{pk}`), which
 * the parser hands over as `null` rather than as a string.
 *
 * A key that was never written is absent from the attribute object and
 * reads as `false`. A bare key reads as `true`, which is the whole point
 * of writing it. A key written with a value is read leniently, since
 * `pk=true`, `pk=yes` and `pk=1` are all things people type: only the
 * explicit negatives (`false`, `no`, `0`, `off`) come back `false`, and
 * anything else counts as written and therefore true.
 */
export function flag(raw: unknown): boolean {
  if (raw === null) return true;
  if (typeof raw !== 'string') return false;
  const value = raw.trim().toLowerCase();
  if (value === '') return true;
  return value !== 'false' && value !== 'no' && value !== '0' && value !== 'off';
}

/**
 * Runs `read`, an extraction that walks untrusted pre-rendered children or
 * attribute JSON, and falls back to `fallback()` if any part of it throws.
 * The whole extraction is wrapped once, not read by read: a value whose
 * reads throw partway through is not safely resumable, so a half-collected
 * result would be arbitrary rather than useful.
 */
export function safely<T>(read: () => T, fallback: () => T): T {
  try {
    return read();
  } catch {
    return fallback();
  }
}
