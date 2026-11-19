import { BaseElement, html, on, nothing } from './base-element.js';
import { styles } from './merch-whats-included.css.js';

export class MerchWhatsIncluded extends BaseElement {
    static styles = styles;

    static properties = {
        heading: { type: String, attribute: true },
        mobileRows: { type: Number, attribute: true },
    };

    updated() {
        this.hideSeeMoreEls();
    }

    hideSeeMoreEls() {
        if (this.isMobile) {
            this.rows.forEach((node, index) => {
                if (index >= 5) {
                    node.style.display = this.showAll ? 'flex' : 'none';
                }
            });
        }
    }

    constructor() {
        super();
        this.showAll = false;
        this.mobileRows = this.mobileRows === undefined ? 5 : this.mobileRows;
    }

    toggle() {
        this.showAll = !this.showAll;

        this.dispatchEvent(
            new CustomEvent('hide-see-more-elements', {
                bubbles: true,
                composed: true,
            }),
        );
        this.requestUpdate();
    }

    render() {
        return html`<slot name="heading"></slot>
            <slot name="contentBullets"></slot>
            ${!this.isMobile || !this.bulletsAdded
                ? html`<slot name="content"></slot>`
                : nothing}
            ${this.isMobile &&
            this.rows.length > this.mobileRows &&
            !this.bulletsAdded
                ? html`<div class="see-more">
                      ${this.showAll ? '- See less' : '+ See more'}
                  </div>`
                : nothing}`;
    }

    bindEvents() {
        on(this.shadowRoot.querySelector('.see-more'), 'click', () =>
            this.toggle(),
        );
    }

    get isMobile() {
        return window.matchMedia('(max-width: 767px)').matches;
    }

    get rows() {
        return this.querySelectorAll('[slot="content"] merch-mnemonic-list');
    }

    get bulletsAdded() {
        return !!this.querySelector(
            '[slot="contentBullets"] merch-mnemonic-list',
        );
    }
}

customElements.define('merch-whats-included', MerchWhatsIncluded);
