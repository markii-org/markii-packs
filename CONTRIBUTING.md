# Contributing a pack

This is a curated collection. Every pack merged here is reviewed against
the rules below. Read
[docs/packs.md](https://github.com/markii-org/markii/blob/main/docs/packs.md)
in the main repository first: it defines the pack contract this repo builds
on.

## What gets accepted

A pack that does one use case well. "Dashboard widgets", "blog helpers",
"habit tracking" are pack-sized. "Everything a note might ever need" is
not, and gets asked to split.

Components are built here, not imported. No third-party UI library, no
charting library. A chart is hand-rolled SVG, the way `@markii/react`'s own
`chart` is. This follows the main project's rule: a component can never
break because an upstream package did.

A pack has to work in both reference hosts, VS Code and Obsidian. If it
only runs in one, it is not ready.

## Hard rules

- Every color comes from a `--mk-*` token, or a `color-mix` derived from
  one. A hardcoded hex looks fine while you write it and breaks the moment
  someone opens the note in a different theme. A genuinely theme-invariant
  brand color, a logo mark for example, is the one exception, and it should
  be rare. The packs here carry no literal color at all, including no
  `var(--mk-fg, #hex)` fallbacks: in a host the tokens always exist.
- Every CSS selector starts with `.mk-<pack>_`. Two installed packs can
  never share a namespace, so a consistent prefix keeps their stylesheets
  apart too.
- No outer margins on a component root. The document stylesheet owns
  vertical rhythm between blocks; a component that adds its own margin
  fights it.
- A component never throws on hostile or missing bound data. A missing or
  malformed binding renders a quiet empty state with the reason in a
  `title` tooltip, never a crash and never an error dump in the page. A
  bound value can be a revoked `Proxy` or an object whose getters throw, so
  run the whole extraction inside one try/catch and let only primitives out
  of it. `packs/dash/guard.ts` is the shared pattern.
- Manifest keys are bare component names, without the pack prefix.
  `pack.json`'s `components` map uses the name inside the pack (`gauge`,
  not `dash-gauge`); the host joins the pack name and the key with an
  underscore to build the directive. A key that already carries the prefix
  produces a directive nobody can type correctly.
- Imports are limited to `react`, type-only imports from `@markii/react`,
  and the pack's own files. Nothing else.
- Prefer one short word for a pack name. `dash_gauge` reads at a glance; a
  long compound name is noisy every time someone types it.

## Required files per pack

```
packs/<name>/
  pack.json       object form: every component has a description and a kind
  <sources>       the component files the manifest names
  README.md       see template/README.md
  example.mk.md   a demo note using the pack's directives
```

`pack.json` must use the object form for every component entry, with
`description` and `kind` filled in. The underlying format treats `kind` as
optional; here it is required, because reviewers need to see `leaf`,
`container`, or `inline` stated plainly.

Write the directives in your README and example the way the declared kind
requires: `:name[text]{attrs}` for `inline`, `::name{attrs}` for `leaf`,
and a fenced `:::name{attrs} ... :::` block for `container`. A snippet in
the wrong form teaches every reader the wrong thing, and the renderer
falls back to a labeled box for a block component written inline.

The per-pack README is one screen: a one-line intro, a table of the pack's
directives, and a short snippet plus attribute list per component. Add the
expected shape of the bound value for anything that reads `data=`. Copy
`template/README.md`.

## Submission flow

1. Fork this repository.
2. Add your pack under `packs/<name>/`. Copy `template/` if that beats
   starting from an empty folder.
3. Run `npm install`, then `npm run check`. That validates your manifest,
   type-checks every component, confirms each one bundles, and renders your
   pack's `example.mk.md` through the same registry a host builds at
   install time. The render step catches what bundling alone cannot: a
   directive name that does not match what `pack.json` declares, a
   component exported in a form the loader cannot find, or a form mismatch
   between how a component is written in the example (inline vs. block)
   and the `kind` it declares. It must end with zero errors and zero
   warnings.
4. Open a pull request. CI runs the same `npm run check`.
5. A maintainer reviews against the rules above. Acceptance adds your pack
   to the index in `README.md`.

## Versioning and updates

There is no version field per pack; a pack is updated by a PR against its
own folder. If an update renames a directive or changes an attribute in a
way that breaks existing notes, say so in the PR description.
