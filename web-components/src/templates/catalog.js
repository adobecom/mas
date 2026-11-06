import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-catalog-width: 302px;
        --consonant-merch-card-catalog-icon-size: 40px;
    }

    .collection-container.catalog {
        --merch-card-collection-card-min-height: 330px;
        --merch-card-collection-card-width: var(
            --consonant-merch-card-catalog-width
        );
    }

    merch-sidenav.catalog {
        --merch-sidenav-title-font-size: 15px;
        --merch-sidenav-title-font-weight: 500;
        --merch-sidenav-title-line-height: 19px;
        --merch-sidenav-title-color: rgba(70, 70, 70, 0.87);
        --merch-sidenav-title-padding: 8px 15px 21px;
        --merch-sidenav-item-height: 40px;
        --merch-sidenav-item-inline-padding: 15px;
        --merch-sidenav-item-font-weight: 700;
        --merch-sidenav-item-font-size: 17px;
        --merch-sidenav-item-line-height: normal;
        --merch-sidenav-item-label-top-margin: 8px;
        --merch-sidenav-item-label-bottom-margin: 11px;
        --merch-sidenav-item-icon-top-margin: 11px;
        --merch-sidenav-item-icon-gap: 13px;
        --merch-sidenav-item-selected-background: var(
            --spectrum-gray-300,
            #d5d5d5
        );
        --merch-sidenav-list-item-gap: 5px;
        --merch-sidenav-checkbox-group-padding: 0 15px;
        --merch-sidenav-modal-border-radius: 0;
    }

    merch-sidenav.catalog merch-sidenav-checkbox-group {
        border: none;
    }

    merch-sidenav.catalog merch-sidenav-list:not(:first-of-type) {
        --merch-sidenav-list-gap: 32px;
    }

    .one-merch-card.catalog,
    .two-merch-cards.catalog,
    .three-merch-cards.catalog,
    .four-merch-cards.catalog {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-catalog-width
        );
    }

    merch-card[variant='catalog'][size='wide'],
    merch-card[variant='catalog'][size='super-wide'] {
        width: auto;
    }

    .collection-container.catalog merch-sidenav {
        --merch-sidenav-gap: 10px;
    }

    merch-card-collection-header.catalog {
        --merch-card-collection-header-row-gap: var(
            --consonant-merch-spacing-xs
        );
        --merch-card-collection-header-search-max-width: 244px;
    }

    @media screen and (--mobile-landscape) {
        merch-card-collection-header.catalog {
            --merch-card-collection-header-columns: min-content auto;
        }
    }

    @media screen and (--tablet-up) {
        merch-card-collection-header.catalog {
            --merch-card-collection-header-column-gap: 16px;
        }
    }

    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-catalog-width: 300px;
        }

        merch-card-collection-header.catalog {
            --merch-card-collection-header-result-font-size: 17px;
        }
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] {
        background-color: #000;
        color: var(--color-white, #fff);
        font-size: var(--consonant-merch-card-body-xs-font-size);
        width: fit-content;
        padding: var(--consonant-merch-spacing-xs);
        border-radius: var(--consonant-merch-spacing-xxxs);
        position: absolute;
        top: 55px;
        right: 15px;
        line-height: var(--consonant-merch-card-body-line-height);
    }

    [dir='rtl'] merch-card[variant='catalog'] [slot='action-menu-content'] {
        right: initial;
        left: 15px;
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] ul {
        padding-left: 0;
        padding-bottom: var(--consonant-merch-spacing-xss);
        margin-top: 0;
        margin-bottom: 0;
        list-style-position: inside;
        list-style-type: '• ';
    }

    [dir='rtl'] merch-card[variant='catalog'] [slot='action-menu-content'] ul {
        padding-right: 0;
        padding-left: unset;
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] ul li {
        padding-left: 0;
        line-height: var(--consonant-merch-card-body-line-height);
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] ul li p {
        display: inline;
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] ::marker {
        margin-right: 0;
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] p {
        color: var(--color-white, #fff);
        margin: 0;
    }

    merch-card[variant='catalog'] [slot='action-menu-content'] a {
        color: var(--consonant-merch-card-background-color);
        text-decoration: underline;
    }

    merch-card[variant='catalog'] .payment-details {
        font-size: var(--consonant-merch-card-body-font-size);
        font-style: italic;
        font-weight: 400;
        line-height: var(--consonant-merch-card-body-line-height);
    }

    merch-card[variant='catalog'] [slot='footer'] .spectrum-Link--primary {
        font-size: 15px;
        font-weight: 700;
    }
`;

export const CATALOG_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    badge: true,
    ctas: { slot: 'footer', size: 'm' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    prices: { tag: 'h3', slot: 'heading-xs' },
    shortDescription: {
        tag: 'div',
        slot: 'action-menu-content',
        attributes: { tabindex: '0' },
    },
    size: ['wide', 'super-wide'],
    title: { tag: 'h3', slot: 'heading-xs' },
};

export function define({
    EVENT_MERCH_CARD_ACTION_MENU_TOGGLE,
    TemplateLayout,
    escapeHTML,
    isMobileOrTablet,
}) {
    class Catalog extends TemplateLayout {
        constructor(card) {
            super(card);
        }

        get actionMenu() {
            return this.card.shadowRoot.querySelector('.action-menu');
        }

        get actionMenuContentSlot() {
            return this.card.shadowRoot.querySelector(
                'slot[name="action-menu-content"]',
            );
        }

        get slottedContent() {
            return this.card.querySelector('[slot="action-menu-content"]');
        }

        setIconVisibility(visible) {
            if (this.slottedContent) {
                if (isMobileOrTablet() && this.card.actionMenu) return;
                this.actionMenu?.classList.toggle('invisible', !visible);
                this.actionMenu?.classList.toggle('always-visible', visible);
            }
        }

        setMenuVisibility(open) {
            this.actionMenuContentSlot?.classList.toggle('hidden', !open);
            this.setAriaExpanded(this.actionMenu, open.toString());
            if (open) {
                this.dispatchActionMenuToggle();
                setTimeout(() => {
                    const firstLink = this.slottedContent?.querySelector('a');
                    if (firstLink) firstLink.focus();
                }, 0);
            }
        }

        isMenuOpen() {
            return !this.actionMenuContentSlot?.classList.contains('hidden');
        }

        renderLayout() {
            const actionMenuClass = this.slottedContent
                ? isMobileOrTablet() && this.card.actionMenu
                    ? 'always-visible'
                    : 'invisible'
                : 'hidden';
            const promo =
                '<slot name="promo-text"></slot><slot name="callout-content"></slot>';
            return ` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu ${actionMenuClass}"
                        tabindex="0"
                        aria-expanded="false"
                        aria-hidden="false"
                        role="button"
                    >
                        ${escapeHTML(this.card.actionMenuLabel)} - ${escapeHTML(this.card.title)}
                    </div>
                </div>
                <slot
                    name="action-menu-content"
                    class="action-menu-content ${!this.card.actionMenuContent ? 'hidden' : ''}"
                    >${escapeHTML(this.card.actionMenuContent)}
                </slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-m"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? promo : ''}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? promo : ''}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
        }

        bindEvents(root) {
            const actionMenu = root.querySelector('.action-menu');
            actionMenu.addEventListener('click', this.toggleActionMenu);
            actionMenu.addEventListener('keypress', this.toggleActionMenu);
            actionMenu.addEventListener('focus', this.showActionMenuOnHover);
            actionMenu.addEventListener('blur', this.hideActionMenuOnBlur);
        }

        getGlobalCSS() {
            return CSS;
        }

        dispatchActionMenuToggle = () => {
            this.card.dispatchEvent(
                new CustomEvent(EVENT_MERCH_CARD_ACTION_MENU_TOGGLE, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        card: this.card.name,
                        type: 'action-menu',
                    },
                }),
            );
        };

        toggleActionMenu = (e) => {
            if (
                !this.actionMenuContentSlot ||
                !e ||
                (e.type !== 'click' && e.code !== 'Space' && e.code !== 'Enter')
            )
                return;

            e.preventDefault();
            e.stopPropagation();
            this.setMenuVisibility(!this.isMenuOpen());
        };

        toggleActionMenuFromCard = (e) => {
            //beware this is an event on card, so this points to the card, not the layout
            const retract = e?.type === 'mouseleave' ? true : undefined;
            this.card.blur();
            this.setIconVisibility(false);
            if (!this.actionMenuContentSlot) return;

            if (e?.type === 'mouseleave') {
                this.setMenuVisibility(false);
            }
        };

        showActionMenuOnHover = () => {
            if (!this.actionMenu) return;
            this.setIconVisibility(true);
        };

        hideActionMenu = () => {
            this.setMenuVisibility(false);
            this.setIconVisibility(false);
        };

        hideActionMenuOnBlur = (e) => {
            if (
                e.relatedTarget === this.actionMenu ||
                this.actionMenu?.contains(e.relatedTarget)
            )
                return;

            if (this.slottedContent?.contains(e.relatedTarget)) return;

            if (this.isMenuOpen()) {
                this.setMenuVisibility(false);
            }

            if (!this.card.contains(e.relatedTarget)) {
                this.setIconVisibility(false);
            }
        };

        handleCardFocusOut = (e) => {
            if (
                e.relatedTarget === this.actionMenu ||
                this.actionMenu?.contains(e.relatedTarget) ||
                e.relatedTarget === this.card
            ) {
                return;
            }

            if (
                this.slottedContent &&
                (e.target === this.slottedContent ||
                    this.slottedContent.contains(e.target))
            ) {
                if (!this.slottedContent.contains(e.relatedTarget)) {
                    this.setMenuVisibility(false);
                }
            }

            if (!this.card.contains(e.relatedTarget) && !this.isMenuOpen()) {
                this.setIconVisibility(false);
            }
        };

        handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                this.hideActionMenu();
                this.actionMenu?.focus();
            }
        };

        setAriaExpanded(element, value) {
            element.setAttribute('aria-expanded', value);
        }

        connectedCallbackHook() {
            this.card.addEventListener(
                'mouseenter',
                this.showActionMenuOnHover,
            );
            this.card.addEventListener(
                'mouseleave',
                this.toggleActionMenuFromCard,
            );
            this.card.addEventListener('focusin', this.showActionMenuOnHover);
            this.card.addEventListener('focusout', this.handleCardFocusOut);
            this.card.addEventListener('keydown', this.handleKeyDown);
        }

        disconnectedCallbackHook() {
            this.card.removeEventListener(
                'mouseenter',
                this.showActionMenuOnHover,
            );
            this.card.removeEventListener(
                'mouseleave',
                this.toggleActionMenuFromCard,
            );
            this.card.removeEventListener(
                'focusin',
                this.showActionMenuOnHover,
            );
            this.card.removeEventListener('focusout', this.handleCardFocusOut);
            this.card.removeEventListener('keydown', this.handleKeyDown);
        }

        static templateStyle = css`
            :host([variant='catalog']) {
                min-height: 330px;
                width: var(--consonant-merch-card-catalog-width);
            }

            .body .catalog-badge {
                display: flex;
                height: fit-content;
                flex-direction: column;
                width: fit-content;
                max-width: 140px;
                border-radius: 5px;
                position: relative;
                top: 0;
                margin-left: var(--consonant-merch-spacing-xxs);
                box-sizing: border-box;
            }

            :host([variant='catalog']) .action-menu:dir(rtl) {
                right: initial;
                left: 16px;
            }
        `;
    }
    return {
        catalog: {
            class: Catalog,
            fragmentMapping: CATALOG_AEM_FRAGMENT_MAPPING,
            style: Catalog.templateStyle,
        },
    };
}
