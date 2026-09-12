import type { ReactElement, ReactNode } from 'react';
import type { DirectiveAttributes } from '@markii/react';
import { hasContent, plainText } from './children';
import { optionalStr, safeHref, safely, str, oneOf } from './guard';
import { Icon, ICON_NAMES, type IconName } from './icon';
import './link-row.css';

/**
 * A row's fully resolved, display-ready shape: everything `LinkRow` needs
 * to draw itself, plus `matchText`, which only `nav_index` reads (a
 * standalone `::nav_link` ignores it). Keeping resolution and rendering in
 * one module, rather than splitting them the way `packs/schema` splits
 * `StageChip` from `stage.tsx`, is deliberate here: `resolveLink` and
 * `LinkRow` are always used together by every caller (`nav_link` on its
 * own, and `nav_index` rebuilding a filterable list), so a second module
 * would only add a hop with no caller that benefits from it.
 */
export interface ResolvedLink {
  icon: IconName;
  hasLabel: boolean;
  labelContent: ReactNode;
  desc: string;
  keyHint: string;
  href: string | undefined;
  hrefRejected: boolean;
  /**
   * Lowercased text a search query is matched against, or `null` when it
   * could not be determined (the bracket content threw while being read
   * for plain text). `null` means "always visible", never "never
   * visible": a row this pack cannot read the text of must not become
   * unreachable just because a query does not match nothing.
   */
  matchText: string | null;
}

/** The one place the rejected-href wording lives, so the marker and its tooltip can never drift apart. */
const REJECTED_HREF_REASON = 'Link left out: its address is not a supported kind of URL.';

const EMPTY_RESOLVED: ResolvedLink = {
  icon: 'none',
  hasLabel: false,
  labelContent: undefined,
  desc: '',
  keyHint: '',
  href: undefined,
  hrefRejected: false,
  matchText: null,
};

/**
 * Reads one `nav_link`'s attributes and pre-rendered children into a
 * `ResolvedLink`. Used by `nav_link` itself (rendering standalone) and by
 * `nav_index` (rebuilding every `nav_link` it finds, grouped or loose, so
 * it can decide per-row visibility). Never throws: the whole read is
 * wrapped in `safely`, so a hostile `attributes` object or an exploding
 * `children` tree degrades to `EMPTY_RESOLVED`, an icon-less, label-less,
 * link-less, always-visible row, rather than crashing the container that
 * called it.
 */
export function resolveLink(attributes: DirectiveAttributes | undefined, children: ReactNode): ResolvedLink {
  return safely(
    () => {
      const labelAttr = str(attributes?.label);
      const written = hasContent(children);
      const hasLabel = written || labelAttr !== '';
      const labelContent: ReactNode = written ? children : labelAttr;

      const desc = str(attributes?.desc);
      const keyHint = str(attributes?.key);
      const icon = oneOf<IconName>(attributes?.icon, ICON_NAMES, 'none');

      const rawHref = optionalStr(attributes?.href);
      const href = rawHref !== undefined ? safeHref(rawHref) : undefined;
      const hrefRejected = rawHref !== undefined && href === undefined;

      const extracted = written ? plainText(children) : undefined;
      const matchSource = !written ? labelAttr : extracted === undefined ? null : extracted !== '' ? extracted : labelAttr;
      const matchText = matchSource === null ? null : `${matchSource} ${desc} ${keyHint}`.trim().toLowerCase();

      return { icon, hasLabel, labelContent, desc, keyHint, href, hrefRejected, matchText };
    },
    () => EMPTY_RESOLVED,
  );
}

/**
 * `::nav_link[Label]{href="..." desc="..." key="..." icon="..."}` rendered
 * as one row: an optional icon, the label with an optional description
 * under it, and an optional key-cap hint pinned to the end. With no label
 * at all (no bracket content, no `label=`) the row still renders, with a
 * quiet "untitled link" placeholder, rather than a gap in the list.
 *
 * The row becomes a real `<a>` only when `href` passed `safeHref`'s scheme
 * check. Otherwise it is a plain, unclickable row carrying a small "no
 * link" marker whose `title` says why, so a rejected address is never
 * silent (a reader can see that something was dropped and read the reason
 * on hover) and never an error dump either. A row that simply has no
 * `href` written shows no marker at all: nothing was dropped there. An accepted absolute URL always
 * gets `rel="noopener noreferrer"` and never a `target`: this pack does
 * not decide where a link opens, the host does.
 *
 * `hidden` is set only by `nav_index`'s filter (a standalone `nav_link`
 * never passes it) and uses the native `hidden` attribute rather than
 * omitting the row from the tree, so every row genuinely stays rendered
 * and the query only ever toggles visibility.
 */
export function LinkRow({
  icon,
  hasLabel,
  labelContent,
  desc,
  keyHint,
  href,
  hrefRejected,
  hidden,
}: ResolvedLink & { hidden?: boolean }): ReactElement {
  const inner = (
    <>
      <Icon name={icon} className="mk-nav_link__icon" />
      <span className="mk-nav_link__text">
        <span className={hasLabel ? 'mk-nav_link__label' : 'mk-nav_link__label mk-nav_link__label--placeholder'}>
          {hasLabel ? labelContent : 'untitled link'}
        </span>
        {desc !== '' && (
          <span className="mk-nav_link__desc" title={desc}>
            {desc}
          </span>
        )}
      </span>
      {hrefRejected && (
        <span className="mk-nav_link__unlinked" title={REJECTED_HREF_REASON}>
          no link
        </span>
      )}
      {keyHint !== '' && <span className="mk-nav_link__key">{keyHint}</span>}
    </>
  );

  if (href !== undefined) {
    return (
      <a className="mk-nav_link" href={href} rel="noopener noreferrer" hidden={hidden}>
        {inner}
      </a>
    );
  }

  return (
    <div className="mk-nav_link" hidden={hidden}>
      {inner}
    </div>
  );
}
