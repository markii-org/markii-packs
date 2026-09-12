---
title: Team wiki, command palette
uses: [nav]
---

# Team wiki

The links we reach for most, kept in one note instead of scattered across
three different bookmark folders. The field filters by label, description,
and key hint, so typing "spark" surfaces the pipeline doc even though the
word never appears in a title.

::::nav_index{search="Filter the wiki..." hint="/"}

:::nav_group{title="Start here" desc="For anyone new to the team" icon="home" tone="accent"}
::nav_link[Onboarding checklist]{href="/wiki/onboarding" desc="Accounts, access, first week" key="G O"}
::nav_link[Team handbook]{href="/wiki/handbook" desc="How we work, meeting norms" key="G H"}
::nav_link[Org chart]{desc="Who owns what, updated quarterly"}
:::

:::nav_group{title="Engineering" desc="Docs and runbooks" icon="doc" tone="info"}
::nav_link[Architecture overview]{href="/wiki/eng/architecture" desc="The big picture, updated last quarter" key="G A"}
::nav_link[Data pipeline]{href="/wiki/eng/pipeline" desc="Ingest through modeling, with the Spark tuning notes"}
::nav_link[Incident runbook]{href="/wiki/eng/incidents" desc="What to do when paged" key="G I"}
::nav_link[Deploy checklist]{desc="Draft, not published yet"}
::nav_link[Style guide]{href="mailto:eng-style@example.com" desc="Ask the owner, nothing published yet"}
:::

:::nav_group{title="People" desc="HR and people ops" icon="star" tone="success"}
::nav_link[Time off policy]{href="/wiki/people/time-off" desc="Request process and blackout dates" key="G T"}
::nav_link[Benefits]{href="/wiki/people/benefits" desc="Enrollment windows and providers"}
::nav_link[Performance cycle]{href="/wiki/people/perf" desc="Timeline for the current cycle"}
:::

::::

Standing outside the index, a group renders exactly the same way, header
and all:

:::nav_group{title="Quick escalation" icon="chart" tone="danger"}
::nav_link[Status page]{href="https://status.example.com" desc="Check before paging anyone"}
::nav_link[On-call schedule]{href="/wiki/oncall" desc="Who's up this week"}
:::

The deploy checklist link above has no `href` yet: it still shows in the
list, description and all, just without anything to click until someone
writes it. The style guide link uses a `mailto:` address, which passes the
same scheme check as a plain `http(s)` link.
