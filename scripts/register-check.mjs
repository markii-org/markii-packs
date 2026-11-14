#!/usr/bin/env node
// Guards the registration contract in the main repo's docs/packs.md
// ("What a prebuilt webview.js must do") against silent drift in
// the shared compiler, @markii/pack-build,. For every pack (and the template), this builds
// the prebuilt script and asserts, against a real evaluation of that
// script (not a read of its source text), that:
//
//   - loading it with `window.__markiiReact` left undefined does not
//     throw (the lazy-React rule: reading React only happens inside a
//     function that runs at render time, never at load time);
//   - it calls `window.__markiiRegisterPack(manifestJson, componentModules)`
//     exactly once;
//   - `manifestJson` is this pack's own `pack.json` content, verbatim;
//   - `componentModules` has, for every LOCAL name `pack.json` declares, an
//     own-property entry whose `component` is a function and whose
//     `inline`, when present, is a boolean;
//   - loading it leaves no global behind (the IIFE rule: the JSX shim and
//     everything else the build needs stays inside the wrapper);
//   - every registered component RENDERS through the real React set on
//     `window.__markiiReact`, with empty attributes, without throwing. A
//     component that registers but throws on render (a JSX shim scoped
//     out of reach of the component modules did exactly that once,
//     `__markiiJSX is not defined`, and left every note blank in Obsidian)
//     is caught here rather than in a host.
//
// A contract change that breaks any of this: the register call dropped,
// renamed, called with the wrong shape, or React read eagerly: fails
// `npm run check` here rather than shipping a pack that loads and
// registers nothing.

import { readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import vm from 'node:vm';
import { packComponents } from '@markii/pack';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { discover, compile } from './pack-tools.mjs';

let hadError = false;

function fail(name, message) {
  console.error(`FAIL ${name}: ${message}`);
  hadError = true;
}

function ok(name, message) {
  console.log(`ok   ${name}: ${message}`);
}

/** Evaluates `js` in a fresh, isolated context with `window` set to `windowShape`. Returns the names of globals the script left behind on that context; throws whatever the script throws. */
function evaluate(js, windowShape) {
  const sandbox = { window: windowShape };
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { timeout: 5000 });
  return Object.keys(sandbox).filter((key) => key !== 'window');
}

async function checkPack(pack) {
  const name = pack.manifest.name;
  const dir = pack.folder;
  const { outcome, js } = await compile(pack);
  if (outcome.kind !== 'built') {
    fail(name, `failed to build prebuilt script: ${outcome.kind === 'failed' ? outcome.reason : 'nothing was built'}`);
    return;
  }

  // The lazy-React rule: loading the script alone, with window.__markiiReact
  // (and no register function) left undefined, must not throw.
  try {
    evaluate(js, {});
  } catch (err) {
    fail(
      name,
      `webview.js threw while loading with window.__markiiReact undefined: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  // The registration call itself, captured with a stub. The real React is
  // set on the window the way a host does it, so the render pass below
  // exercises the same lazy reads a host would.
  const calls = [];
  let leaked = [];
  const hostWindow = {
    __markiiReact: React,
    __markiiRegisterPack: (manifestJson, componentModules) => {
      calls.push({ manifestJson, componentModules });
    },
  };
  try {
    leaked = evaluate(js, hostWindow);
  } catch (err) {
    fail(
      name,
      `webview.js threw while calling window.__markiiRegisterPack: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  if (calls.length !== 1) {
    fail(name, `expected exactly one window.__markiiRegisterPack call, got ${calls.length}`);
    return;
  }
  const { manifestJson, componentModules } = calls[0];

  if (leaked.length > 0) {
    fail(name, `webview.js left global(s) behind: ${leaked.join(', ')}`);
  }

  if (typeof manifestJson !== 'string') {
    fail(name, `manifestJson argument is not a string`);
    return;
  }

  const rawManifestText = readFileSync(join(dir, 'pack.json'), 'utf8');
  if (manifestJson !== rawManifestText) {
    fail(name, `manifestJson does not match this pack's pack.json content verbatim`);
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestJson);
  } catch (err) {
    fail(name, `manifestJson is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (manifest.name !== basename(dir)) {
    fail(name, `registered manifest name "${manifest.name}" does not match its folder "${basename(dir)}"`);
  }

  if (componentModules === null || typeof componentModules !== 'object') {
    fail(name, `componentModules argument is not an object`);
    return;
  }

  const declared = packComponents(manifest);
  for (const { localName } of declared) {
    if (!Object.hasOwn(componentModules, localName)) {
      fail(name, `componentModules is missing an own-property entry for declared component "${localName}"`);
      continue;
    }
    const entry = componentModules[localName];
    if (entry === null || typeof entry !== 'object') {
      fail(name, `componentModules["${localName}"] is not an object`);
      continue;
    }
    if (!Object.hasOwn(entry, 'component') || typeof entry.component !== 'function') {
      fail(name, `componentModules["${localName}"].component is not a function`);
    }
    if (Object.hasOwn(entry, 'inline') && typeof entry.inline !== 'boolean') {
      fail(name, `componentModules["${localName}"].inline is present but not a boolean`);
    }
    if (typeof entry.component === 'function') {
      try {
        renderToStaticMarkup(
          React.createElement(entry.component, { attributes: {}, children: null }),
        );
      } catch (err) {
        fail(
          name,
          `component "${localName}" threw while rendering through the prebuilt script: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  ok(name, `webview.js registers ${declared.length} component(s), lazy-React load is clean, no globals leaked, every component renders`);
}

const { packs, skipped } = await discover();
for (const s of skipped) fail(s.folder, s.reason);

if (packs.length === 0 && skipped.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
}
for (const pack of packs) {
  await checkPack(pack);
}

if (hadError) {
  process.exit(1);
}
