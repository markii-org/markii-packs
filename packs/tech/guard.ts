/**
 * Shared defensive helpers for the `tech` pack, adapted from
 * `packs/dash/guard.ts`. None of `tech`'s components read a bound `data=`
 * value, but every one of them reads attributes (raw strings or `null`)
 * and, for the container components, walks pre-rendered React children
 * that may themselves be hostile (a hand-built registry, a forged
 * `data-mk-attrs` string). Every attribute and child read in this pack
 * goes through one of these helpers so a malformed or oversized value
 * degrades to a quiet default instead of throwing.
 */

/** A generous but finite cap on any single displayed string. Guards against a 10,000-character attribute value blowing up layout or, worse, memory in a diff. */
const MAX_TEXT_LENGTH = 500;

/** Coerces an unknown value to a trimmed string, capped to `MAX_TEXT_LENGTH`, or `fallback`. */
export function str(raw: unknown, fallback = ''): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

/** Like `str`, but does not fall back on an empty string: `""` is a legal result, distinct from "not written at all" (`undefined`/non-string). */
export function optionalStr(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;
}

/**
 * Runs `read`, an extraction that walks untrusted pre-rendered children or
 * attribute JSON, and falls back to `fallback()` if any part of it throws.
 * Mirrors `packs/dash/guard.ts`'s `safeExtract`: the whole extraction is
 * wrapped once, not read-by-read, since a value whose reads throw partway
 * through is not safely resumable.
 */
export function safely<T>(read: () => T, fallback: () => T): T {
  try {
    return read();
  } catch {
    return fallback();
  }
}
