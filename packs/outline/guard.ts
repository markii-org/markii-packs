/**
 * Shared defensive helpers for the `outline` pack, following the same shape
 * as `packs/schema/guard.ts`.
 *
 * Nothing in this pack reads a bound `data=` value: a tree of headings, a
 * folder listing, or an outline of a document is typed into the note by
 * hand while reading or organizing. Every component still reads raw
 * attributes, which arrive as untrusted strings (or `null` for a bare
 * attribute), and `tree` walks pre-rendered React children that may
 * themselves be hostile (a hand-built registry, a forged `data-mk-attrs`
 * string, a deeply nested wrapper meant to blow a stack). Every one of
 * those reads goes through a helper here, so a missing or malformed value
 * degrades to a quiet default instead of throwing.
 */

/**
 * A generous but finite cap on any single displayed string. Attribute
 * values come straight out of the note, so nothing stops an author from
 * pasting a very long string into `meta=`; without a cap that reaches the
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
 * Not used directly by any component here today, kept alongside `str` for
 * the same reason `schema`'s guard keeps it: a future attribute that needs
 * to distinguish "empty" from "absent" should not need a new helper.
 */
export function optionalStr(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

/**
 * Reads a flag attribute that is normally written bare (`{open}`), which
 * the parser hands over as `null` rather than as a string.
 *
 * A key that was never written is absent from the attribute object and
 * reads as `false`. A bare key reads as `true`, which is the whole point
 * of writing it. A key written with a value is read leniently, since
 * `open=true`, `open=yes` and `open=1` are all things people type: only
 * the explicit negatives (`false`, `no`, `0`, `off`) come back `false`, and
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
 * Reads a closed-set attribute: `raw` is matched case-insensitively against
 * `allowed` and the matching member of `allowed` is returned so the result
 * always carries the pack's own casing, never the author's. Anything that
 * does not match, including a non-string or an empty string, returns
 * `fallback`. Used for `icon`, where an unrecognized value must render no
 * glyph rather than guess at one.
 */
export function oneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().toLowerCase();
  for (const candidate of allowed) {
    if (candidate.toLowerCase() === trimmed) return candidate;
  }
  return fallback;
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
