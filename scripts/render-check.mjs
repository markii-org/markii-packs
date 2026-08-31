#!/usr/bin/env node
// Renders every pack's (and the template's) example.mk.md end to end
// through the real pipeline: bundle the pack's components with esbuild
// (write:false, the same plugin setup as build-check.mjs — only `react`
// and `react-dom` resolve, everything else bare is rejected), evaluate the
// bundle to get the component modules, build a registry with
// @markii/react's loadPack (namespaced by the manifest) merged over
// defaultRegistry, and render with renderMark + react-dom/server's
// renderToStaticMarkup.
//
// Fails a pack whose rendered HTML contains an unknown-directive fallback,
// an empty-inline marker, or a data-bound failure-state class — any of
// those means a directive in the example note did not resolve to the
// pack's own component the way a real host would render it. Exits 1 if
// any pack fails; prints "ok <pack>: rendered, N directives" per pack that
// renders cleanly.

import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { parsePackManifest, packComponents } from '@markii/pack';
import { renderMark, loadPack, mergeRegistries } from '@markii/react';
import { defaultRegistry } from '@markii/react/components';
import { renderToStaticMarkup } from 'react-dom/server';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packsDir = join(rootDir, 'packs');
const templateDir = join(rootDir, 'template');

// Written inside the repo (not the OS temp dir) so bare specifiers like
// `react` resolve against THIS project's node_modules when the bundle is
// imported — a module under `/tmp` has no node_modules to walk up to.
// Cleaned up (whole directory) after every run, success or failure.
const tmpRoot = mkdtempSync(join(rootDir, '.render-check-'));

const ALLOWED_EXTERNALS = ['react', 'react-dom'];

/**
 * Same rule as build-check.mjs's `onlyDeclaredExternalsPlugin`: a bare
 * import that isn't `react`, `react-dom`, or a subpath of either is
 * rejected rather than silently bundled from this repo's node_modules —
 * matching what the real host builder's resolver plugin allows.
 */
function onlyDeclaredExternalsPlugin(allowed) {
  return {
    name: 'only-declared-externals',
    setup(build) {
      build.onResolve({ filter: /^[^./]/ }, (args) => {
        const isAllowed = allowed.some(
          (name) => args.path === name || args.path.startsWith(`${name}/`),
        );
        if (isAllowed) return undefined;
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

/** A rough count of directive occurrences in `text`, for the "N directives" report line only — not used for correctness. */
function countDirectives(text) {
  const block = text.match(/(^|\n)[ \t]*(:::|::)[a-z][a-z0-9_-]*/g) ?? [];
  const inline = text.match(/(?<!:):[a-z][a-z0-9_-]*\[/g) ?? [];
  return block.length + inline.length;
}

/**
 * Builds one synthetic entry module that imports every declared component
 * and picks its exported component function the same way @markii/host's
 * real pack builder does (packages/markii-host/src/packs/pack-build.ts's
 * `__markiiPick`): a `default` export if it is a function, otherwise the
 * first function-typed export. The pack author's export style (named or
 * default) is a host concern, not a convention this repo documents, so
 * render-check has to match the real builder rather than assume one style.
 */
async function bundlePackComponents(dir, manifest, components) {
  const imports = components
    .map((c, i) => `import * as __markiiMod${i} from ${JSON.stringify(join(dir, c.source))};`)
    .join('\n');
  const inlineNames = new Set(
    components.filter((c) => c.kind === 'inline').map((c) => c.localName),
  );
  const entries = components
    .map(
      (c, i) =>
        `  ${JSON.stringify(c.localName)}: { component: __markiiPick(__markiiMod${i}), inline: ${inlineNames.has(c.localName)} },`,
    )
    .join('\n');

  const entrySource = [
    imports,
    '',
    'function __markiiPick(mod) {',
    "  if (mod && typeof mod['default'] === 'function') return mod['default'];",
    '  for (var key in mod) {',
    "    if (Object.prototype.hasOwnProperty.call(mod, key) && typeof mod[key] === 'function') return mod[key];",
    '  }',
    '  return undefined;',
    '}',
    '',
    'export const __markiiEntries = {',
    entries,
    '};',
    '',
  ].join('\n');

  const result = await esbuild.build({
    stdin: {
      contents: entrySource,
      resolveDir: dir,
      sourcefile: 'render-check-entry.tsx',
      loader: 'tsx',
    },
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

  const jsOutput = result.outputFiles.find((f) => f.path.endsWith('.js'));
  if (!jsOutput) {
    throw new Error('esbuild produced no JS output');
  }
  return jsOutput.text;
}

async function renderCheckPack(name, dir) {
  const manifestPath = join(dir, 'pack.json');
  if (!existsSync(manifestPath)) return; // validate.mjs already reports this
  const result = parsePackManifest(readFileSync(manifestPath, 'utf8'));
  if (!result.ok) return; // validate.mjs already reports this

  const manifest = result.manifest;
  const components = packComponents(manifest);
  if (components.length === 0) return;

  const examplePath = join(dir, 'example.mk.md');
  if (!existsSync(examplePath)) return; // validate.mjs already reports this

  let bundleText;
  try {
    bundleText = await bundlePackComponents(dir, manifest, components);
  } catch (err) {
    hadError = true;
    console.error(`FAIL ${name}: components failed to bundle for render-check`);
    console.error(err.message);
    return;
  }

  const tmpFile = join(tmpRoot, `${name}.mjs`);
  writeFileSync(tmpFile, bundleText, 'utf8');

  let mod;
  try {
    mod = await import(pathToFileURL(tmpFile).href);
  } catch (err) {
    hadError = true;
    console.error(`FAIL ${name}: bundled components failed to evaluate`);
    console.error(err instanceof Error ? err.stack : String(err));
    return;
  }

  const componentModules = mod.__markiiEntries;
  const registry = mergeRegistries(defaultRegistry, loadPack(manifest, componentModules));

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

function discoverPacks() {
  if (!existsSync(packsDir)) return [];
  return readdirSync(packsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

try {
  const packNames = discoverPacks();
  if (packNames.length === 0) {
    console.log('no packs yet (packs/ is empty or missing)');
  } else {
    for (const name of packNames) {
      await renderCheckPack(name, join(packsDir, name));
    }
  }

  if (existsSync(templateDir)) {
    await renderCheckPack('template', templateDir);
  }
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

if (hadError) {
  process.exit(1);
}
