#!/usr/bin/env node
// Confirms every pack (and the template) actually bundles: each component
// source named in pack.json is run through esbuild with the same externals
// a real host build would use. Fails loudly with esbuild's own message on
// any error; prints "ok <pack>" per pack that bundles cleanly.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { parsePackManifest, packComponents } from '@markii/pack';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packsDir = join(rootDir, 'packs');
const templateDir = join(rootDir, 'template');

let hadError = false;

async function buildCheckPack(name, dir) {
  const manifestPath = join(dir, 'pack.json');
  if (!existsSync(manifestPath)) {
    // validate.mjs already reports this; skip here.
    return;
  }

  const result = parsePackManifest(readFileSync(manifestPath, 'utf8'));
  if (!result.ok) {
    // validate.mjs already reports this; skip here.
    return;
  }

  const components = packComponents(result.manifest);
  if (components.length === 0) return;

  let packHadError = false;

  for (const comp of components) {
    const entry = join(dir, comp.source);
    if (!existsSync(entry)) {
      // validate.mjs already reports this; skip here.
      continue;
    }
    try {
      await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        write: false,
        outdir: dir,
        jsx: 'automatic',
        format: 'esm',
        platform: 'browser',
        external: ['react', 'react-dom', '@markii/react'],
        loader: { '.css': 'css' },
        logLevel: 'silent',
      });
    } catch (err) {
      hadError = true;
      packHadError = true;
      console.error(`FAIL ${name}: ${comp.source} failed to build`);
      console.error(err.message);
      continue;
    }
  }

  if (!packHadError) {
    console.log(`ok ${name}`);
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
    await buildCheckPack(name, join(packsDir, name));
  }
}

if (existsSync(templateDir)) {
  await buildCheckPack('template', templateDir);
}

if (hadError) {
  process.exit(1);
}
