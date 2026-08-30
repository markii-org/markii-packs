# fin

Data-bound finance components: a quote strip, a portfolio holdings table,
and an allocation donut chart. All three read a `data=` binding; the pack
itself makes no network request, so the numbers come from whatever your
note's script returns.

| Directive | Form | Description |
| --- | --- | --- |
| `::fin_ticker{}` | leaf | Horizontal strip of quote chips: symbol, price, signed change. |
| `::fin_holdings{}` | leaf | Portfolio table with computed market value and a total row. |
| `::fin_allocation{}` | leaf | SVG donut chart with a legend, for a set of labeled shares. |

## `fin_ticker`

```markdown
::fin_ticker{data=quotes}
```

No attributes besides `data`.

Bound data: an array of quote objects, capped at 12, or a single quote
object.

```json
{ "symbol": "AAPL", "price": 227.5, "change": 1.85, "changePct": 0.82 }
```

`change` and `changePct` are optional. An entry with no usable `symbol` or
a non-finite `price` is skipped rather than shown as a blank chip.

## `fin_holdings`

```markdown
::fin_holdings{data=portfolio currency="USD"}
```

Attributes:

- `currency` (string, optional): a display prefix or suffix for the price
  and value columns, formatted with `Intl.NumberFormat` where the code is a
  valid ISO 4217 currency. It only changes how numbers are printed; it
  never converts anything. Defaults to no currency formatting.

Bound data: an array of holding objects, capped at 30.

```json
{ "symbol": "AAPL", "name": "Apple Inc.", "qty": 12, "price": 227.5 }
```

`name` is optional and cosmetic. An entry with no usable `symbol`, or a
non-finite `qty` or `price`, is skipped. Market value is `qty * price`, and
a total row sums every visible position.

## `fin_allocation`

```markdown
::fin_allocation{data=alloc label="By asset class"}
```

Attributes:

- `label` (string, optional): a caption shown next to the chart. Not a data
  key.

Bound data: an array of labeled shares, capped at 10.

```json
{ "label": "Equity", "value": 62 }
```

Values are relative shares and do not have to sum to 100. A slice with a
zero, negative, or non-numeric value is skipped, since it has no honest
angle on a donut. Every slice color is `--mk-accent` mixed against
`--mk-bg` or `--mk-fg`, so the palette follows the host theme.

## Failure and empty states

Every component here follows the same rule: a missing, failed, or empty
binding never throws and never prints an error into the note. It renders
its ordinary empty shape, no chips or no rows or no chart, with the reason
in a tooltip on the root element rather than in the visible text.
