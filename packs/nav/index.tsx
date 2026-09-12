import { useState, type ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { findDirectiveChildren, type DirectiveChild } from './children';
import { hasAttribute, safely, str } from './guard';
import { GroupCard, resolveGroupHeader } from './group-card';
import { LinkRow, resolveLink, type ResolvedLink } from './link-row';
import './index.css';

const GROUP_NAME = 'nav_group';
const LINK_NAME = 'nav_link';

interface CollectedGroup {
  header: ReturnType<typeof resolveGroupHeader>;
  /** Lowercased `title + desc`, always a plain string (never `null`): both come from `str`, a guarded read, so there is nothing here that can fail to extract the way a link's bracket content can. */
  matchText: string;
  links: ResolvedLink[];
}

/** True when `query` is empty (everything matches) or `matchText` is `null` (extraction failed, so the row stays visible under every query) or `matchText` contains `query`. */
function matches(matchText: string | null, query: string): boolean {
  return query === '' || matchText === null || matchText.includes(query);
}

/**
 * Finds every `nav_group` and top-level (not-inside-a-group) `nav_link`
 * among `children`, and resolves each one through the exact same
 * `resolveGroupHeader`/`resolveLink` functions `nav_group` and `nav_link`
 * use standing alone. `findDirectiveChildren` naturally keeps a group's own
 * links out of the "loose" list: once it matches a `nav_group`, it does not
 * descend into that node looking for more matches, so a `nav_link` living
 * inside a group is only ever found by the SECOND, group-scoped call made
 * for each group here.
 */
function collectNav(
  children: MarkComponentProps['children'],
): { groups: CollectedGroup[]; looseLinks: ResolvedLink[] } {
  const topLevel = findDirectiveChildren(children, new Set([GROUP_NAME, LINK_NAME]));
  const groups: CollectedGroup[] = [];
  const looseLinks: ResolvedLink[] = [];

  for (const item of topLevel) {
    if (item.name === GROUP_NAME) {
      groups.push(buildGroup(item));
    } else {
      looseLinks.push(resolveLink(item.attributes, item.children));
    }
  }

  return { groups, looseLinks };
}

function buildGroup(group: DirectiveChild): CollectedGroup {
  const header = resolveGroupHeader(group.attributes);
  const links = findDirectiveChildren(group.children, new Set([LINK_NAME])).map((link) =>
    resolveLink(link.attributes, link.children),
  );
  return {
    header,
    matchText: `${header.title} ${header.desc}`.trim().toLowerCase(),
    links,
  };
}

/**
 * `::::nav_index{search hint="/"}` ... `::::`, a command-style index: an
 * optional filter field over grouped and loose `nav_link` rows.
 *
 * `search` decides whether the field appears at all: written bare or with
 * a value it shows a field (the value becomes the placeholder, defaulting
 * to "Search" when bare or empty), omitted entirely there is no field,
 * see `guard.ts`'s `hasAttribute` for why this needs to tell "omitted"
 * apart from "written bare" rather than just reading `attributes.search`.
 *
 * The filter is the only stateful thing in this pack. Matching is
 * case-insensitive and substring-based, over a link's own label, `desc`,
 * and `key`, plus its group's `title` and `desc`: a query that matches a
 * group's own heading keeps that whole group, rows and all. A group with
 * no surviving rows (and a heading that itself does not match) is hidden;
 * a loose link is hidden the same way on its own. If literally nothing
 * survives a non-empty query, the index shows one quiet "No matches" line
 * instead of an empty box.
 *
 * Every row is rendered up front, always: filtering only ever sets the
 * native `hidden` attribute, never removes a row from the tree. Nothing
 * here is reachable only through a successful search, so the same index
 * degrades correctly with no script running at all (the `@markii/html`
 * export, or any host that cannot run this pack): the fallback box for an
 * unrecognized directive shows every group's markdown body intact, with no
 * field to type into and no rows hidden.
 *
 * With no recognized `nav_group` or `nav_link` child anywhere inside it,
 * this component renders `children` exactly as written and shows no
 * field, since there would be nothing for it to filter: the same fallback shape
 * `packs/schema`'s `schema_pipeline` uses for a container holding plain
 * prose instead of the children it looks for.
 */
export function NavIndex({ attributes, children }: MarkComponentProps): ReactElement {
  const [query, setQuery] = useState('');

  const searchWritten = hasAttribute(attributes, 'search');
  const placeholder = searchWritten ? str(attributes?.search, 'Search') : undefined;
  const hint = str(attributes?.hint);

  const { groups, looseLinks } = safely(
    () => collectNav(children),
    () => ({ groups: [] as CollectedGroup[], looseLinks: [] as ResolvedLink[] }),
  );

  if (groups.length === 0 && looseLinks.length === 0) {
    return <div className="mk-nav_index">{children}</div>;
  }

  const normalizedQuery = query.trim().toLowerCase();

  const looseVisible = looseLinks.map((link) => matches(link.matchText, normalizedQuery));
  const groupVisible = groups.map(
    (group) => matches(group.matchText, normalizedQuery) || group.links.some((link) => matches(link.matchText, normalizedQuery)),
  );
  const anyVisible = looseVisible.some(Boolean) || groupVisible.some(Boolean);

  return (
    <div className="mk-nav_index">
      {searchWritten && (
        <div className="mk-nav_index__search">
          <input
            type="text"
            className="mk-nav_index__input"
            placeholder={placeholder}
            aria-label={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {hint !== '' && <span className="mk-nav_index__hint">{hint}</span>}
        </div>
      )}
      <div className="mk-nav_index__body">
        {looseLinks.length > 0 && (
          <div className="mk-nav_index__loose">
            {looseLinks.map((link, index) => (
              <LinkRow key={index} {...link} hidden={!looseVisible[index]} />
            ))}
          </div>
        )}
        {groups.map((group, groupIndex) => {
          const groupSelfMatches = matches(group.matchText, normalizedQuery);
          return (
            <GroupCard key={groupIndex} {...group.header} hidden={!groupVisible[groupIndex]}>
              {group.links.map((link, linkIndex) => (
                <LinkRow
                  key={linkIndex}
                  {...link}
                  hidden={!(groupSelfMatches || matches(link.matchText, normalizedQuery))}
                />
              ))}
            </GroupCard>
          );
        })}
        {!anyVisible && normalizedQuery !== '' && <div className="mk-nav_index__empty">No matches</div>}
      </div>
    </div>
  );
}
