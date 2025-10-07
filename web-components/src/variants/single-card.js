import { html, css } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './single-card.css.js';

export const SINGLE_CARD_AEM_FRAGMENT_MAPPING = {
    backgroundImage: {
        tag: 'div',
        slot: 'image',
    },
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    title: {
        tag: 'h2',
        slot: 'heading-m',
        maxCount: 2000,
        withSuffix: true,
    },
    subtitle: {
        tag: 'p',
        slot: 'heading-xxxs',
        maxCount: 2000,
        withSuffix: true,
    },
    description: {
        tag: 'div',
        slot: 'body-s',
        maxCount: 2000,
        withSuffix: false,
    },
    prices: {
        tag: 'p',
        slot: 'price',
    },
    ctas: {
        slot: 'cta',
        size: 'M',
    },
    mnemonics: {
        size: 's',
    },
    size: ['standard', 'wide'],
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: '--spectrum-gray-300',
            blue: '--spectrum-blue-400',
        },
    },
};

export class SingleCard extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    get aemFragmentMapping() {
        return SINGLE_CARD_AEM_FRAGMENT_MAPPING;
    }

    renderLayout() {
        return html`
            <div class="image-section">
                <slot name="image"></slot>
            </div>
            <div class="content">
                <div class="header">
                    <slot name="heading-m"></slot>
                    <slot name="heading-xxxs"></slot>
                </div>
                <div class="description">
                    <slot name="body-s"></slot>
                    <div class="badge-section">
                        <slot name="badge"></slot>
                    </div>
                    <div class="cta-section">
                        <slot name="cta"></slot>
                    </div>
                </div>
            </div>
        `;
    }

    static variantStyle = css`
        :host([variant='single-card']) {
            --consonant-merch-card-background-color: rgb(255, 255, 255);
            --consonant-merch-card-border-color: rgb(230, 230, 230);
            --consonant-merch-card-body-s-color: rgb(34, 34, 34);
            --merch-color-inline-price-strikethrough: var(--spectrum-gray-600);
            box-sizing: border-box;
            width: 100%;
            border-radius: 8px;
            display: flex;
            flex-direction: row;
            overflow: hidden;
            border: 1px solid var(--consonant-merch-card-border-color);
            background-color: var(--consonant-merch-card-background-color);
        }

        :host([variant='single-card']) .content {
            display: flex;
            flex-direction: column;
            padding: 20px;
            flex: 1;
            gap: 12px;
            justify-content: space-between;
        }

        :host([variant='single-card']) .header {
            display: flex;
            justify-content: space-between;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        :host([variant='single-card']) .badge-section {
            display: flex;
            align-items: center;
        }

        :host([variant='single-card']) .icons-section {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        :host([variant='single-card']) .title-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        :host([variant='single-card']) .description {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        :host([variant='single-card']) .pricing-section {
            display: flex;
            align-items: center;
        }

        :host([variant='single-card']) .cta-section {
            display: flex;
            align-items: center;
        }

        :host([variant='single-card']) .image-section {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }

        :host([variant='single-card']) ::slotted([slot='image']) {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        }

        :host([variant='single-card']) ::slotted([slot='image']) img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        :host([variant='single-card']) ::slotted([slot='heading-xs']) {
            font-size: 18px;
            font-weight: 600;
            line-height: 1.3;
            color: var(--consonant-merch-card-body-s-color);
            margin: 0;
        }

        :host([variant='single-card']) ::slotted([slot='heading-xxs']) {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.4;
            color: var(--spectrum-gray-700);
            margin: 0;
        }

        :host([variant='single-card']) ::slotted([slot='body-s']) {
            font-size: 14px;
            line-height: 1.5;
            color: var(--consonant-merch-card-body-s-color);
            margin: 0;
        }

        :host([variant='single-card']) ::slotted([slot='price']) {
            font-size: 16px;
            font-weight: 600;
            color: var(--consonant-merch-card-body-s-color);
            margin: 0;
        }

        :host([variant='single-card']) div[class$='-badge'] {
            font-size: 12px;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 4px;
            background-color: var(--spectrum-blue-100);
            color: var(--spectrum-blue-800);
        }

        :host([variant='single-card']) ::slotted([slot='cta']) {
            width: 100%;
            margin-top: 50px;
        }
    `;
}
