import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str } from './guard';
import './tree.css';

/**
 * `:::::outline_tree{title="Runbook" subtitle="Deploy and rollback"}` ...
 * `:::::`, the titled card an outline lives in.
 *
 * The body is normally a run of `outline_branch` and `outline_item`
 * children, but this component never walks or rebuilds them: unlike
 * `schema_pipeline`, nothing here needs to know which child is first, so
 * it just lays out `children` exactly as written. That means prose mixed
 * in between rows still reads correctly, and an outline with no rows yet
 * is an empty card rather than an error.
 *
 * `title` and `subtitle` are both optional, and independent of each
 * other. With neither written the header strip is omitted entirely and
 * the card falls straight to its body, since a header strip with nothing
 * in it would just be an empty bar.
 *
 * In the static HTML engine this renders as the unknown-component
 * fallback box, with every row's authored markdown intact underneath it.
 */
export function OutlineTree({ attributes, children }: MarkComponentProps): ReactElement {
  const title = str(attributes?.title);
  const subtitle = str(attributes?.subtitle);
  const hasHeader = title !== '' || subtitle !== '';

  return (
    <div className="mk-outline_tree">
      {hasHeader && (
        <div className="mk-outline_tree__head">
          {title !== '' && <div className="mk-outline_tree__title">{title}</div>}
          {subtitle !== '' && <div className="mk-outline_tree__subtitle">{subtitle}</div>}
        </div>
      )}
      <div className="mk-outline_tree__body">{children}</div>
    </div>
  );
}
