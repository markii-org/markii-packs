---
title: Deploy runbook
uses: [outline]
---

# Deploy runbook

Written the way I actually read it back at 2am: prep, then the deploy
itself, then what to do if it goes sideways.

:::::outline_tree{title="Staging then production" subtitle="Run top to bottom, do not skip prep"}

:::outline_branch{label="Prep" icon=doc meta="5 min"}
Confirm the branch is green and the changelog entry is already written. If
either of those is missing, stop here and go fix it first.
:::

::::outline_branch{label="Deploy" icon=folder meta="20 min" open}
Ship staging first. Watch the error rate and the latency dashboard for five
minutes before promoting to production. If nothing moves, promote.

:::outline_branch{label="If it goes wrong" icon=dot num="a."}
Rollback is a revert and a redeploy, never a hotfix typed under pressure.

- Revert the merge commit, not just the diff that broke things
- Redeploy the previous tag, do not cherry-pick a fix onto main
- Post in #eng before you start the rollback, not after it finishes

```bash
git revert --no-edit HEAD
git push origin main
```
:::

::outline_item[Notify #eng before promoting to production]{icon=dot}
::::

::outline_item[Update this doc with anything that surprised you]{meta="after"}

:::::

The rollback branch above stays collapsed by default: it is the part of
this runbook I hope to never read, but it needs to be one click away when
I do.
