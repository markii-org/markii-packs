---
title: Portfolio Snapshot
description: A small demo portfolio built from static data, showing the fin pack's three components together.
uses: [fin]
---

# Portfolio Snapshot

Watchlist:

::fin_ticker{data=port.quotes}

Holdings:

::fin_holdings{data=port.holdings currency="USD"}

Allocation by asset class:

::fin_allocation{data=port.allocation label="By asset class"}

```lua {name=port}
-- Static demo data only: no network access, so this note renders the
-- same way everywhere and needs no run grant. A real note would replace
-- this with a script that pulls live quotes and positions, still
-- returning the same shape.

local quotes = {
  { symbol = "AAPL", price = 227.52, change = 1.85, changePct = 0.82 },
  { symbol = "MSFT", price = 421.10, change = -2.34, changePct = -0.55 },
  { symbol = "VTI", price = 289.77, change = 0.41, changePct = 0.14 },
  { symbol = "BND", price = 72.90, change = -0.06, changePct = -0.08 },
}

local holdings = {
  { symbol = "AAPL", name = "Apple Inc.", qty = 12, price = 227.52 },
  { symbol = "MSFT", name = "Microsoft Corp.", qty = 6, price = 421.10 },
  { symbol = "VTI", name = "Vanguard Total Stock Market ETF", qty = 20, price = 289.77 },
  { symbol = "BND", name = "Vanguard Total Bond Market ETF", qty = 30, price = 72.90 },
}

local allocation = {
  { label = "US Equity", value = 58 },
  { label = "Intl Equity", value = 14 },
  { label = "Bonds", value = 22 },
  { label = "Cash", value = 6 },
}

return {
  quotes = quotes,
  holdings = holdings,
  allocation = allocation,
}
```
