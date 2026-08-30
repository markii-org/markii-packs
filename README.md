# markii-packs

Curated component packs for [Markii](https://github.com/markii-org/markii).
Each pack covers one job: a dashboard, a blog, a habit tracker, a finance
sheet. Point your editor at a pack's folder, type its prefixed directive,
and the component renders in your notes.

```markdown
::dash_gauge{value=72 label="CPU"}
```

## Use a pack

1. Download or clone this repository, or copy out the single folder under
   `packs/` that you want.
2. Tell your host where that folder is. In VS Code, add the path to the
   `markii.packs` setting, which is read from your user settings only, so
   opening someone else's project cannot install code on your behalf. In
   Obsidian, add it to the plugin's pack folders, which are stored per
   device rather than in the vault, so syncing a vault does not carry your
   decisions about what may run.
3. Write the directive. A pack component's name is the pack name, an
   underscore, and the key from `pack.json`: pack `dash` plus component
   `gauge` is `::dash_gauge`.

[The pack contract](https://github.com/markii-org/markii/blob/main/docs/packs.md)
in the main repository covers folder scanning, prefixed names, and the
prebuilt form in full. Each pack here ships a README with its own
directives and attributes, and an `example.mk.md` you can open directly.

## Packs

| Pack | Components |
| --- | --- |
| [dash](packs/dash/) | `sparkline`, `gauge`, `status`, `uptime`, `delta` |
| [blog](packs/blog/) | `header`, `byline`, `pullquote`, `aside` |
| [track](packs/track/) | `streak`, `ring`, `habits`, `log` |
| [fin](packs/fin/) | `ticker`, `holdings`, `allocation` |

All four are maintained by markii-org.

## Publish your own pack

`template/` is a one-component pack to copy. Packs here are reviewed
against a fixed list: components you built yourself, theme tokens instead
of raw colors, and no throwing on bad data. [CONTRIBUTING.md](CONTRIBUTING.md)
has the rules and the submission flow.

To hand a pack to someone who is not going to clone a repository, VS Code's
"Markii: Export Pack" command compiles it and writes the distributable
folder somewhere else.

## License

MIT, see [LICENSE](LICENSE). The format, the spec, and the reference
renderers live in the
[main Markii repository](https://github.com/markii-org/markii).
