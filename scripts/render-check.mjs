#!/usr/bin/env node
// Renders every pack's (and the template's) example.mk.md end to end
// through the real pipeline: compile the pack with @markii/pack-build,
// evaluate the built registration script with a stub host window to get the
// component modules, build a registry with @markii/react's loadPack
// (namespaced by the manifest) merged over defaultRegistry, and render with
// renderMark + react-dom/server's renderToStaticMarkup.
//
// Fails a pack whose rendered HTML contains an unknown-directive fallback,
// an empty-inline marker, or a data-bound failure-state class. Any of
// those means a directive in the example note did not resolve to the
// pack's own component the way a real host would render it. Exits 1 if
// any pack fails; prints "ok <pack>: rendered, N directives" per pack that
// renders cleanly.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import * as React from 'react';
import { loadPack, renderMark, mergeRegistries } from '@markii/react';
import { defaultRegistry } from '@markii/react/components';
import { renderToStaticMarkup } from 'react-dom/server';
import { discover, compile } from './pack-tools.mjs';

let hadError = false;

/**
 * The exact class-name hooks @markii/react's failure-presentation module
 * produces (grepped from node_modules/@markii/react/dist rather than
 * guessed): `mk-unknown` for an unresolved/mismatched directive,
 * `mk-inline-empty` for an inline component that received no content, and
 * the `--<failureKind>` suffixes `dataStateClassName` appends to a
 * data-bound component's root class for a genuine binding failure.
 */
const UNKNOWN_CLASS = 'mk-unknown';
const EMPTY_INLINE_CLASS = 'mk-inline-empty';
const FAILURE_KIND_CLASS_RE = /class="[^"]*\bmk-[\w-]+--(script-error|capability-denied|tier-blocked|limit)\b[^"]*"/;

/** A rough count of directive occurrences in `text`, for the "N directives" report line only: not used for correctness. */
function countDirectives(text) {
  const block = text.match(/(^|\n)[ \t]*(:::|::)[a-z][a-z0-9_-]*/g) ?? [];
  const inline = text.match(/(?<!:):[a-z][a-z0-9_-]*\[/g) ?? [];
  return block.length + inline.length;
}

/** Evaluates a built registration script against a stub host window and returns the component modules it registers. */
function registeredModules(js) {
  let modules;
  const sandbox = {
    window: {
      __markiiReact: React,
      __markiiRegisterPack: (_manifestJson, componentModules) => {
        modules = componentModules;
      },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { timeout: 5000 });
  return modules;
}

async function renderCheckPack(pack) {
  const name = pack.manifest.name;
  const manifest = pack.manifest;
  const examplePath = join(pack.folder, 'example.mk.md');
  if (!existsSync(examplePath)) return; // validate.mjs already reports this

  const { outcome, js } = await compile(pack);
  if (outcome.kind !== 'built') {
    hadError = true;
    console.error(`FAIL ${name}: components failed to build for render-check`);
    if (outcome.kind === 'failed') console.error(outcome.reason);
    return;
  }

  let componentModules;
  try {
    componentModules = registeredModules(js);
  } catch (err) {
    hadError = true;
    console.error(`FAIL ${name}: built script failed to evaluate`);
    console.error(err instanceof Error ? err.stack : String(err));
    return;
  }

  const loaded = loadPack(manifest, componentModules);
  if (loaded.dropped) {
    hadError = true;
    console.error(
      `FAIL ${name}: pack declares engine "${loaded.dropped.engine}", which @markii/react cannot run`,
    );
    return;
  }
  const registry = mergeRegistries(defaultRegistry, loaded.registry);

  const exampleText = readFileSync(examplePath, 'utf8');
  let html;
  try {
    html = renderToStaticMarkup(renderMark(exampleText, registry));
  } catch (err) {
    hadError = true;
    console.error(`FAIL ${name}: example.mk.md failed to render`);
    console.error(err instanceof Error ? err.stack : String(err));
    return;
  }

  const problems = [];
  if (html.includes(UNKNOWN_CLASS)) {
    problems.push(`contains "${UNKNOWN_CLASS}" (unresolved or form-mismatched directive)`);
  }
  if (html.includes(EMPTY_INLINE_CLASS)) {
    problems.push(`contains "${EMPTY_INLINE_CLASS}" (inline component received no content)`);
  }
  const failureMatch = FAILURE_KIND_CLASS_RE.exec(html);
  if (failureMatch) {
    problems.push(`contains a data-bound failure class ("--${failureMatch[1]}")`);
  }

  if (problems.length > 0) {
    hadError = true;
    console.error(`FAIL ${name}: example.mk.md rendered with problems:`);
    for (const p of problems) console.error(`  - ${p}`);
    return;
  }

  console.log(`ok ${name}: rendered, ${countDirectives(exampleText)} directives`);
}

const { packs, skipped } = await discover();
for (const s of skipped) {
  hadError = true;
  console.error(`FAIL ${s.folder}: ${s.reason}`);
}
if (packs.length === 0 && skipped.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
}
for (const pack of packs) {
  await renderCheckPack(pack);
}

if (hadError) {
  process.exit(1);
}
