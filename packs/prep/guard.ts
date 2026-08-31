/**
 * Shared defensive helpers for the `prep` pack, following the same shape
 * as `packs/tech/guard.ts`.
 *
 * None of `prep`'s components read a bound `data=` value: an interview
 * question, a confidence rating, and a pitfall note are all typed into
 * the note by hand. Every one of them still reads raw attributes, which
 * arrive as untrusted strings (or `null` for a bare attribute), so all
 * attribute reads go through one of these helpers. A missing, oversized,
 * or nonsense value degrades to a quiet default rather than throwing.
 */

/**
 * A generous but finite cap on any single displayed string. An attribute
 * comes straight out of the note, so nothing stops an author from pasting
 * ten thousand characters into `q=`; without a cap that reaches the DOM
 * unbounded.
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
 * Reads an unknown value as a whole number inside `[min, max]`, or
 * `undefined` when it cannot be read as one. A value outside the range is
 * clamped rather than rejected, so `confidence=9` reads as full confidence
 * instead of silently dropping the rating; a fractional value is rounded.
 * Anything that is not a finite number (a word, an empty string, a bare
 * attribute's `null`) yields `undefined`, which every caller renders as
 * "no rating given" rather than as zero.
 */
export function intInRange(raw: unknown, min: number, max: number): number | undefined {
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw)
        : Number.NaN;
  if (!Number.isFinite(value)) return undefined;
  return Math.min(Math.max(Math.round(value), min), max);
}

/**
 * Whether `raw` reads as a recognized member of `allowed`, returning the
 * member itself or `undefined`. Membership is tested against a list rather
 * than by indexing a lookup object: an object lookup answers for inherited
 * `Object.prototype` keys too, so `level=constructor` would come back as a
 * function and stringify into a class attribute. A list has no such keys.
 */
export function oneOf<T extends string>(
  raw: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return (allowed as readonly string[]).includes(trimmed) ? (trimmed as T) : undefined;
}
