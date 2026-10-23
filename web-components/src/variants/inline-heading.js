import { VariantLayout } from './variant-layout';
import { CSS } from './inline-heading.css.js';
export class InlineHeading extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    renderLayout() {
        return ` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${!this.card.customHr ? `<hr />` : ''} ${this.secureLabelFooter}`;
    }
}
