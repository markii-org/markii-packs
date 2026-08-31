import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import './pane.css';

/**
 * `:::tech_pane{label="Scala"}` ... `:::`, a labeled box. The label is a
 * header strip, the pre-rendered markdown children below. Used as a child
 * of `tech_compare` and `tech_diff`, where the parent lays panes out
 * side by side but never re-renders their insides; a pane's own markup is
 * therefore identical whether it stands alone or sits inside one of those
 * containers. With no `label` attribute the header strip is simply
 * omitted, so an unlabeled pane is still an ordinary box, never broken.
 */
export function TechPane({ attributes, children }: MarkComponentProps): ReactElement {
  const label = str(attributes?.label);

  return (
    <div className="mk-tech_pane">
      {label !== '' && <div className="mk-tech_pane__label">{label}</div>}
      <div className="mk-tech_pane__body">{children}</div>
    </div>
  );
}
