import { html, nothing } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './full-pricing-express.css.js';

export const FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
    title: {
        tag: 'h3',
        slot: 'heading-xs',
        maxCount: 250,
        withSuffix: true,
    },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-blue-400',
    },
    allowedBadgeColors: [
        'spectrum-blue-400',
        'spectrum-gray-300',
        'spectrum-yellow-300',
        'gradient-purple-blue',
        'gradient-firefly-spectrum',
    ],
    description: {
        tag: 'div',
        slot: 'body-s',
        maxCount: 2000,
        withSuffix: false,
    },
    shortDescription: {
        tag: 'div',
        slot: 'short-description',
        maxCount: 3000,
        withSuffix: false,
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Price description',
    },
    prices: {
        tag: 'div',
        slot: 'price',
    },
    trialBadge: {
        tag: 'div',
        slot: 'trial-badge',
    },
    ctas: {
        slot: 'cta',
        size: 'XL',
    },
    mnemonics: {
        size: 'xs',
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: 'var(--spectrum-gray-300)',
            blue: 'var(--spectrum-blue-400)',
            'gradient-purple-blue':
                'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
            'gradient-firefly-spectrum':
                'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
        },
    },
    showAllSpectrumColors: true,
    multiWhatsIncluded: 'true',
    disabledAttributes: [],
};

export class FullPricingExpress extends VariantLayout {
    static SYNCED_SECTIONS = [
        'header',
        'short-description',
        'price-container',
        'cta',
    ];

    getGlobalCSS() {
        return CSS;
    }

    get aemFragmentMapping() {
        return FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
    }

    get headingSelector() {
        return '[slot="heading-xs"]';
    }

    get badge() {
        const badgeElement = this.card.querySelector('[slot="badge"]');
        return html`<div
            class="badge-wrapper"
            style="${badgeElement ? '' : 'visibility: hidden'}"
        >
            <slot name="badge"></slot>
        </div>`;
    }

    async waitForTitleFont() {
        const title = this.card.querySelector(this.headingSelector);
        if (title && document.fonts?.load) {
            const style = window.getComputedStyle(title);
            const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            await document.fonts
                .load(font, title.textContent)
                .catch(() => null);
        }
        await document.fonts.ready;
    }

    async syncHeights() {
        await this.waitForTitleFont();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (this.card.getBoundingClientRect().width <= 2) return;
        const sectionEntries = FullPricingExpress.SYNCED_SECTIONS.map(
            (name) => ({
                name,
                getElement: (card) =>
                    card.shadowRoot?.querySelector(`.${name}`),
            }),
        );
        const container = this.getContainer();
        const cards = container
            ? container.querySelectorAll(
                  `merch-card[variant="${this.card.variant}"]`,
              )
            : [this.card];
        const descriptionRowSelector = '[slot="body-s"] > *';
        const descriptionRows = Math.max(
            0,
            ...Array.from(
                cards,
                (card) => card.querySelectorAll(descriptionRowSelector).length,
            ),
        );
        const rowEntries = Array.from(
            { length: descriptionRows },
            (_, index) => ({
                name: `description-row-${index}`,
                getElement: (card) =>
                    card.querySelectorAll(descriptionRowSelector)[index],
            }),
        );
        this.syncRowHeights([...sectionEntries, ...rowEntries]);
    }

    async postCardUpdateHook() {
        if (!this.card.isConnected) return;
        await super.postCardUpdateHook();

        const container = this.getContainer();
        if (container) {
            const cards = container.querySelectorAll(
                `merch-card[variant="${this.card.variant}"]`,
            );
            const CTA_LONG_TEXT_CHAR_THRESHOLD = 49;
            cards.forEach((card) => {
                card.classList.remove('small-font-size-button');
                const ctas = card.querySelectorAll(
                    '[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]',
                );
                ctas.forEach((cta) => {
                    const isLong =
                        cta.textContent.trim().length >
                        CTA_LONG_TEXT_CHAR_THRESHOLD;
                    cta.classList.toggle('small-font-size-button', isLong);
                });
            });
        }

        if (window.matchMedia('(min-width: 768px)').matches) {
            this.syncHeights();
        }
    }

    resyncOnReflow() {
        const width = this.card.getBoundingClientRect().width;
        if (width <= 2) return;
        const title = this.card.querySelector(this.headingSelector);
        const titleHeight = title
            ? Math.round(title.getBoundingClientRect().height)
            : 0;
        const key = `${Math.round(width)}:${titleHeight}`;
        if (key === this.lastSyncedKey) return;
        this.lastSyncedKey = key;
        this.syncHeights();
    }

    connectedCallbackHook() {
        if (!this.card || typeof ResizeObserver === 'undefined') return;
        this.lastSyncedKey = '';
        this.sizeObserver = new ResizeObserver(() => this.resyncOnReflow());
        this.sizeObserver.observe(this.card);
        const title = this.card.querySelector(this.headingSelector);
        if (title) this.sizeObserver.observe(title);
    }

    disconnectedCallbackHook() {
        this.sizeObserver?.disconnect();
        this.sizeObserver = null;
    }

    renderLayout() {
        return html`
            ${this.badge}
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <div class="icons">
                        <slot name="icons"></slot>
                    </div>
                </div>
                <div class="short-description">
                    <slot name="short-description"></slot>
                </div>
                <div class="price-container">
                    <slot name="trial-badge"></slot>
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
                <div class="description">
                    <slot name="body-s"></slot>
                </div>
            </div>
            <slot></slot>
        `;
    }

    static variantStyle = SHADOW_CSS;
}
