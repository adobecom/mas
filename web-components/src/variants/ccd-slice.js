import { VariantLayout } from './variant-layout.js';
import { html } from 'lit';
import { CSS, SHADOW_CSS } from './ccd-slice.css.js';

export const CCD_SLICE_AEM_FRAGMENT_MAPPING = {
    backgroundImage: { tag: 'div', slot: 'image' },
    badge: true,
    ctas: { slot: 'footer', size: 'S' },
    description: { tag: 'div', slot: 'body-s' },
    mnemonics: { size: 'm' },
    size: ['wide'],
};

export class CCDSlice extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return html` <div class="content">
                <div class="top-section">
                    <slot name="icons"></slot>
                    ${this.badge}
                </div>
                <slot name="body-s"></slot>
                <slot name="footer"></slot>
            </div>
            <slot name="image"></slot>
            <slot></slot>`;
    }

    static variantStyle = SHADOW_CSS;
}
