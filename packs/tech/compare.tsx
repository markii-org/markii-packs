import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import './compare.css';

/**
 * `:::tech_compare{title="..."}` ... `:::`, holding two or three
 * `:::tech_pane{...}` children: a side-by-side layout container. This
 * component never re-implements pane rendering: it lays out whatever
 * `children` already are (a CSS grid that wraps to a vertical stack below
 * a narrow container width), and each pane renders itself exactly as it
 * would standing alone. Zero panes, non-pane children, four or more
 * panes: all still render, just laid out the same way, never a throw and
 * never an error box.
 */
export function TechCompare({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);

  return (
    <div className="mk-tech_compare">
      {title !== '' && <div className="mk-tech_compare__title">{title}</div>}
      <div className="mk-tech_compare__grid">{children}</div>
    </div>
  );
}
