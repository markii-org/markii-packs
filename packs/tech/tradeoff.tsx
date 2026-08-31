import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { safely, str } from './guard';
import { findDirectiveChildren } from './children';
import './tradeoff.css';

const PROS_NAME = 'tech_pros';
const CONS_NAME = 'tech_cons';

/**
 * `:::tech_tradeoff{title="..."}` ... `:::`, holding `:::tech_pros` and
 * `:::tech_cons` children: two columns headed "Pros" and "Cons", built
 * from each recognized child's own pre-rendered content (not from
 * `TechPros`/`TechCons`'s own rendering, which would double up the
 * header). Either child alone still renders as one correctly headed
 * column; with neither recognized, `children` renders exactly as
 * written, with no column layout imposed on content that isn't actually
 * pros/cons.
 */
export function TechTradeoff({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);
  const found = safely(
    () => findDirectiveChildren(children, new Set([PROS_NAME, CONS_NAME])),
    () => [],
  );
  const pros = found.find((child) => child.name === PROS_NAME);
  const cons = found.find((child) => child.name === CONS_NAME);

  const hasColumns = pros !== undefined || cons !== undefined;

  return (
    <div className="mk-tech_tradeoff">
      {title !== '' && <div className="mk-tech_tradeoff__title">{title}</div>}
      {hasColumns ? (
        <div className="mk-tech_tradeoff__columns">
          {pros !== undefined && (
            <div className="mk-tech_tradeoff__column">
              <div className="mk-tech_tradeoff__heading mk-tech_tradeoff__heading--pros">Pros</div>
              <div className="mk-tech_tradeoff__body">{pros.children}</div>
            </div>
          )}
          {cons !== undefined && (
            <div className="mk-tech_tradeoff__column">
              <div className="mk-tech_tradeoff__heading mk-tech_tradeoff__heading--cons">Cons</div>
              <div className="mk-tech_tradeoff__body">{cons.children}</div>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
