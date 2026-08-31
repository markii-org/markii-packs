/**
 * A self-written, dependency-free line diff for `:::tech_diff`. No
 * third-party diff library (AGENTS.md's "components are self-built"
 * rule). This is a plain dynamic-programming longest-common-subsequence
 * over lines, then a backtrack that marks each line removed, added, or
 * unchanged.
 *
 * `diffLines` never throws and never runs unbounded: both the per-side
 * line count and the DP table's cell count are capped, and either cap
 * being exceeded returns `undefined` rather than a partial or wrong
 * result. The caller (`diff.tsx`) treats `undefined` as "render both
 * sides plain, no highlighting", the documented degradation, not an
 * error.
 */

/** Per-side line cap. Matches the pack's documented 2000-line diff limit. */
export const MAX_DIFF_LINES = 2000;

/** DP table cell budget: `left.length * right.length` beyond this bails out to no highlighting even when both sides are individually under `MAX_DIFF_LINES` (a 2000x2000 table is 4,000,000 cells, already near the intended ceiling). */
const MAX_TABLE_CELLS = 4_000_000;

export type DiffLineKind = 'unchanged' | 'removed' | 'added';

export interface DiffLine {
  text: string;
  kind: DiffLineKind;
}

export interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
}

/**
 * Splits `left`/`right` on newlines and computes a line-level diff.
 * Returns `undefined` when either side exceeds `MAX_DIFF_LINES`, when the
 * DP table would exceed `MAX_TABLE_CELLS`, or when either input is not a
 * string.
 */
export function diffLines(left: unknown, right: unknown): DiffResult | undefined {
  if (typeof left !== 'string' || typeof right !== 'string') return undefined;

  const leftLines = left.split('\n');
  const rightLines = right.split('\n');

  if (leftLines.length > MAX_DIFF_LINES || rightLines.length > MAX_DIFF_LINES) {
    return undefined;
  }
  if (leftLines.length * rightLines.length > MAX_TABLE_CELLS) {
    return undefined;
  }

  try {
    return computeDiff(leftLines, rightLines);
  } catch {
    return undefined;
  }
}

/** Plain O(n*m) LCS table, then a backtrack that emits removed/added/unchanged in document order. */
function computeDiff(leftLines: string[], rightLines: string[]): DiffResult {
  const n = leftLines.length;
  const m = rightLines.length;

  // table[i][j] = LCS length of leftLines[i..] and rightLines[j..]
  const table: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) table[i] = new Uint32Array(m + 1);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (leftLines[i] === rightLines[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (leftLines[i] === rightLines[j]) {
      left.push({ text: leftLines[i], kind: 'unchanged' });
      right.push({ text: rightLines[j], kind: 'unchanged' });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      left.push({ text: leftLines[i], kind: 'removed' });
      i++;
    } else {
      right.push({ text: rightLines[j], kind: 'added' });
      j++;
    }
  }
  while (i < n) {
    left.push({ text: leftLines[i], kind: 'removed' });
    i++;
  }
  while (j < m) {
    right.push({ text: rightLines[j], kind: 'added' });
    j++;
  }

  return { left, right };
}
