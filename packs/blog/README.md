# blog

Masthead, byline, pullquote, and aside components for writing and
publishing posts. None of them are data-bound: a post is text, so every
attribute is typed in the note.

| Directive | Form | Description |
| --- | --- | --- |
| `::blog_header{}` | leaf | A post masthead: title, subtitle, and an author/date meta line. |
| `::blog_byline{}` | leaf | A compact one-line author strip with a generated monogram. |
| `:::blog_pullquote{}` | container | A large-type excerpt set off from the body, with an optional cite line. |
| `:::blog_aside{}` | container | A footnote-style side note, quieter than the stdlib callout. |

## `blog_header`

<img width="1088" height="403" alt="image" src="https://github.com/user-attachments/assets/49c68a03-0672-4f9a-a862-cfc8df52ddca" />

```markdown
::blog_header{title="Shipping Slowly" subtitle="On not rushing releases" author="Ada Lovelace" date="2026-08-30"}
```

Attributes:

- `title` (string, optional): the post title, shown large.
- `subtitle` (string, optional): a muted line under the title.
- `author` (string, optional): shown in the meta line.
- `date` (string, optional): shown in the meta line, next to `author`.

Each attribute is independent: leaving one out omits its element. A header
with no attributes at all renders nothing, so an empty directive leaves no
stray box behind.



## `blog_byline`

<img width="1088" height="403" alt="image" src="https://github.com/user-attachments/assets/9ca5884e-bda8-4a89-aa9f-ed11df7eef10" />

```markdown
::blog_byline{author="Ada Lovelace" role="Editor" date="2026-08-30"}
```

Attributes:

- `author` (string, optional): shown next to the monogram, which is drawn
  from its first letter. With no author the monogram falls back to a
  generic mark.
- `role` (string, optional): a short label such as "Editor" or "Guest
  author".
- `date` (string, optional): shown at the end of the strip.

## `blog_pullquote`

<img width="1088" height="403" alt="image" src="https://github.com/user-attachments/assets/bcc636af-8033-4775-9867-4f9b2a8aa44f" />

```markdown
:::blog_pullquote{cite="Ada Lovelace"}
The best code is the code you didn't have to write.
:::
```

Attributes:

- `cite` (string, optional): a short attribution line under the quote.

The container's markdown content is the quoted text.

## `blog_aside`

<img width="1088" height="403" alt="image" src="https://github.com/user-attachments/assets/8786d52c-ef55-4f0e-b01e-c44052051bea" />

```markdown
:::blog_aside{label="Note"}
This detail is worth mentioning but doesn't belong in the main flow.
:::
```

Attributes:

- `label` (string, optional): a small-caps label above the note. Omit it
  for an unlabeled aside.

The container's markdown content is the note's body.

## Not included

A table of contents and a reading-time estimate were both on the original
list for this pack. Neither is possible: a component only ever sees its own
subtree, never the whole document, so it cannot enumerate headings or
measure the post's length.
