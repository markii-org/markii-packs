#!/usr/bin/env node
// Validates every pack in packs/ (and the template) against the pack
// contract: a well-formed pack.json, sources that exist, a README and an
// example note, prefixed CSS selectors, and a scan for raw color literals.
//
// Exits 1 if any check fails. Warnings (raw colors) are printed but do not
// fail the run.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePackManifest, packComponents } from '@markii/pack';

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

  for (const comp of components) {
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

    // Selector scan: look at each rule's selector list (text before `{`).
    const ruleRe = /([^{}]+)\{/g;
    let match;
    while ((match = ruleRe.exec(text)) !== null) {
      const selectorList = match[1];
      // Skip at-rules (media queries, keyframes, etc.) which are not selectors.
      if (/^\s*@/.test(selectorList)) continue;
      const selectors = selectorList.split(',').map((s) => s.trim()).filter(Boolean);
      for (const selector of selectors) {
        if (!selector.startsWith('.mk-')) continue;
        if (!selector.startsWith(prefix)) {
          fail(
            pack,
            `${relative}: selector "${selector}" does not start with "${prefix}"`,
          );
        }
      }
    }

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
