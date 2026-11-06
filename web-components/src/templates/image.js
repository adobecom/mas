import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-image-width: 300px;
        --merch-card-collection-card-width: var(
            --consonant-merch-card-image-width
        );
    }

    .one-merch-card.image,
    .two-merch-cards.image,
    .three-merch-cards.image,
    .four-merch-cards.image,
    .one-merch-card:has(merch-card[variant='image']),
    .two-merch-cards:has(merch-card[variant='image']),
    .three-merch-cards:has(merch-card[variant='image']),
    .four-merch-cards:has(merch-card[variant='image']) {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-image-width
        );
        grid-template-columns: minmax(
            300px,
            var(--consonant-merch-card-image-width)
        );
    }

    .section.one-merch-card:has(merch-card[variant='image']) > .content,
    .section[class*='-merch-cards']:has(merch-card[variant='image'])
        > .content {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-image-width
        );
    }

    /* Sections inside tabs/fragments that don't receive the .image class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
    .one-merch-card:has(merch-card[variant='image']) .content,
    .two-merch-cards:has(merch-card[variant='image']) .content,
    .three-merch-cards:has(merch-card[variant='image']) .content,
    .four-merch-cards:has(merch-card[variant='image']) .content {
        display: contents;
    }

    .one-merch-card.section merch-card[variant='image'],
    .one-merch-card:has(merch-card[variant='image'])
        merch-card[variant='image'] {
        width: auto;
        max-width: var(--consonant-merch-card-image-width);
        margin: 0 auto;
    }

    @media screen and (--tablet-up) {
        .two-merch-cards.image,
        .three-merch-cards.image,
        .four-merch-cards.image,
        .two-merch-cards:has(merch-card[variant='image']),
        .three-merch-cards:has(merch-card[variant='image']),
        .four-merch-cards:has(merch-card[variant='image']) {
            grid-template-columns: repeat(
                2,
                minmax(300px, var(--consonant-merch-card-image-width))
            );
        }
    }

    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-image-width: 378px;
        }

        .three-merch-cards.image,
        .three-merch-cards:has(merch-card[variant='image']) {
            grid-template-columns: repeat(
                3,
                var(--consonant-merch-card-image-width)
            );
        }

        .four-merch-cards.image,
        .four-merch-cards:has(merch-card[variant='image']) {
            grid-template-columns: repeat(
                auto-fit,
                var(--consonant-merch-card-image-width)
            );
        }
    }
`;

export const IMAGE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-yellow-300-plans',
    },
    badgeIcon: true,
    borderColor: { attribute: 'border-color' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    ctas: { slot: 'footer', size: 'm' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    prices: { tag: 'h3', slot: 'heading-xs' },
    promoText: { tag: 'p', slot: 'promo-text' },
    size: ['wide', 'super-wide'],
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'body-xxs' },
    backgroundImage: { tag: 'div', slot: 'bg-image' },
};

export function define({ TemplateLayout, escapeHTML }) {
    class Image extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        getGlobalCSS() {
            return CSS;
        }

        renderLayout() {
            return `<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${
                    this.promoBottom
                        ? `<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>`
                        : `<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`
                }
            </div>
            ${
                this.evergreen
                    ? `
                      <div
                          class="detail-bg-container"
                          style="background: ${escapeHTML(this.card['detailBg'])}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  `
                    : `
                      <hr />
                      ${this.secureLabelFooter}
                  `
            }`;
        }

        static templateStyle = css`
            :host([variant='image']) {
                min-height: 330px;
                width: var(--consonant-merch-card-image-width);
                background:
                    linear-gradient(white, white) padding-box,
                    var(--consonant-merch-card-border-color, #dadada) border-box;
                border: 1px solid transparent;
            }

            :host([variant='image']) ::slotted([slot='badge']) {
                position: absolute;
                top: 16px;
                right: 0px;
            }

            :host-context([dir='rtl'])
                :host([variant='image'])
                ::slotted([slot='badge']) {
                left: 0px;
                right: initial;
            }
        `;
    }
    return {
        image: {
            class: Image,
            fragmentMapping: IMAGE_AEM_FRAGMENT_MAPPING,
            style: Image.templateStyle,
        },
    };
}
