import { html, nothing } from 'lit';
import { VariantLayout, editorLabel } from './variant-layout.js';
import { CSS, headlessRowStyle } from './headless.css.js';
import {
    makeRefreshBackgroundsDetail,
    makeToggleBackgroundsDetail,
    renderBackgroundsDetailRow,
    renderBackgroundsToggleButton,
} from './backgrounds-preview.js';

/**
 * AEM fragment field → slot mapping so hydrate() can populate all Banner/Blade
 * slots. Covers both the Sticky Banner and Blade blocks, which share the same
 * content shape (title + description + CTAs) and are authored once under this single variant.
 */
export const BANNER_BLADE_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    image: { tag: 'picture', slot: 'image' },
    backgrounds: { tag: 'picture', slot: 'backgrounds' },
    title: { tag: 'p', slot: 'heading-xs', editorLabel: 'Title' },
    description: { tag: 'div', slot: 'body-xs', editorLabel: 'Description' },
    ctas: { slot: 'footer', size: 'm', editorLabel: 'CTA' },
};

/**
 * Slot name to display label for Banner/Blade variant (label + value
 * only, no card). Labels match the editor (merch-card-editor.js). Order defines render order.
 */
const BANNER_BLADE_FIELDS = [
    { slot: 'image', label: 'Image' },
    { slot: 'backgrounds', label: 'Background' },
    {
        slot: 'heading-xs',
        label: editorLabel(
            BANNER_BLADE_AEM_FRAGMENT_MAPPING,
            'title',
            'Card title',
        ),
    },
    {
        slot: 'body-xs',
        label: editorLabel(
            BANNER_BLADE_AEM_FRAGMENT_MAPPING,
            'description',
            'Description',
        ),
    },
    {
        slot: 'footer',
        label: editorLabel(BANNER_BLADE_AEM_FRAGMENT_MAPPING, 'ctas', 'CTAs'),
    },
];

export class BannerBlade extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getGlobalCSS() {
        return CSS;
    }

    toggleBackgroundsDetail = makeToggleBackgroundsDetail(() => this.card);

    refreshBackgroundsDetail = makeRefreshBackgroundsDetail(() => this.card);

    renderLayout() {
        return html`
            <div class="headless">
                ${BANNER_BLADE_FIELDS.map(
                    ({ slot, label }) => html`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value" data-slot="${slot}">
                                <slot
                                    name="${slot}"
                                    @slotchange=${slot === 'backgrounds'
                                        ? this.refreshBackgroundsDetail
                                        : nothing}
                                ></slot>
                                ${slot === 'backgrounds'
                                    ? renderBackgroundsToggleButton(
                                          this.toggleBackgroundsDetail,
                                      )
                                    : nothing}
                            </span>
                        </div>
                        ${slot === 'backgrounds'
                            ? renderBackgroundsDetailRow()
                            : nothing}
                    `,
                )}
            </div>
        `;
    }

    static variantStyle = headlessRowStyle('banner-blade');
}
