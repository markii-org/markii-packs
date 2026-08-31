import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { safely, str } from './guard';
import { extractCodeText, findDirectiveChildren } from './children';
import { diffLines, type DiffLine } from './diff-lines';
import './diff.css';

/** The full written directive name a `tech_pane` child carries, as `readDirectiveChild` reports it. */
const PANE_NAME = 'tech_pane';

/**
 * `:::tech_diff{title="..."}` ... `:::`, holding exactly a "before" pane
 * and an "after" pane (two `:::tech_pane{label="..."}` children; ORDER,
 * not the label text, decides which side is removed and which is added).
 * Renders its own line-level diff, computed with a hand-rolled LCS
 * (`diff-lines.ts`), highlighting removed lines against `--mk-danger` and
 * added lines against `--mk-success`.
 *
 * Every stage of this degrades to the plain side-by-side rendering used
 * by `tech_compare` rather than throwing or showing machinery: fewer than
 * two pane children, a pane with no `pre > code` block, either side over
 * the 2000-line cap, or a diff table too large to compute all fall back
 * to rendering the panes exactly as written, quietly and without a count
 * of what failed.
 */
export function TechDiff({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);
  const highlighted = safely(() => buildHighlight(children), () => undefined);

  return (
    <div className="mk-tech_diff">
      {title !== '' && <div className="mk-tech_diff__title">{title}</div>}
      <div className="mk-tech_diff__grid">
        {highlighted !== undefined ? (
          <>
            <DiffSide label={highlighted.leftLabel} lines={highlighted.left} />
            <DiffSide label={highlighted.rightLabel} lines={highlighted.right} />
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface Highlight {
  leftLabel: string;
  rightLabel: string;
  left: DiffLine[];
  right: DiffLine[];
}

function buildHighlight(children: MarkComponentProps['children']): Highlight | undefined {
  const panes = findDirectiveChildren(children, new Set([PANE_NAME]));
  if (panes.length < 2) return undefined;

  const [leftPane, rightPane] = panes;
  const leftCode = extractCodeText(leftPane.children);
  const rightCode = extractCodeText(rightPane.children);
  if (leftCode === undefined || rightCode === undefined) return undefined;

  const result = diffLines(leftCode, rightCode);
  if (result === undefined) return undefined;

  return {
    leftLabel: str(leftPane.attributes.label, ''),
    rightLabel: str(rightPane.attributes.label, ''),
    left: result.left,
    right: result.right,
  };
}

function DiffSide({ label, lines }: { label: string; lines: DiffLine[] }): ReactElement {
  return (
    <div className="mk-tech_diff__pane">
      {label !== '' && <div className="mk-tech_diff__label">{label}</div>}
      <pre className="mk-tech_diff__pre">
        <code className="mk-tech_diff__code">
          {lines.map((line, index) => (
            <span key={index} className={lineClassName(line.kind)}>
              {line.text}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function lineClassName(kind: DiffLine['kind']): string {
  if (kind === 'removed') return 'mk-tech_diff__line mk-tech_diff__line--removed';
  if (kind === 'added') return 'mk-tech_diff__line mk-tech_diff__line--added';
  return 'mk-tech_diff__line';
}
