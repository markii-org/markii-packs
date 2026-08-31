# prep

Components for interview preparation notes: a question whose answer stays
hidden until you ask for it, a topic row that tracks how solid you feel,
and a block for the mistake you keep making. Nothing here is data-bound;
every attribute is typed in the note.

| Directive | Form | Description |
| --- | --- | --- |
| `:::prep_q{}` | container | A question card with the answer behind a collapsed "Answer" region. |
| `::prep_topic[]{}` | leaf | A topic row with a one-to-five confidence rating. |
| `:::prep_pitfall{}` | container | A common-mistake block, styled apart from the standard callout. |

## `prep_q`

```markdown
:::prep_q{q="What does a bloom filter get wrong?" level=medium topic="data structures"}
It can report a false positive, never a false negative.
:::
```

Attributes:

- `q` (string, optional): the question. It is shown in the card header,
  and the body becomes a collapsed "Answer" region you open when you want
  to check yourself.
- `level` (string, optional): one of `easy`, `medium`, `hard`. Each gets
  its own tint. Any other value still shows as a tag carrying the text you
  wrote, styled neutral, so a typo never relabels the question.
- `topic` (string, optional): a small neutral tag next to the level.

The body is the answer. With no `q` attribute there is nothing to test
yourself against, so the card drops the reveal and shows the body
directly, tags included. That keeps a half-written card readable instead
of hiding its only content.

## `prep_topic`

```markdown
::prep_topic[Graph traversal]{confidence=3}
```

Attributes:

- `name` (string, optional): the topic, for when you would rather not use
  bracket content.
- `confidence` (number, optional): 1 to 5, drawn as filled and empty dots.
  A value outside the range is clamped.

The label comes from the bracket content when it is written, and from
`name` otherwise. With neither, the row renders a quiet "Untitled topic"
placeholder. A `confidence` that is not a number omits the dots entirely,
because "not rated yet" and "rated zero" are different things.

## `prep_pitfall`

```markdown
:::prep_pitfall{title="Off by one on the window"}
The sliding window is inclusive on both ends, so the length is
`right - left + 1`.
:::
```

Attributes:

- `title` (string, optional): the heading. Defaults to "Common mistake",
  so the block is never left unlabeled.

The body is the mistake, and what to do instead. The styling is
deliberately unlike the standard `callout`: a revision sheet is mostly
callout-shaped already, and a pitfall that borrowed those colors would
disappear into the page.
