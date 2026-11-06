import { css } from '../css.js';

const CSS = css`
    merch-card[variant='ccd-suggested'] [slot='heading-xs'] {
        font-size: var(--consonant-merch-card-heading-xxs-font-size);
        line-height: var(--consonant-merch-card-heading-xxs-line-height);
    }

    merch-card[variant='ccd-suggested'] [slot='body-xs'] a {
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
    }

    merch-card[variant='ccd-suggested'] [slot='price'] em {
        font-size: var(--consonant-merch-card-body-xxs-font-size);
        line-height: var(--consonant-merch-card-body-xxs-line-height);
    }

    .spectrum--darkest merch-card[variant='ccd-suggested'] {
        --consonant-merch-card-background-color: rgb(30, 30, 30);
        --consonant-merch-card-heading-xs-color: rgb(239, 239, 239);
        --consonant-merch-card-body-xs-color: rgb(200, 200, 200);
        --consonant-merch-card-border-color: rgb(57, 57, 57);
        --consonant-merch-card-detail-s-color: rgb(162, 162, 162);
        --consonant-merch-card-price-color: rgb(248, 248, 248);
        --merch-color-inline-price-strikethrough: rgb(176, 176, 176);
    }

    .spectrum--darkest merch-card[variant='ccd-suggested']:hover {
        --consonant-merch-card-border-color: rgb(73, 73, 73);
    }
`;

export const CCD_SUGGESTED_AEM_FRAGMENT_MAPPING = {
    backgroundImage: { attribute: 'background-image' },
    badge: true,
    ctas: { slot: 'cta', size: 'M' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    prices: { tag: 'p', slot: 'price' },
    size: [],
    subtitle: { tag: 'h4', slot: 'detail-s' },
    title: { tag: 'h3', slot: 'heading-xs' },
};

export function define({ TemplateLayout, escapeHTML }) {
    class CCDSuggested extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        get stripStyle() {
            if (!this.card.backgroundImage) return '';
            const position = this.card.dir === 'ltr' ? 'left' : 'right';
            return `background:url("${this.card.backgroundImage}");background-size:auto 100%;background-repeat:no-repeat;background-position:${position}`;
        }

        renderLayout() {
            return ` <div style="${escapeHTML(this.stripStyle)}" class="body">
                <div class="header">
                    <div class="top-section">
                        <slot name="icons"></slot>
                        ${this.badge}
                    </div>
                    <div class="headings">
                        <slot name="detail-s"></slot>
                        <slot name="heading-xs"></slot>
                    </div>
                </div>
                <slot name="body-xs"></slot>
                <div class="footer">
                    <slot name="price"></slot>
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot></slot>`;
        }

        async postCardUpdateHook(changedProperties) {
            if (changedProperties.has('backgroundImage'))
                this.styleBackgroundImage();
            await super.postCardUpdateHook();
        }

        styleBackgroundImage() {
            this.card.classList.remove('thin-strip');
            this.card.classList.remove('wide-strip');
            if (!this.card.backgroundImage) {
                // c8 ignore next 2 */
                return;
            }
            const img = new Image();
            img.src = this.card.backgroundImage;
            img.onload = () => {
                if (img.width > 8) {
                    /* c8 ignore next 4 */
                    this.card.classList.add('wide-strip');
                } else if (img.width === 8) {
                    this.card.classList.add('thin-strip');
                }
            };
        }

        static templateStyle = css`
            :host([variant='ccd-suggested']) {
                --consonant-merch-card-background-color: rgb(245, 245, 245);
                --consonant-merch-card-body-xs-color: rgb(75, 75, 75);
                --consonant-merch-card-border-color: rgb(225, 225, 225);
                --consonant-merch-card-detail-s-color: rgb(110, 110, 110);
                --consonant-merch-card-heading-xs-color: rgb(44, 44, 44);
                --merch-color-inline-price-strikethrough: var(
                    --spectrum-gray-600
                );
                --mod-img-height: 38px;

                box-sizing: border-box;
                width: 100%;
                max-width: 305px;
                min-width: 270px;
                min-height: 205px;
                border-radius: 4px;
                display: flex;
                flex-flow: wrap;
                overflow: hidden;
            }

            :host([variant='ccd-slice']) * {
                overflow: hidden;
            }

            :host([variant='ccd-suggested']:hover) {
                --consonant-merch-card-border-color: #cacaca;
            }

            :host([variant='ccd-suggested']) .body {
                height: auto;
                padding: 20px;
                gap: 0;
            }

            :host([variant='ccd-suggested'].thin-strip) .body {
                padding: 20px 20px 20px 28px;
            }

            :host([variant='ccd-suggested']) .header {
                display: flex;
                flex-flow: wrap;
                place-self: flex-start;
                flex-wrap: nowrap;
            }

            :host([variant='ccd-suggested']) .headings {
                padding-inline-start: var(--consonant-merch-spacing-xxs);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            :host([variant='ccd-suggested']) ::slotted([slot='icons']) {
                place-self: center;
            }

            :host([variant='ccd-suggested']) ::slotted([slot='heading-xs']) {
                font-size: var(--consonant-merch-card-heading-xxs-font-size);
                line-height: var(
                    --consonant-merch-card-heading-xxs-line-height
                );
            }

            :host([variant='ccd-suggested']) ::slotted([slot='detail-m']) {
                line-height: var(--consonant-merch-card-detail-m-line-height);
            }

            :host([variant='ccd-suggested']) ::slotted([slot='body-xs']) {
                color: var(--ccd-gray-700-dark);
                padding-top: 8px;
                flex-grow: 1;
            }

            :host([variant='ccd-suggested'].wide-strip)
                ::slotted([slot='body-xs']) {
                padding-inline-start: 48px;
            }

            :host([variant='ccd-suggested'].wide-strip)
                ::slotted([slot='price']) {
                padding-inline-start: 48px;
            }

            :host([variant='ccd-suggested']) ::slotted([slot='price']) {
                font-size: var(--consonant-merch-card-body-xs-font-size);
                line-height: var(--consonant-merch-card-body-xs-line-height);
            }

            :host([variant='ccd-suggested']) ::slotted([slot='cta']) {
                display: flex;
                align-items: center;
                min-width: fit-content;
            }

            :host([variant='ccd-suggested']) .footer {
                display: flex;
                justify-content: space-between;
                flex-grow: 0;
                margin-top: 6px;
                align-items: center;
            }

            :host([variant='ccd-suggested']) div[class$='-badge'] {
                position: static;
                border-radius: 4px;
            }

            :host([variant='ccd-suggested']) .top-section {
                align-items: center;
            }
        `;
    }
    return {
        'ccd-suggested': {
            class: CCDSuggested,
            fragmentMapping: CCD_SUGGESTED_AEM_FRAGMENT_MAPPING,
            style: CCDSuggested.templateStyle,
        },
    };
}
