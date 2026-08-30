---
title: Template pack demo
uses: [template]
---

# Template pack demo

::template_hello{name="Markii"}

The `uses:` list above is informative. It lets a host say "this note wants
the `template` pack, which is not installed" instead of showing an
unexplained fallback box. Delete the directive and the note still reads as
plain markdown.
