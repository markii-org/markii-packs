import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { failureTitle, isUnreadable, safeExtract, stateClassName, str } from './guard';
import './ticker.css';

const MAX_QUOTES = 12;

interface Quote {
  symbol: string;
  price: number;
  change: number | undefined;
  changePct: number | undefined;
}

/**
 * Extracts one quote record. A quote without a usable symbol or a finite
 * price is junk and is skipped by the caller rather than rendered as a
 * blank chip. `change`/`changePct` are optional: a quote may report
 * neither, either, or both.
 */
function extractQuote(entry: unknown): Quote | undefined {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  const symbol = str(record.symbol);
  if (symbol === '') return undefined;
  const price = record.price;
  if (typeof price !== 'number' || !Number.isFinite(price)) return undefined;
  const change =
    typeof record.change === 'number' && Number.isFinite(record.change)
      ? record.change
      : undefined;
  const changePct =
    typeof record.changePct === 'number' && Number.isFinite(record.changePct)
      ? record.changePct
      : undefined;
  return { symbol, price, change, changePct };
}

/**
 * Extracts a bounded list of quotes off a bound value that may be a single
 * quote object or an array of them, matching the note-authoring shape a
 * script naturally returns for "one symbol" versus "a watchlist". Anything
 * else, and any junk entry inside an array, is skipped rather than thrown.
 */
function extractQuotes(data: unknown): Quote[] {
  const raw = Array.isArray(data) ? data : [data];
  const quotes: Quote[] = [];
  for (const entry of raw) {
    if (quotes.length >= MAX_QUOTES) break;
    const quote = extractQuote(entry);
    if (quote !== undefined) quotes.push(quote);
  }
  return quotes;
}

function formatPrice(price: number): string {
  try {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return price.toFixed(2);
  }
}

function formatChange(change: number, changePct: number | undefined): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const magnitude = Math.abs(change).toFixed(2);
  const pct = changePct !== undefined ? ` (${Math.abs(changePct).toFixed(2)}%)` : '';
  return `${sign}${magnitude}${pct}`;
}

/**
 * `::fin_ticker{data=...}` — a horizontal strip of quote chips: symbol,
 * price, and a signed change with an up/down triangle, tinted positive or
 * negative. The bound value may be a single quote object or an array
 * (capped at 12); entries missing a symbol or a finite price are skipped
 * rather than rendered as blanks. An unbound, failed, or all-junk binding
 * renders a quiet empty strip with the reason in a tooltip, per spec §4.
 */
export function FinTicker({
  data,
  dataStatus,
  dataError,
}: MarkComponentProps): ReactElement {
  const bound = safeExtract<Quote[]>(
    () => (isUnreadable(dataStatus) ? [] : extractQuotes(data)),
    () => [],
  );
  const quotes = bound.fields;

  return (
    <div
      className={stateClassName('mk-fin_ticker', dataStatus)}
      title={failureTitle(dataError, bound.fault, quotes.length === 0 ? 'no quotes' : undefined)}
    >
      {quotes.map((quote, index) => {
        const direction =
          quote.change === undefined || quote.change === 0
            ? 'flat'
            : quote.change > 0
              ? 'up'
              : 'down';
        return (
          <span
            key={`${quote.symbol}-${index}`}
            className={`mk-fin_ticker__chip mk-fin_ticker__chip--${direction}`}
          >
            <span className="mk-fin_ticker__symbol">{quote.symbol}</span>
            <span className="mk-fin_ticker__price">{formatPrice(quote.price)}</span>
            {quote.change !== undefined && (
              <span className="mk-fin_ticker__change">
                <span className="mk-fin_ticker__arrow" aria-hidden="true">
                  {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●'}
                </span>
                {formatChange(quote.change, quote.changePct)}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
