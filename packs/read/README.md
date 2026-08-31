# read

Components for reading notes: citing a source, quoting a passage,
annotating a term, linking to a timestamp, and highlighting a line. None of
them require a `data=` binding except `read_source`, whose progress bar can
optionally follow one.

| Directive | Form | Description |
| --- | --- | --- |
| `::read_source{}` | leaf | A citation card: type badge, title, author/year, status, progress. |
| `:::read_quote{}` | container | A cited passage with a right-aligned citation line. |
| `:read_term[]{}` | inline | A term with an optional tooltip and focus-reachable definition. |
| `:read_at[]{}` | inline | A monospace timestamp chip, optionally linked. |
| `:read_mark[]{}` | inline | A highlighter-style marker, tinted by kind. |

## `read_source`

```markdown
::read_source{title="Gödel, Escher, Bach" author="Douglas Hofstadter" year="1979" type=book status=reading progress=40}
```

Attributes:

- `title` (string, optional): the source's title. With no usable title the
  card still renders, labeled "Untitled source", rather than vanishing.
- `author` (string, optional): shown in the byline.
- `year` (string, optional): shown in the byline, next to `author`.
- `url` (string, optional): when it is a safe `http:`/`https:` URL, the
  title becomes a link.
- `type` (string, optional): one of `book`, `article`, `paper`, `podcast`,
  `video`, `course`. Defaults to `book`. An unrecognized value still shows
  as a badge carrying that text (trimmed, capped at 24 characters), styled
  neutral rather than forced into the default look.
- `status` (string, optional): one of `queued`, `reading`, `done`.
  Anything else is omitted entirely rather than shown as "unknown".
- `progress` (number, optional): 0 to 100. Clamped into range; a written
  attribute always wins over a bound value.

The byline reads "Author, 2019" when both are present, "Author" or "2019"
alone when only one is, and is omitted entirely when neither is set. The
progress bar only appears when a progress value, written or bound, is
available.

Bound data (`data=`): a finite number, or an object with a finite
`.progress` or `.value` field.

```json
{ "progress": 40 }
```

## `read_quote`

```markdown
:::read_quote{source="Gödel, Escher, Bach" page="152" note="Worth rereading."}
A strange loop arises when, by moving only upwards or downwards through the
levels of a hierarchical system, we unexpectedly find ourselves right back
where we started.
:::
```

Attributes:

- `source` (string, optional): a short citation, such as a title or author.
- `page` (string, optional): rendered as "p. 152".
- `loc` (string, optional): rendered as "loc. 240", for an ebook location.
- `at` (string, optional): a timestamp such as `12:34`, rendered as given,
  for a podcast or video source.
- `note` (string, optional): a short commentary line shown under the
  citation.

The container's markdown content is the quoted passage. The citation line
is built from whichever of `source`, `page`, `loc`, and `at` are set, in
that order, and is omitted entirely when none are. Each attribute is capped
at a few hundred characters.

## `read_term`

```markdown
:read_term[monad]{def="A type with a way to wrap a value and a way to chain operations that return wrapped values."}
```

Attributes:

- `def` (string, optional): the definition. With a `def`, the term gets a
  dotted underline, a native tooltip, and a keyboard-reachable definition
  panel revealed on focus. With no `def`, only the underline shows: there
  is nothing focusable that would say nothing.

The directive's text is the term itself.

## `read_at`

```markdown
:read_at[12:34]{href="https://example.com/watch?v=abc123"}
```

Attributes:

- `href` (string, optional): a link target. When it parses as a safe
  `http:`/`https:` URL, the chip becomes a link, and the parsed timestamp
  (if any) is appended to the URL as `t=<seconds>`, replacing any existing
  `t` and preserving the rest of the query string. Anything else renders a
  plain, unlinked chip.

The directive's text is parsed as `mm:ss`, `m:ss`, or `hh:mm:ss` and is
also what gets displayed, unchanged. An unparseable timestamp still
displays and still links (just without `t`) if the `href` is safe.

## `read_mark`

```markdown
Turing's paper reframes the Entscheidungsproblem as a question about
:read_mark[machines, not proofs]{kind=insight}.
```

Attributes:

- `kind` (string, optional): one of `insight`, `question`, `disagree`,
  `todo`. Each maps to a theme hue tinting the highlight. A missing or
  unrecognized value falls back to a neutral tint.

The directive's text is the highlighted span.
