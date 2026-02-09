import { html, css, LitElement, nothing } from 'lit';

export class MerchWhatsIncluded extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
            row-gap: 10px;
        }

        :host([has-bullets]) {
            flex-direction: column;
            align-items: start;
        }

        ::slotted([slot='heading']) {
            font-size: 14px;
            font-weight: 700;
            margin-right: 16px;
        }

        ::slotted([slot='content']) {
            display: contents;
        }

        ::slotted([slot='contentBullets']) {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 5px 0;
        }

        .hidden {
            display: none;
        }

        .see-more {
            font-size: 14px;
            text-decoration: underline;
            color: var(--link-color-dark);
        }
    `;

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
                ? html`<div @click=${this.toggle} class="see-more">
                      ${this.showAll ? '- See less' : '+ See more'}
                  </div>`
                : nothing}`;
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
