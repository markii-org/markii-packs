import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { hasAnchor } from './children';
import { oneOf, safeImageSrc, safeResolvedImageSrc, safely, str } from './guard';
import { Icon } from './icon';
import './card.css';

const DIRECTIONS = ['next', 'back'] as const;
type Direction = (typeof DIRECTIONS)[number];

interface Still {
  src?: string;
  refused: boolean;
}

/**
 * Reads the `img` attribute. The authored value must be an `http:`, `https:`
 * or relative address. The host's resolver then maps a relative path, in
 * either its string or its object form. Never throws.
 */
function resolveStill(
  raw: unknown,
  resolver: MarkComponentProps['resolveImageSrc'],
): Still {
  return safely<Still>(
    () => {
      const written = str(raw);
      if (written === '') return { refused: false };
      const authored = safeImageSrc(written);
      if (authored === undefined) return { refused: true };
      let candidate = authored;
      if (typeof resolver === 'function') {
        try {
          const answer = resolver(authored);
          if (typeof answer === 'string') candidate = answer;
          else if (answer !== null && typeof answer === 'object' && typeof answer.src === 'string') {
            candidate = answer.src;
          }
        } catch {
          // A throwing resolver leaves the source as written.
        }
      }
      const checked = safeResolvedImageSrc(candidate);
      return checked === undefined ? { refused: true } : { src: checked, refused: false };
    },
    () => ({ refused: true }),
  );
}

/**
 * `:::nav_card{img="..."}`, a link to another page. The first paragraph of
 * the content holds the destination link and is shown as the page name. The
 * rest is a muted preview. `card.css` stretches the first anchor over the
 * whole card, so the card is one link. Never throws.
 */
export function NavCard({ attributes, children, resolveImageSrc }: MarkComponentProps): ReactElement {
  const dir = safely<Direction>(
    () => oneOf<Direction>(attributes?.dir, DIRECTIONS, 'next'),
    () => 'next',
  );
  const label = safely(
    () => str(attributes?.label, dir === 'back' ? 'Previous' : 'Next'),
    () => (dir === 'back' ? 'Previous' : 'Next'),
  );
  const still = safely<Still>(
    () => resolveStill(attributes?.img, resolveImageSrc),
    () => ({ refused: true }),
  );
  const linked = hasAnchor(children);

  const notes: string[] = [];
  if (!linked) notes.push('This card has no link');
  if (still.refused) notes.push('The image was left out');

  const hasStill = still.src !== undefined;
  const classes = ['mk-nav_card', `mk-nav_card--${dir}`];
  if (hasStill) classes.push('mk-nav_card--still');

  const text = (
    <div className="mk-nav_card__text" key="text">
      <div className="mk-nav_card__label">
        {dir === 'back' && <Icon name="back" className="mk-nav_card__arrow" />}
        <span>{label}</span>
        {dir === 'next' && <Icon name="arrow" className="mk-nav_card__arrow" />}
      </div>
      <div className="mk-nav_card__body">{children}</div>
    </div>
  );
  const image = hasStill ? (
    <div className="mk-nav_card__still" key="still">
      <img src={still.src} alt="" loading="lazy" decoding="async" />
    </div>
  ) : null;

  return (
    <div className={classes.join(' ')} title={notes.length > 0 ? notes.join('. ') : undefined}>
      <div className="mk-nav_card__inner">{dir === 'back' ? [image, text] : [text, image]}</div>
    </div>
  );
}
