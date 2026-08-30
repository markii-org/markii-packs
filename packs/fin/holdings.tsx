import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { failureTitle, isUnreadable, safeExtract, stateClassName, str } from './guard';
import './holdings.css';

const MAX_HOLDINGS = 30;

interface Holding {
  symbol: string;
  name: string;
  qty: number;
  price: number;
}

/**
 * Extracts one holding record. A holding without a usable symbol, or with
 * a non-finite quantity or price, is junk and is skipped by the caller.
 * `name` is cosmetic and defaults to empty, never to the symbol, so a
 * missing name reads as blank rather than a fabricated duplicate.
 */
function extractHolding(entry: unknown): Holding | undefined {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  const symbol = str(record.symbol);
  if (symbol === '') return undefined;
  const qty = record.qty;
  const price = record.price;
  if (typeof qty !== 'number' || !Number.isFinite(qty)) return undefined;
  if (typeof price !== 'number' || !Number.isFinite(price)) return undefined;
  return { symbol, name: str(record.name), qty, price };
}

function extractHoldings(data: unknown): Holding[] {
  if (!Array.isArray(data)) return [];
  const holdings: Holding[] = [];
  for (const entry of data) {
    if (holdings.length >= MAX_HOLDINGS) break;
    const holding = extractHolding(entry);
    if (holding !== undefined) holdings.push(holding);
  }
  return holdings;
}

/**
 * Formats a market value with an optional currency prefix/suffix. Guarded
 * in a try/catch: `currency` is free-typed by the note author, and an
 * invalid ISO code (or an engine without full `Intl` data) throws inside
 * `Intl.NumberFormat` rather than returning a fallback string.
 */
function formatValue(value: number, currency: string): string {
  const rounded = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === '') return rounded;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  } catch {
    return `${currency} ${rounded}`;
  }
}

/**
 * `::fin_holdings{data=... currency="USD"}` — a table of holdings: symbol,
 * name, quantity, price, and a computed market value (qty × price), with a
 * total row summing every visible position. `currency` only changes how
 * the value columns are formatted (a display prefix/suffix); it never
 * converts anything. Numeric columns are right-aligned. An unbound,
 * failed, or empty binding renders a quiet empty state with the reason in
 * a tooltip, per spec §4.
 */
export function FinHoldings({
  attributes,
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const currency = typeof attributes?.currency === 'string' ? attributes.currency.trim() : '';

  const bound = safeExtract<Holding[]>(
    () => (isUnreadable(dataStatus) ? [] : extractHoldings(data)),
    () => [],
  );
  const holdings = bound.fields;
  const total = holdings.reduce((sum, holding) => sum + holding.qty * holding.price, 0);

  return (
    <div
      className={stateClassName('mk-fin_holdings', dataStatus)}
      title={failureTitle(
        dataError,
        bound.fault,
        holdings.length === 0 ? 'no holdings' : undefined,
      )}
    >
      {holdings.length > 0 && (
        <table className="mk-fin_holdings__table">
          <thead>
            <tr>
              <th className="mk-fin_holdings__col-symbol">Symbol</th>
              <th className="mk-fin_holdings__col-name">Name</th>
              <th className="mk-fin_holdings__col-num">Qty</th>
              <th className="mk-fin_holdings__col-num">Price</th>
              <th className="mk-fin_holdings__col-num">Value</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr key={`${holding.symbol}-${index}`}>
                <td className="mk-fin_holdings__col-symbol">{holding.symbol}</td>
                <td className="mk-fin_holdings__col-name">{holding.name}</td>
                <td className="mk-fin_holdings__col-num">
                  {holding.qty.toLocaleString()}
                </td>
                <td className="mk-fin_holdings__col-num">
                  {formatValue(holding.price, currency)}
                </td>
                <td className="mk-fin_holdings__col-num">
                  {formatValue(holding.qty * holding.price, currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="mk-fin_holdings__total">
              <td className="mk-fin_holdings__col-symbol">Total</td>
              <td className="mk-fin_holdings__col-name" />
              <td className="mk-fin_holdings__col-num" />
              <td className="mk-fin_holdings__col-num" />
              <td className="mk-fin_holdings__col-num">{formatValue(total, currency)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
