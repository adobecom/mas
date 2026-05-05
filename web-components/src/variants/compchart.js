import { html, css } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './compchart.css.js';

export const COMPCHART_AEM_FRAGMENT_MAPPING = {
    mnemonics: { size: 'l' },
    title: { tag: 'h3', slot: 'heading-xs', maxCount: 100 },
    prices: { tag: 'p', slot: 'prices' },
    description: { tag: 'div', slot: 'body-xs', maxCount: 1000 },
    ctas: { slot: 'footer', size: 'M' },
    features: { tag: 'div', slot: 'features', unwrap: true },
    badge: { tag: 'div', slot: 'badge' },
};

export class Compchart extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    get aemFragmentMapping() {
        return COMPCHART_AEM_FRAGMENT_MAPPING;
    }

    renderLayout() {
        return html`
            <div class="header">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="badge"></slot>
            </div>
            <slot name="prices"></slot>
            <slot name="body-xs"></slot>
            <div class="footer">
                <slot name="footer"></slot>
            </div>
            <!-- features <p slot="<group>@<feature>"> are projected to the
                 enclosing mas-comparison-table by being moved to the table
                 host during hydration; not rendered here. -->
            <slot></slot>
        `;
    }

    static variantStyle = css`
        :host([variant='compchart']) {
            --compchart-card-padding: 16px;
            --compchart-card-min-width: 100px;
            --consonant-merch-card-border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: var(--compchart-card-padding);
            min-width: var(--compchart-card-min-width);
            background: #fff;
            border-radius: var(--consonant-merch-card-border-radius);
            box-sizing: border-box;
        }

        :host([variant='compchart']) .header {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        :host([variant='compchart']) .footer {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: auto;
        }

        :host([variant='compchart']) .footer ::slotted(*) {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        :host([variant='compchart'][primary]) {
            border: 2px solid var(--compchart-primary-tint, #05834E);
        }

        @media (min-width: 900px) {
            :host([variant='compchart']) .footer ::slotted(*) {
                flex-direction: row;
                flex-wrap: wrap;
            }
        }
    `;
}
