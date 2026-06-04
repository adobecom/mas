import { LitElement, html, css } from 'lit';

class MasSideNavItem extends LitElement {
    static properties = {
        label: { type: String },
        selected: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            position: relative;
            min-height: 32px;
            max-height: 50px;
            width: 100%;
            border-radius: 8px;
            color: var(--alias-content-neutral-subdued-default, #505050);
            font-family: 'Adobe Clean', sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 400;
            cursor: pointer;
            user-select: none;
            box-sizing: border-box;
            padding-inline: 12px;
            gap: 6px;
            overflow: hidden;
            transition: background-color 0.15s ease;
        }

        :host(:hover:not([disabled])) {
            background-color: var(--spectrum-gray-200, #e1e1e1);
        }

        :host([selected]) {
            color: var(--alias-content-neutral-default, #292929);
            font-weight: 700;
        }

        :host([selected])::before {
            content: '';
            position: absolute;
            left: 4px;
            top: 50%;
            transform: translateY(-50%);
            width: 2px;
            height: 18px;
            border-radius: 4px;
            background-color: var(--palette-gray-800, #292929);
        }

        :host([disabled]) {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }

        ::slotted([slot='icon']) {
            width: 20px;
            height: 20px;
            color: var(--alias-content-neutral-subdued-default, #505050);
        }

        :host([selected]) ::slotted([slot='icon']) {
            color: var(--alias-content-neutral-default, #292929);
        }

        .label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: var(--mas-sidenav-label-display, inline);
        }

        /* No data-collapsed-specific layout — the item keeps full-width
           expanded layout in both modes. The nav's overflow:hidden + 200ms
           width transition handles the visual collapse by clipping the right
           side of the item (which contains the label). The icon stays at a
           fixed x from the nav-left (nav-padding + item-padding = 6 + 12 =
           18px), so it appears centered in the 56px collapsed nav (icon
           center 18+10 = 28 = nav center). No instant property flips. */

        /* End-section item (Advanced tools) — same 12px inline padding as
           the other items so the briefcase icon aligns horizontally with
           Home / Fragments / etc. in both collapsed and expanded states. */
        :host(.bottom) {
            padding-inline: 12px;
        }
    `;

    constructor() {
        super();
        this.selected = false;
        this.disabled = false;
        this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this.handleClick);
    }

    handleClick(event) {
        if (this.disabled) {
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        this.dispatchEvent(
            new CustomEvent('nav-click', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div class="icon-container">
                <slot name="icon"></slot>
            </div>
            <span class="label">${this.label}</span>
        `;
    }
}

customElements.define('mas-side-nav-item', MasSideNavItem);
