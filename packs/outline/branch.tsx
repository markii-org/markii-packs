import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { str, flag, oneOf } from './guard';
import { ICON_NAMES } from './icon';
import { RowContent } from './row';
import './branch.css';

/**
 * `::::outline_branch{label="Deploy" icon=folder}` ... `::::`, an
 * expandable row inside an `outline_tree`: a summary line that reveals a
 * body of detail when opened.
 *
 * The body can be plain markdown, a bullet list, a fenced code block, or
 * another `outline_branch` written one fence-width narrower (the format's
 * "more colons for the outer scope" rule, see `docs/format.md`), which is
 * how a third level of nesting appears: there is no dedicated component
 * for it, because a branch inside a branch's body already reads as a
 * nested section, one shade lighter and indented by the body's own left
 * rule.
 *
 * This renders as a native `<details>`/`<summary>` pair rather than
 * anything scripted, so expanding and collapsing work with no JavaScript
 * at all, matching stdlib `details`. That also means every branch's body
 * stays in the document even while collapsed: a search or a text export
 * still sees it. `open` (written bare) starts the branch expanded; without
 * it the branch starts collapsed, which is the normal state for a section
 * whose contents you are not currently reading.
 *
 * The summary row shares its markup with `outline_item` through
 * `RowContent`, plus a trailing chevron this component alone draws, so a
 * branch and an item read as the same kind of row apart from that
 * chevron. With no `label` written, the row still renders, headed by a
 * quiet "untitled section" placeholder, matching `schema_col`'s "unnamed
 * column": a half-written outline keeps its shape rather than showing an
 * empty row.
 *
 * In the static HTML engine (`@markii/html`, which cannot load a pack's
 * React components), this whole directive becomes the unknown-component
 * fallback box, with the body's authored markdown intact underneath it:
 * an exported note never loses a branch's content, only its collapsing
 * behavior.
 */
export function OutlineBranch({ attributes, children }: MarkComponentProps): ReactElement {
  const label = str(attributes?.label);
  const num = str(attributes?.num);
  const meta = str(attributes?.meta);
  const icon = oneOf(attributes?.icon, ICON_NAMES, 'none');
  const startOpen = flag(attributes?.open);

  // A branch's label always comes from the `label=` attribute, never from
  // bracket content (a container's bracket position is not part of the
  // directive syntax), so a plain non-empty check is the whole test.
  const hasLabel = label !== '';

  return (
    <details className="mk-outline_branch" open={startOpen}>
      {/* `data-mk-interactive` matches @markii/stdlib's `INTERACTIVE_ATTRIBUTE`
          (docs/integration.md's editor-host contract); written as a literal
          because @markii/stdlib is not a dependency of this repo and, even
          where it is, TypeScript only special-cases a literal `data-*` name
          on a DOM intrinsic element. */}
      <summary className="mk-outline_branch__summary" data-mk-interactive="">
        <RowContent
          icon={icon}
          num={num}
          label={label}
          hasLabel={hasLabel}
          placeholder="untitled section"
          meta={meta}
          chevron
        />
      </summary>
      <div className="mk-outline_branch__body">{children}</div>
    </details>
  );
}
