// Compiles one pack's `.tsx` sources into its prebuilt `webview.js` form.
//
// This implements the documented registration contract in the main Markii
// repository's docs/packs.md, under "What a prebuilt webview.js must do".
// That section is the authority for the shape this file has to produce: an
// IIFE, no globals left behind beyond one call, that call being
// `window.__markiiRegisterPack(manifestJson, componentModules)` with
// `manifestJson` set to the pack's own `pack.json` content and
// `componentModules` mapping each declared component's local name to
// `{ component, inline? }`; React read only from `window.__markiiReact` /
// `window.__markiiReactDom`, and only from inside a function that runs at
// render time, never at the top of the script.
//
// docs/packs.md is explicit that this is a contract any toolchain can
// target, not one implementation's private format: "A webview.js is not an
// opaque artifact of one toolchain. It is a contract, so a pack author with
// their own build can produce one." This is that other build. It uses only
// `esbuild` (already a devDependency here), through the ordinary Node API
// rather than esbuild-wasm's in-process WebAssembly path, since this script
// runs under plain Node in CI and needs no workaround for a host runtime
// with no filesystem or no `node` binary.
//
// npm run check's register-check.mjs step guards this against silent
// drift: it loads the built script, stubs the registration call, and
// fails the check if the contract above is not met exactly.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import * as esbuild from 'esbuild';
import { parsePackManifest, packComponents } from '@markii/pack';

const REACT_KEYS = [
  'Children', 'Component', 'Fragment', 'Profiler', 'PureComponent',
  'StrictMode', 'Suspense', 'act', 'cloneElement', 'createContext',
  'createElement', 'createFactory', 'createRef', 'forwardRef',
  'isValidElement', 'lazy', 'memo', 'startTransition', 'unstable_act',
  'useCallback', 'useContext', 'useDebugValue', 'useDeferredValue',
  'useEffect', 'useId', 'useImperativeHandle', 'useInsertionEffect',
  'useLayoutEffect', 'useMemo', 'useReducer', 'useRef', 'useState',
  'useSyncExternalStore', 'useTransition', 'version',
];

const REACT_DOM_KEYS = [
  'createPortal', 'findDOMNode', 'flushSync', 'hydrate', 'render',
  'unmountComponentAtNode', 'unstable_batchedUpdates',
  'unstable_renderSubtreeIntoContainer', 'version',
];

const REACT_DOM_CLIENT_KEYS = ['createRoot', 'hydrateRoot'];

const LAZY_GLOBAL_MODULES = new Map([
  ['react', { globalName: '__markiiReact', keys: REACT_KEYS }],
  ['react-dom', { globalName: '__markiiReactDom', keys: REACT_DOM_KEYS }],
  [
    'react-dom/client',
    { globalName: '__markiiReactDom', keys: REACT_DOM_CLIENT_KEYS },
  ],
]);

const LAZY_GLOBAL_NAMESPACE = 'markii-lazy-global';

function lazyGlobalModuleSource(globalName, keys) {
  return [
    `function __markiiTarget() { return (typeof window !== 'undefined' && window[${JSON.stringify(globalName)}]) || {}; }`,
    `var __markiiKeys = ${JSON.stringify(keys)};`,
    'module.exports = new Proxy({}, {',
    '  get(_t, prop) {',
    '    if (__markiiKeys.indexOf(prop) === -1) return undefined;',
    '    return __markiiTarget()[prop];',
    '  },',
    '  has(_t, prop) { return __markiiKeys.indexOf(prop) !== -1; },',
    '  ownKeys() { return __markiiKeys; },',
    '  getOwnPropertyDescriptor(_t, prop) {',
    '    if (__markiiKeys.indexOf(prop) === -1) return undefined;',
    '    return { enumerable: true, configurable: true };',
    '  },',
    '});',
  ].join('\n');
}

/**
 * Redirects `import ... from 'react'` (and 'react-dom', 'react-dom/client')
 * to a lazy Proxy over the matching `window.__markii*` global, so the
 * compiled script never bundles its own copy of React and never reads the
 * global outside a property-access trap (i.e. not at script-load time,
 * only when a component actually renders).
 */
function lazyGlobalModulePlugin() {
  const specifiers = new Set(LAZY_GLOBAL_MODULES.keys());
  return {
    name: 'markii-lazy-global',
    setup(build) {
      build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => {
        if (!specifiers.has(args.path)) return undefined;
        return { path: args.path, namespace: LAZY_GLOBAL_NAMESPACE };
      });
      build.onLoad({ filter: /.*/, namespace: LAZY_GLOBAL_NAMESPACE }, (args) => {
        const entry = LAZY_GLOBAL_MODULES.get(args.path) ?? {
          globalName: '__markiiReact',
          keys: REACT_KEYS,
        };
        return {
          contents: lazyGlobalModuleSource(entry.globalName, entry.keys),
          loader: 'js',
        };
      });
    },
  };
}

