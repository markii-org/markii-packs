import type { ReactElement, ReactNode } from 'react';
import type { DirectiveAttributes } from '@markii/react';
import { oneOf, safely, str } from './guard';
import { Icon, ICON_NAMES, type IconName } from './icon';
import './group-card.css';

/** The closed set of tints a group's icon tile can take. `'accent'` is the default: a group with no `tone=` written still looks intentional, not gray. */
export const TONES = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'] as const;
export type Tone = (typeof TONES)[number];

export interface ResolvedGroupHeader {
  title: string;
  desc: string;
  icon: IconName;
  tone: Tone;
}

const EMPTY_HEADER: ResolvedGroupHeader = { title: '', desc: '', icon: 'none', tone: 'accent' };

/**
 * Reads one `nav_group`'s heading attributes. Used by `nav_group` itself
 * (rendering standalone, body laid out as written) and by `nav_index`
 * (rebuilding the same header chrome around a rebuilt, filterable list of
 * rows). Never throws: wrapped in `safely`, so a hostile `attributes`
 * object degrades to an untitled, neutral-toned, icon-less header instead
 * of crashing the card.
 */
export function resolveGroupHeader(attributes: DirectiveAttributes | undefined): ResolvedGroupHeader {
  return safely(
    () => ({
      title: str(attributes?.title),
      desc: str(attributes?.desc),
      icon: oneOf<IconName>(attributes?.icon, ICON_NAMES, 'none'),
      tone: oneOf<Tone>(attributes?.tone, TONES, 'accent'),
    }),
    () => EMPTY_HEADER,
  );
}

/**
 * `:::nav_group{title="..." desc="..." icon="..." tone="..."}` rendered as
 * a card: a header strip (a tone-tinted icon tile, the title, and an
 * optional muted description) over a body. `children` is laid out exactly
 * as given, never rebuilt: this is the same shape `packs/schema`'s
 * `schema_schema` uses for the same reason: only the caller that needs to
 * reorder or filter its contents (here, `nav_index`) has any business
 * rebuilding them, and a `nav_group` written on its own has no such need.
 * That is also why `nav_index` reuses this exact component rather than
 * drawing its own header markup: a group looks identical whether it
 * stands alone or lives inside an index.
 *
 * The tinted icon tile is drawn only when an icon was actually written.
 * `icon="none"` (the default) leaves it out entirely rather than showing an
 * empty tinted square, which is a mark that means nothing.
 *
 * With no `title` written the card still renders, headed by a quiet
 * "untitled group" placeholder, matching `schema_schema`'s "unnamed
 * dataset" precedent: a group you have not named yet while sketching an
 * index is a normal state, not an error.
 *
 * `hidden` is set only by `nav_index`'s filter (a standalone `nav_group`
 * never passes it) and uses the native `hidden` attribute, so a hidden
 * group is still in the document, just not shown, and the query never
 * removes anything from the render tree.
 */
export function GroupCard({
  title,
  desc,
  icon,
  tone,
  children,
  hidden,
}: ResolvedGroupHeader & { children?: ReactNode; hidden?: boolean }): ReactElement {
  const hasTitle = title !== '';

  return (
    <div className={`mk-nav_group mk-nav_group--${tone}`} hidden={hidden}>
      <div className="mk-nav_group__head">
        {icon !== 'none' && (
          <span className="mk-nav_group__icon-tile" aria-hidden="true">
            <Icon name={icon} />
          </span>
        )}
        <span className="mk-nav_group__heading">
          <span
            className={
              hasTitle ? 'mk-nav_group__title' : 'mk-nav_group__title mk-nav_group__title--placeholder'
            }
          >
            {hasTitle ? title : 'untitled group'}
          </span>
          {desc !== '' && <span className="mk-nav_group__desc">{desc}</span>}
        </span>
      </div>
      <div className="mk-nav_group__body">{children}</div>
    </div>
  );
}
