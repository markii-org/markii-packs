---
title: Habit tracker
uses: [track]
---

# Habit tracker

A personal tracking note built entirely from the `track` pack. Every value
below comes from the static script at the bottom of this file: no network
request anywhere, which is the point of this pack.

::track_streak{data=track.days weeks=10 label="Meditation streak"}

:::row{cols=2}

::track_ring{data=track.progress label="Pages read this month"}

::track_ring{data=track.water label="Water" max=8}

:::

## This week

The grid below sizes to its own columns rather than filling the page, so
the `:::center` around it has something to place.

:::center

::track_habits{data=track.week}

:::

## Log

::track_log{data=track.entries}

---

```lua {name=track}
-- Static demo data for the track pack's four components. No net.* calls:
-- this script only builds and returns plain tables, which is why the pack
-- works with no network grant at all.

local days = {
  "2026-08-01", "2026-08-02", "2026-08-04", "2026-08-05",
  "2026-08-06", "2026-08-08", "2026-08-09", "2026-08-11",
  "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15",
  "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-22",
  "2026-08-23", "2026-08-25", "2026-08-26", "2026-08-27",
  "2026-08-28", "2026-08-29",
}

local progress = { value = 210, max = 300 }
local water = { value = 5 }

local week = {
  days = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" },
  rows = {
    { name = "Meditate", done = { true, true, false, true, true, false, true } },
    { name = "Read", done = { true, false, true, true, false, false, true } },
    { name = "Stretch", done = { false, true, true, false, true, true, false } },
  },
}

local entries = {
  { date = "2026-08-29", text = "Ran 5k", value = 27 },
  { date = "2026-08-28", text = "Rest day" },
  { date = "2026-08-27", text = "Long walk with the dog", value = 45 },
  { date = "2026-08-25", text = "Yoga class", value = 60 },
}

return {
  days = days,
  progress = progress,
  water = water,
  week = week,
  entries = entries,
}
```
