<img width="1088" height="420" alt="image" src="https://github.com/user-attachments/assets/db757b0a-eba9-4ffc-b3ed-4727492b2cc6" /># track

Habit and progress tracking components: a calendar streak grid, a progress
ring, a habit-by-day grid, and a dated log table. Nothing here makes a
network request, so a note using this pack runs with no network grant.

| Directive | Form | Description |
| --- | --- | --- |
| `::track_streak{}` | leaf | A GitHub-style calendar grid of done days. |
| `::track_ring{}` | leaf | An SVG progress ring for one value against a max. |
| `::track_habits{}` | leaf | A compact grid of habits checked off by day. |
| `::track_log{}` | leaf | A minimal table of dated log entries. |

Where a component reads both a `data=` binding and an attribute of the same
name, the written attribute wins. That matches `@markii/react`'s own
`progress` and `stat`.

## `track_streak`

<img width="1088" height="420" alt="image" src="https://github.com/user-attachments/assets/bbd6b6e6-f93b-48ca-ba8a-7d857ef27a9d" />

```markdown
::track_streak{data=days weeks=12 label="Meditation"}
```

Attributes:

- `weeks` (number, optional): how many weeks to show, clamped to 4..26.
  Defaults to 12.
- `label` (string, optional): a caption above the grid.

Bound data: an array of `YYYY-MM-DD` strings naming the days the habit was
done. An entry that is not a real calendar date is ignored. The grid is
anchored in UTC so it does not shift with the reader's timezone.

```json
["2026-08-01", "2026-08-03", "2026-08-04"]
```

## `track_ring`
<img width="1084" height="383" alt="image" src="https://github.com/user-attachments/assets/4e59ce69-2d76-4284-9603-748070a3ddf5" />

```markdown
::track_ring{data=progress label="Pages read" max=300}
```

Attributes:

- `value` (number, optional): the current value. Wins over the binding, so
  the ring also works in a note with no script.
- `max` (number, optional): the ring's maximum. Wins over the binding.
  Defaults to 100.
- `label` (string, optional): a caption under the ring.

Bound data: a bare number read as the current value, or an object with
`value` and an optional `max`:

```json
{ "value": 210, "max": 300 }
```

The value is clamped to `[0, max]` and the ring shows the percentage.

## `track_habits`

<img width="1084" height="383" alt="image" src="https://github.com/user-attachments/assets/7be46e40-41d8-4a41-8c22-9cf31ae84882" />

```markdown
::track_habits{data=week}
```

No attributes. Bound data: an object with an optional `days` array of
column labels and a `rows` array of habits, each with a `name` and a `done`
array of booleans, one per day:

```json
{
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "rows": [
    { "name": "Meditate", "done": [true, true, false, true, true, false, true] },
    { "name": "Read", "done": [true, false, true, true, false, false, true] }
  ]
}
```

Rows are capped at 20 and days at 14. A row that is not a plain object is
skipped; missing `days` falls back to numbered columns.

## `track_log`
<img width="1084" height="399" alt="image" src="https://github.com/user-attachments/assets/31bda8f2-e730-4233-ade5-14e9e6095c0b" />


```markdown
::track_log{data=entries}
```

No attributes. Bound data: an array of entries, each with a `date`, a
`text`, and an optional numeric `value` shown right-aligned:

```json
[
  { "date": "2026-08-28", "text": "Ran 5k", "value": 27 },
  { "date": "2026-08-27", "text": "Rest day" }
]
```

Entries are capped at 50 rows and ordered newest first when their `date`
parses. Entries whose date does not parse keep their original order at the
end.
