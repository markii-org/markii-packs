#!/usr/bin/env node
// Validates every pack in packs/ (and the template) against the pack
// contract: a well-formed pack.json using the object form for every
// component with a description and a valid kind, sources that resolve
// inside the pack folder, a README and an example note, CSS selectors
// scoped to the pack's namespace, and a scan for raw color literals.
//
// Exits 1 if any check fails. Warnings (raw colors) are printed but do not
// fail the run.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, normalize, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePackManifest, packComponents } from '@markii/pack';

const VALID_KINDS = new Set(['container', 'leaf', 'inline']);

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packsDir = join(rootDir, 'packs');
const templateDir = join(rootDir, 'template');

let errors = 0;
let warnings = 0;

function fail(pack, message) {
  console.error(`FAIL ${pack}: ${message}`);
  errors++;
}

function warn(pack, message) {
  console.warn(`WARN ${pack}: ${message}`);
  warnings++;
}

function ok(pack, message) {
  console.log(`ok   ${pack}: ${message}`);
}

function listCssFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.cache') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...listCssFiles(full));
    } else if (entry.name.endsWith('.css')) {
      found.push(full);
    }
  }
  return found;
}

const RAW_COLOR_RE = /:\s*[^;{}]*?(#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\()/g;

/**
 * Whether `source` (a pack-relative path straight out of pack.json) stays
 * inside `dir` once normalized. Rejects a leading `..` escape and an
 * absolute path outright, then double-checks the normalized join still
 * begins with `dir` plus a separator, so a `..` buried mid-path
 * (`./a/../../x.tsx`) cannot slip through either.
 */
function sourceResolvesInsidePack(dir, source) {
  if (isAbsolute(source)) return false;
  const normalized = normalize(source);
  if (normalized === '..' || normalized.startsWith(`..${sep}`)) return false;
  const resolved = normalize(join(dir, source));
  return resolved === dir || resolved.startsWith(`${dir}${sep}`);
}

/**
 * Strips CSS comments, then walks the rule tree by brace-matching so nested
 * at-rules (`@media`, `@container`, ...) are scanned recursively while
 * `@keyframes`/`@-webkit-keyframes` bodies (percentage/from/to selectors,
 * not real selectors) are skipped outright. Every remaining selector list
 * is split on top-level commas (parens tracked so `:is(a, b)` does not
 * split) and each resulting compound selector chain is checked for
 * `prefix` with `check`.
 */
function scanCssSelectors(text, prefix, check) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');

  function splitTopLevelCommas(selectorList) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of selectorList) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts.map((s) => s.trim()).filter(Boolean);
  }

  function walk(start, end) {
    let i = start;
    while (i < end) {
      const braceIdx = stripped.indexOf('{', i);
      if (braceIdx === -1 || braceIdx >= end) return;

      const prelude = stripped.slice(i, braceIdx).trim();

      let depth = 1;
      let j = braceIdx + 1;
      while (j < end && depth > 0) {
        if (stripped[j] === '{') depth++;
        else if (stripped[j] === '}') depth--;
        j++;
      }
      const bodyStart = braceIdx + 1;
      const bodyEnd = j - 1;

      if (prelude.startsWith('@')) {
        const atMatch = /^@(-\w+-)?([a-zA-Z-]+)/.exec(prelude);
        const atName = atMatch ? atMatch[2].toLowerCase() : '';
        if (atName !== 'keyframes') {
          // Not a selector list itself; its body may still hold real rules
          // (@media, @container, @layer, @supports), so recurse into it.
          walk(bodyStart, bodyEnd);
        }
        // @keyframes body holds percentage/from/to selectors, not element
        // selectors — skipped entirely, on purpose.
      } else if (prelude) {
        for (const selector of splitTopLevelCommas(prelude)) {
          check(selector);
        }
      }

      i = j;
    }
  }

  walk(0, stripped.length);
}

