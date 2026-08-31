---
title: Systems interview, revision sheet
uses: [prep]
---

# Systems interview, revision sheet

Three sessions left. The plan is to read the topic rows first, find the
weakest one, and only then open any answers.

## Where I stand

::prep_topic[Graph traversal]{confidence=4}

::prep_topic[Consistent hashing]{confidence=2}

::prep_topic{name="Consensus protocols" confidence=1}

::prep_topic[Rate limiting]{confidence=5}

::prep_topic[SQL window functions]{confidence=hazy}

The last row was written with `confidence=hazy`, which is not a number, so
the dots are left off rather than guessed at. A row with no label at all
still renders:

::prep_topic{}

## Data structures

:::prep_q{q="What can a bloom filter get wrong?" level=easy topic="data structures"}
It can report a false positive: an element it has never seen may hash onto
bits that other elements already set. It can never report a false
negative, because every inserted element sets its bits and they are never
cleared.
:::

::::prep_q{q="Why is a skip list a reasonable alternative to a balanced tree?" level=medium topic="data structures"}
Expected `O(log n)` search with far simpler insertion code, because the
balancing is probabilistic rather than structural. Nothing has to be
rotated.

:::prep_pitfall{title="Expected is not guaranteed"}
The bound is expected, not worst case. An adversary who can see the
coin flips can force linear behavior, which rules skip lists out where
the key stream is attacker controlled.
:::
::::

## Distributed systems

:::prep_q{q="What does consistent hashing actually buy you?" level=hard topic="distributed"}
Adding or removing one node moves roughly `1/n` of the keys instead of
almost all of them. Plain modulo hashing remaps nearly every key when the
node count changes, which turns a single node addition into a full cache
miss storm.
:::

:::prep_q{q="Where does a leader election stall in a partition?" level=hard}
A minority partition cannot elect a leader, because it cannot reach a
quorum, so it stops accepting writes. The majority side keeps going. That
is the availability half of the tradeoff being paid on purpose.
:::

:::prep_pitfall
Saying "eventually consistent" as though it were one guarantee. Ask which
one: read your writes, monotonic reads, or bounded staleness. They are not
the same promise and they do not fail the same way.
:::

## Still drafting

:::prep_q{level=medium topic="sql"}
This card has no question written yet, so it shows its notes directly
instead of hiding them behind an "Answer" toggle that would reveal the
only thing on the card.
:::

:::prep_q{q="What is a covering index?" level=easy topic="sql" }
An index that holds every column the query reads, so the engine answers
from the index alone and never visits the table rows.
:::
