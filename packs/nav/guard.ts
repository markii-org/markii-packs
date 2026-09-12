/**
 * Shared defensive helpers for the `nav` pack, following the same shape as
 * `packs/schema/guard.ts`.
 *
 * Nothing in this pack reads a bound `data=` value: an index of links is
 * typed into the note by hand. Every component still reads raw attributes,
 * which arrive as untrusted strings (or `null` for a bare attribute, or
 * simply absent for one never written), and the container components walk
 * pre-rendered React children that may themselves be hostile (a hand-built
 * registry, a forged `data-mk-attrs` string, a `Proxy` that throws on
 * access). Every one of those reads goes through a helper here or in
 * `./children.ts`, so a malformed, oversized, or actively hostile value
 * degrades to a quiet default instead of throwing.
 */

/**
 * A generous but finite cap on any single displayed string. Attribute
 * values come straight out of the note, so nothing stops an author from
 * pasting a very long string into `desc=`; without a cap that reaches the
 * DOM, and the filter's match text, unbounded.
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
 * Reads a closed-set attribute case-insensitively, falling back to
 * `fallback` for anything not in `values` (including a non-string, a bare
 * `null`, stray whitespace, or a value written in the wrong case). Used
 * for `icon` and `tone`: a note author can only ever get a value this pack
 * actually knows how to draw, never a half-applied class name.
 */
export function oneOf<T extends string>(raw: unknown, values: readonly T[], fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().toLowerCase();
  return (values as readonly string[]).includes(trimmed) ? (trimmed as T) : fallback;
}

/**
 * Whether an attribute was written at all, bare or with a value. This is
 * the one place the pack needs to tell "omitted" apart from "written
 * bare" (`{search}`, which arrives as `null`, the same shape a hostile
 * registry could also produce for an omitted key): `nav_index`'s `search`
 * shows a filter field for either a bare or a valued `search=`, and shows
 * no field at all when the key is missing from `attributes` entirely.
 * Reading `attributes` this way (rather than `key in attributes`, which
 * throws on a non-object) is itself guarded, since `attributes` is only
 * typed as an object; a hostile registry can hand over anything.
 */
export function hasAttribute(attributes: unknown, key: string): boolean {
  try {
    return (
      attributes !== null &&
      typeof attributes === 'object' &&
      Object.prototype.hasOwnProperty.call(attributes, key)
    );
  } catch {
    return false;
  }
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

/**
 * The one security-relevant helper in this pack.
 *
 * `nav_link` builds its own `<a href>` from an attribute string, which
 * means it bypasses the sanitizer `@markii/core` applies to markdown-authored
 * links (`[text](url)`): that sanitizer only ever sees an `<a>` hast node
 * remark-rehype itself produced from markdown syntax, never a URL a
 * component assembled on its own from a directive attribute. So this pack
 * has to re-do that safety check itself, exactly as carefully.
 *
 * Accepted: `http:`, `https:`, and `mailto:` absolute URLs (scheme
 * compared case-insensitively), plus anything with no scheme at all: a
 * relative path (`./page.mk.md`), a same-note fragment (`#section`), a
 * query string, or a protocol-relative reference (`//host/path`, which
 * inherits whatever scheme loaded the current page, the same way a plain
 * markdown link with no scheme does).
 *
 * Rejected: everything else, in particular `javascript:`, `data:`, and
 * `vbscript:`, any other scheme not in the allowlist, and any value that
 * carries a control character anywhere in it. That last check is not
 * redundant with the scheme check: a browser strips certain control
 * characters (tab, newline, carriage return) out of a URL before parsing
 * it, which is exactly how a scheme name with a tab hidden in the middle
 * of it bypasses a naive string check that looks for the literal substring
 * "javascript:" (the tab breaks the substring match, but the browser
 * still sees "javascript:" once it strips the tab. This function does not
 * try to replicate that stripping and then re-check; it simply refuses
 * any href carrying a raw control character at all, which is a strictly
 * safer rule and never something a legitimate URL needs.
 *
 * The scheme itself is read only after trimming leading and trailing
 * whitespace and control characters (a leading tab or a stray space before
 * the value is a thing a hostile or merely careless note can carry), and
 * is matched by finding the first `:` and confirming it comes before any
 * `/`, `?`, or `#`, the same "is there really a scheme here" test
 * `@markii/core`'s own `isSafeUrl` uses, so a colon that shows up later in a
 * path (`https://example.com/a:b`) is never mistaken for a second scheme.
 *
 * A rejected `href` is not a fatal error: the caller renders the row
 * without an anchor, with a `title` explaining why, per this pack's
 * "never throw, never dump an error" rule.
 */
const MAX_HREF_LENGTH = 2000;
const SAFE_HREF_SCHEMES = new Set(['http', 'https', 'mailto']);

/**
 * True for a C0 control character (code points 0 through 31) or DEL (127).
 * Written as a code-point range check rather than a regex character class
 * holding a raw control byte: a control byte pasted straight into source
 * is exactly the kind of thing that is easy to mis-copy in review and
 * impossible to tell apart from a stray space at a glance.
 */
function isControlChar(codePoint: number): boolean {
  return (codePoint >= 0 && codePoint <= 31) || codePoint === 127;
}

/** True for an ASCII space or any control character. */
function isSpaceOrControl(codePoint: number): boolean {
  return codePoint === 32 || isControlChar(codePoint);
}

/** Strips leading and trailing spaces and control characters, without touching anything in between. */
function trimSpaceAndControl(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && isSpaceOrControl(value.charCodeAt(start))) start += 1;
  while (end > start && isSpaceOrControl(value.charCodeAt(end - 1))) end -= 1;
  return value.slice(start, end);
}

/** True if any character in `value`, wherever it falls, is a control character. */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (isControlChar(value.charCodeAt(i))) return true;
  }
  return false;
}

export function safeHref(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  if (raw.length > MAX_HREF_LENGTH) return undefined;

  const trimmed = trimSpaceAndControl(raw);
  if (trimmed === '') return undefined;
  if (hasControlChar(trimmed)) return undefined;

  const colon = trimmed.indexOf(':');
  if (colon === -1) return trimmed;

  const slash = trimmed.indexOf('/');
  const question = trimmed.indexOf('?');
  const hash = trimmed.indexOf('#');
  const colonIsScheme =
    (slash === -1 || colon < slash) &&
    (question === -1 || colon < question) &&
    (hash === -1 || colon < hash);
  if (!colonIsScheme) return trimmed;

  const scheme = trimmed.slice(0, colon).toLowerCase();
  return SAFE_HREF_SCHEMES.has(scheme) ? trimmed : undefined;
}