// Written into `entrySource` itself (not passed as esbuild's `banner`
// option): a `banner` is prepended OUTSIDE the `format: 'iife'` wrapper,
// which would leave `__markiiJSX` as a real global — exactly what
// docs/packs.md's "must not leave globals behind beyond the one call it
// makes" rules out. Folded into the same source esbuild bundles, it stays
// inside the wrapper along with everything else.
const REACT_SHIM_SOURCE = [
  'var __markiiJSX = {',
  "  get createElement() { return (typeof window !== 'undefined' && window.__markiiReact || {}).createElement; },",
  "  get Fragment() { return (typeof window !== 'undefined' && window.__markiiReact || {}).Fragment; },",
  '};',
].join('\n');

function orderedComponents(manifest, dir) {
  const result = [];
  for (const listing of packComponents(manifest)) {
    const sourcePath = join(dir, listing.source);
    if (!existsSync(sourcePath)) continue;
    result.push({ localName: listing.localName, sourcePath, kind: listing.kind });
  }
  return result;
}

function entrySource(manifestRawText, components) {
  const imports = components
    .map((c, i) => `import * as __markiiMod${i} from ${JSON.stringify(c.sourcePath)};`)
    .join('\n');
  const picks = components
    .map((c, i) => `  ${JSON.stringify(c.localName)}: __markiiPick(__markiiMod${i}),`)
    .join('\n');
  // The pack's own pack.json content, verbatim — docs/packs.md: "manifestJson
  // is the pack's own pack.json content." Embedding the raw file text (not
  // a re-stringified, re-parsed manifest object) means a field the current
  // @markii/pack parser does not yet know about, such as `version`, still
  // reaches a host or a `.mkp` consumer reading this script directly.
  const manifestJsonLiteral = JSON.stringify(manifestRawText);
  const inlineNames = components
    .filter((c) => c.kind === 'inline')
    .map((c) => c.localName);
  const inlineMapLiteral = JSON.stringify(
    Object.fromEntries(inlineNames.map((name) => [name, true])),
  );

  return [
    imports,
    '',
    REACT_SHIM_SOURCE,
    '',
    'function __markiiPick(mod) {',
    "  if (mod && typeof mod['default'] === 'function') return mod['default'];",
    '  for (var key in mod) {',
    "    if (Object.prototype.hasOwnProperty.call(mod, key) && typeof mod[key] === 'function') return mod[key];",
    '  }',
    '  return undefined;',
    '}',
    '',
    'var __markiiComponents = {',
    picks,
    '};',
    '',
    "if (typeof window !== 'undefined' && typeof window.__markiiRegisterPack === 'function') {",
    '  var __markiiEntries = {};',
    `  var __markiiInline = ${inlineMapLiteral};`,
    '  for (var __markiiLocalName in __markiiComponents) {',
    '    if (!Object.prototype.hasOwnProperty.call(__markiiComponents, __markiiLocalName)) continue;',
    "    if (typeof __markiiComponents[__markiiLocalName] !== 'function') continue;",
    '    __markiiEntries[__markiiLocalName] = { component: __markiiComponents[__markiiLocalName], inline: __markiiInline[__markiiLocalName] === true };',
    '  }',
    `  window.__markiiRegisterPack(${manifestJsonLiteral}, __markiiEntries);`,
    '}',
    '',
  ].join('\n');
}

/**
 * Compiles the pack at `dir` (its `pack.json` must already be valid — this
 * does not re-validate) into its prebuilt registration script. Returns
 * `{ js, css }`, where `css` is `undefined` when no component pulled in any
 * CSS.
 */
export async function buildPrebuiltPack(dirArg) {
  // Component import specifiers are written out as this absolute path
  // (see `entrySource`); esbuild treats anything that does not start with
  // "./"/"../" as a bare (node_modules) specifier, so a relative `dirArg`
  // would silently fail to resolve.
  const dir = resolve(dirArg);
  const manifestRaw = readFileSync(join(dir, 'pack.json'), 'utf8');
  const result = parsePackManifest(manifestRaw);
  if (!result.ok) {
    throw new Error(`invalid pack.json in ${dir}: ${result.errors.join('; ')}`);
  }
  const manifest = result.manifest;
  const components = orderedComponents(manifest, dir);

  const build = await esbuild.build({
    stdin: {
      contents: entrySource(manifestRaw, components),
      resolveDir: dir,
      sourcefile: `${manifest.name}-pack-entry.js`,
      loader: 'js',
    },
    bundle: true,
    write: false,
    outdir: dir,
    entryNames: 'webview',
    format: 'iife',
    platform: 'browser',
    target: 'chrome122',
    jsx: 'transform',
    jsxFactory: '__markiiJSX.createElement',
    jsxFragment: '__markiiJSX.Fragment',
    tsconfigRaw: '{}',
    plugins: [lazyGlobalModulePlugin()],
    loader: { '.css': 'css' },
    logLevel: 'silent',
  });

  const outputFiles = build.outputFiles ?? [];
  let js;
  let css;
  for (const file of outputFiles) {
    if (extname(file.path) === '.css') {
      css = file.text;
    } else {
      js = file.text;
    }
  }
  if (js === undefined) {
    throw new Error(`pack at ${dir} produced no script output`);
  }
  return { js, css, manifest };
}
