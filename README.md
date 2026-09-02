# markii-packs

Curated component packs for [Markii](https://github.com/markii-org/markii).
Each pack covers one job: a dashboard, a blog, a habit tracker, a finance
sheet. Point your editor at a pack's folder, type its prefixed directive,
and the component renders in your notes.

```markdown
::track_streak{data=days weeks=12 label="Meditation"}
```

## Use a pack

How you install a pack depends on your host.

In **VS Code**, either works. Clone or download this repository and add a
pack's folder path to the `markii.packs` setting, which lives in your user
settings only, so opening someone else's project cannot install code on
your behalf. Or run "Markii: Install Pack from File…" and point it at a
`.mkp` archive. Each release on this repository's GitHub releases page
carries one `.mkp` per pack, so that command is the quickest way to add
one without cloning anything.

In **Obsidian**, a `.mkp` archive is the only way in: run "Install Markii
pack from file" and pick the archive. Obsidian has no setting for pointing
at an arbitrary folder on disk; the plugin manages installed packs itself,
stored per device rather than in the vault, so syncing a vault never
carries your decisions about what may run.

Either way, once a pack is installed, write the directive. A pack
component's name is the pack name, an underscore, and the key from
`pack.json`: pack `track` plus component `streak` is `::track_streak`.

[The pack contract](https://github.com/markii-org/markii/blob/main/docs/packs.md)
in the main repository covers folder scanning, prefixed names, and the
prebuilt form in full. Each pack here ships a README with its own
directives and attributes, and an `example.mk.md` you can open directly.

## Packs

| Pack | Components |
| --- | --- |
| [blog](packs/blog/) | `header`, `byline`, `pullquote`, `aside` |
| [track](packs/track/) | `streak`, `ring`, `habits`, `log` |
| [fin](packs/fin/) | `ticker`, `holdings`, `allocation` |
| [tech](packs/tech/) | `compare`, `pane`, `diff`, `method`, `status`, `verified`, `tradeoff`, `pros`, `cons` |
| [schema](packs/schema/) | `schema`, `col`, `pipeline`, `stage`, `fact` |

All five are maintained by markii-org.

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
