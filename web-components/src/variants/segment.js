import { html, css } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './segment.css.js';

export const SEGMENT_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    callout: { tag: 'div', slot: 'callout-content' },
    planType: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-red-700-plans' },
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
    borderColor: { attribute: 'border-color' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};
export class Segment extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    postCardUpdateHook() {
        this.adjustTitleWidth();
    }

    renderLayout() {
        return html` ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="annualPrice"></slot>
                <slot name="priceLabel"></slot>
                <slot name="callout-content"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
            <slot></slot>`;
    }

    static variantStyle = css`
        :host([variant='segment']) {
            min-height: 214px;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }
        :host([variant='segment']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }
    `;
}
