import { html } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './ccd-suggested.css.js';

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

export class CCDSuggested extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    get stripStyle() {
        if (!this.card.backgroundImage) return '';
        return `
            background: url("${this.card.backgroundImage}");
        background-size: auto 100%;
        background-repeat: no-repeat;
        background-position: ${this.card.dir === 'ltr' ? 'left' : 'right'};
        `;
    }

    renderLayout() {
        return html` <div style="${this.stripStyle}" class="body">
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

    static variantStyle = SHADOW_CSS;
}
