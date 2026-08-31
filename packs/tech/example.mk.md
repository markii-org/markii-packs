---
title: Rate Limiter Notes
uses: [tech]
---

# Rate limiter service

Internal notes on the token-bucket rate limiter in front of the public
API. Kept here so the history of what changed, and why, travels with the
code instead of living in a chat thread somewhere.

## Endpoints

:tech_method[GET]{path="/v1/limits/{key}"} returns the current bucket
state for a key.

:tech_method[POST]{path="/v1/limits/{key}/consume"} attempts to take one
token, returning 429 when the bucket is empty.

:tech_method[DELETE]{path="/v1/limits/{key}"} resets a key, admin only.

## Status

:tech_status[stable]{since="3.5"} for the token-bucket algorithm itself.
The older fixed-window limiter is :tech_status[deprecated]{since="4.0"}
and scheduled for removal next quarter. The sliding-window variant is
still :tech_status[experimental].

## Language comparison

Two languages were considered for the rewrite.

::::tech_compare{title="Collection defaults"}
:::tech_pane{label="Scala"}
Collections are immutable by default; you opt into mutability with a
separate `mutable` import.
:::

:::tech_pane{label="Kotlin"}
Collections are mutable by default, with read-only interfaces (`List`,
`Map`) layered on top rather than true immutability.
:::

:::tech_pane{label="Rust"}
Bindings are immutable by default (`let`), and collections follow the
same rule unless declared `mut`.
:::
::::

A pane also reads fine on its own, outside a compare block:

:::tech_pane{label="Reminder"}
The sliding-window limiter still needs a load test before it leaves
`experimental`.
:::

## What changed in the token check

::::tech_diff{title="Token check, v3 to v4"}
:::tech_pane{label="before"}
```python
def allow(self):
    return True
```
:::

:::tech_pane{label="after"}
```python
def allow(self):
    if self.tokens <= 0:
        return False
    self.tokens -= 1
    return True
```
:::
::::

## Should we switch to async I/O

::::tech_tradeoff{title="Async I/O for the consume path"}
:::tech_pros
- Higher throughput under sustained load
- No thread-per-connection overhead at scale
- Matches the client SDK, which is already async
:::

:::tech_cons
- Harder to debug with a synchronous mindset on the team
- Every call in the request chain has to become async
- The metrics library we use doesn't have an async client yet
:::
::::

## Verification log

::tech_verified{env="staging, 3 replicas" result=worked date="2026-08-20" note="10k req/s sustained for 30 minutes, no dropped tokens"}

::tech_verified{env="prod canary" result=partial date="2026-08-25" note="one replica showed clock drift under load; rolled back"}

::tech_verified{env="single-node dev" result=failed date="2026-06-02" note="early prototype, expected"}
