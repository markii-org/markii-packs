#!/usr/bin/env node
// Confirms every pack (and the template) actually bundles: each component
// source named in pack.json is run through esbuild with the same externals
// a real host build would use — only `react` and `react-dom`, matching the
// real pack builder in @markii/host (packages/markii-host/src/packs/
// pack-build.ts). Marking a package "external" only stops esbuild from
// bundling it WHEN it is also the one thing resolution finds — it does not
// stop esbuild from happily resolving and inlining any OTHER installed
// package a component imports, such as `@markii/react` itself, which is
// simply present in this repo's node_modules. The real host builder never
// hits that case because its resolver plugin only knows two things: the
// pack's own relative files, and the two lazy globals; nothing else
// resolves at all. `onlyDeclaredExternalsPlugin` below reproduces that
// narrower rule with a plugin, so a value import of `@markii/react` (or any
// other bare specifier) fails here instead of silently bundling a second
// copy of it that the real host's pack runtime has no way to load.
//
// Fails loudly with esbuild's own message on any error; prints
// "ok <pack>" per pack that bundles cleanly.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { parsePackManifest, packComponents } from '@markii/pack';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packsDir = join(rootDir, 'packs');
const templateDir = join(rootDir, 'template');

const ALLOWED_EXTERNALS = ['react', 'react-dom'];

/**
 * Rejects any bare (non-relative, non-absolute) import specifier that
 * isn't `react`, `react-dom`, or a subpath of either (`react/jsx-runtime`,
 * `react-dom/server`, ...). Relative imports (`./guard.js`, `../x.css`)
 * and absolute entry points are left alone — this only intercepts the
 * bare-specifier shape a package name takes.
 */
function onlyDeclaredExternalsPlugin(allowed) {
  return {
    name: 'only-declared-externals',
    setup(build) {
      build.onResolve({ filter: /^[^./]/ }, (args) => {
        const isAllowed = allowed.some(
          (name) => args.path === name || args.path.startsWith(`${name}/`),
        );
        if (isAllowed) return undefined; // defer to esbuild's `external` handling
        return {
          errors: [
            {
              text: `import "${args.path}" is not allowed in a pack component; only relative imports and ${allowed.join(', ')} are permitted (see CONTRIBUTING.md)`,
            },
          ],
        };
      });
    },
  };
}

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
        external: ALLOWED_EXTERNALS,
        plugins: [onlyDeclaredExternalsPlugin(ALLOWED_EXTERNALS)],
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