function validatePackFolder(folderName, dir) {
  const pack = folderName;
  // Compared against the global counter at the end so the "ok" line reports
  // THIS pack rather than the whole run: with a bare `errors === 0` test, one
  // failing pack silently suppresses the ok line of every pack after it.
  const errorsBefore = errors;
  const manifestPath = join(dir, 'pack.json');

  if (!existsSync(manifestPath)) {
    fail(pack, `missing pack.json`);
    return;
  }

  let manifestRaw;
  try {
    manifestRaw = readFileSync(manifestPath, 'utf8');
  } catch (err) {
    fail(pack, `cannot read pack.json: ${err.message}`);
    return;
  }

  const result = parsePackManifest(manifestRaw);
  if (!result.ok) {
    for (const e of result.errors) fail(pack, `pack.json: ${e}`);
    return;
  }

  for (const w of result.warnings) warn(pack, `pack.json: ${w}`);

  const manifest = result.manifest;

  if (manifest.name !== folderName) {
    fail(
      pack,
      `manifest name "${manifest.name}" does not match folder name "${folderName}"`,
    );
  }

  const components = packComponents(manifest);
  if (components.length === 0) {
    fail(pack, `manifest declares no resolvable components`);
  }

  // Object form required (not the string shorthand @markii/pack itself still
  // accepts), with a non-empty description and a valid kind — CONTRIBUTING.md
  // requires all three for every component so reviewers can see the kind
  // stated plainly. Read straight off the raw parsed manifest, since a
  // string-form entry never reaches `components` above as an object.
  for (const key of Object.keys(manifest.components)) {
    if (!Object.hasOwn(manifest.components, key)) continue;
    const entry = manifest.components[key];
    if (typeof entry === 'string') {
      fail(
        pack,
        `component "${key}" uses the string-shorthand form; pack.json must use the object form with "description" and "kind"`,
      );
      continue;
    }
    if (typeof entry.description !== 'string' || entry.description.length === 0) {
      fail(pack, `component "${key}" is missing a non-empty "description"`);
    }
    if (typeof entry.kind !== 'string' || !VALID_KINDS.has(entry.kind)) {
      fail(
        pack,
        `component "${key}" is missing a valid "kind" (must be "container", "leaf", or "inline")`,
      );
    }
  }

  for (const comp of components) {
    if (!sourceResolvesInsidePack(dir, comp.source)) {
      fail(
        pack,
        `component "${comp.localName}" source "${comp.source}" resolves outside the pack folder`,
      );
      continue;
    }
    const sourcePath = join(dir, comp.source);
    if (!existsSync(sourcePath)) {
      fail(pack, `component "${comp.localName}" source "${comp.source}" does not exist`);
    }
  }

  if (!existsSync(join(dir, 'README.md'))) {
    fail(pack, `missing README.md`);
  }

  if (!existsSync(join(dir, 'example.mk.md'))) {
    fail(pack, `missing example.mk.md`);
  }

  const cssFiles = existsSync(dir) ? listCssFiles(dir) : [];
  const prefix = `.mk-${manifest.name}_`;
  for (const cssFile of cssFiles) {
    const text = readFileSync(cssFile, 'utf8');
    const relative = cssFile.slice(dir.length + 1);

    // Selector scan: every selector in every rule (nested at-rule bodies
    // included, keyframe percentages excluded) must carry the pack's
    // namespace somewhere in the chain — a bare `pre {}` or `p {}` is
    // exactly what this catches, since it has no `.mk-` prefix at all.
    scanCssSelectors(text, prefix, (selector) => {
      if (!selector.includes(prefix)) {
        fail(
          pack,
          `${relative}: selector "${selector}" does not include "${prefix}"`,
        );
      }
    });

    // Raw color literal scan (warning only).
    let colorMatch;
    RAW_COLOR_RE.lastIndex = 0;
    while ((colorMatch = RAW_COLOR_RE.exec(text)) !== null) {
      warn(
        pack,
        `${relative}: possible raw color literal "${colorMatch[1]}" (use a --mk-* token or color-mix from one)`,
      );
    }
  }

  if (errors === errorsBefore) {
    ok(pack, `${components.length} component(s), manifest valid`);
  }
}

function discoverPacks() {
  if (!existsSync(packsDir)) return [];
  return readdirSync(packsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

const packNames = discoverPacks();

if (packNames.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
} else {
  for (const name of packNames) {
    validatePackFolder(name, join(packsDir, name));
  }
}

if (existsSync(templateDir) && statSync(templateDir).isDirectory()) {
  validatePackFolder('template', templateDir);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);

if (errors > 0) {
  process.exit(1);
}
