// The JSX factory every compiled component calls. Wired in through
// esbuild's `inject` option (see build-pack.mjs), which imports this
// module into every file that references `__markiiJSX` as a free
// variable. That is what puts the shim in scope for the component
// modules: a `var` written into the entry module alone is scoped to that
// module by the bundler (and tree-shaken away when the entry itself never
// uses it), leaving the components to look up a global that does not
// exist. Because the injected module lives inside the IIFE like every
// other module, no global is left behind.
//
// Getters, not values: React is read from `window.__markiiReact` at the
// moment a JSX expression evaluates, inside a component's render, never
// when the script loads (docs/packs.md, "What a prebuilt webview.js must
// do").
export var __markiiJSX = {
  get createElement() {
    return ((typeof window !== 'undefined' && window.__markiiReact) || {}).createElement;
  },
  get Fragment() {
    return ((typeof window !== 'undefined' && window.__markiiReact) || {}).Fragment;
  },
};
