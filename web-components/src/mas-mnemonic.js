import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styles } from './mas-mnemonic.css.js';

function hasSpectrumTooltip() {
    // Only use Spectrum if ALL required components are available
    return (
        customElements.get('sp-tooltip') !== undefined &&
        customElements.get('overlay-trigger') !== undefined &&
        document.querySelector('sp-theme') !== null
    );
}

export default class MasMnemonic extends LitElement {
    static activeTooltip = null;

    static properties = {
        content: { type: String },
        placement: { type: String },
        variant: { type: String },
        // Icon-based tooltip properties
        src: { type: String },
        size: { type: String },
        tooltipText: { type: String, attribute: 'tooltip-text' },
        tooltipPlacement: { type: String, attribute: 'tooltip-placement' },
        // Support studio's mnemonic attribute names
        mnemonicText: { type: String, attribute: 'mnemonic-text' },
        mnemonicPlacement: { type: String, attribute: 'mnemonic-placement' },
        alt: { type: String },
        // Opt-in viewport-aware JS positioning (used by fries cards)
        smartPlacement: { type: Boolean, attribute: 'smart-placement' },
        // Tooltip visibility state
        tooltipVisible: { type: Boolean, state: true },
        // Computed positioning state for CSS fallback tooltip
        _tooltipTop: { type: Number, state: true },
        _tooltipLeft: { type: Number, state: true },
        _arrowOffset: { type: Number, state: true },
        _computedPlacement: { type: String, state: true },
    };

    static styles = unsafeCSS(styles);

    constructor() {
        super();
        this.content = '';
        this.placement = 'top';
        this.variant = '';
        this.size = 'xs';
        this.smartPlacement = false;
        this.tooltipVisible = false;
        this.lastPointerType = null;
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this._tooltipTop = 0;
        this._tooltipLeft = 0;
        this._arrowOffset = 0;
        this._computedPlacement = 'top';
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('mousedown', this.handleClickOutside);
        // Auto-enable viewport-aware positioning inside fries cards.
        if (
            !this.smartPlacement &&
            this.closest('merch-card[variant="fries"]')
        ) {
            this.smartPlacement = true;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside(event) {
        const path = event.composedPath();
        if (MasMnemonic.activeTooltip === this && !path.includes(this)) {
            this.hideTooltip();
        }
    }

    _computeTooltipPosition() {
        const anchor = this.shadowRoot?.querySelector('.css-tooltip');
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const gap = 14;
        const tooltipMaxWidth = 200;
        const tooltipEstHeight = 60; // conservative estimate before paint

        const body = this.shadowRoot?.querySelector('.css-tooltip-body');
        const tooltipW = body ? body.offsetWidth : tooltipMaxWidth;
        const tooltipH = body ? body.offsetHeight : tooltipEstHeight;

        const preferred = this.effectivePlacement;
        let placement = preferred;

        if (placement === 'top' && rect.top - tooltipH - gap < 0)
            placement = 'bottom';
        else if (placement === 'bottom' && rect.bottom + tooltipH + gap > vh)
            placement = 'top';
        else if (placement === 'left' && rect.left - tooltipW - gap < 0)
            placement = 'right';
        else if (placement === 'right' && rect.right + tooltipW + gap > vw)
            placement = 'left';

        const iconCenterX = rect.left + rect.width / 2;
        const iconCenterY = rect.top + rect.height / 2;
        const arrowSize = 6;
        const clamp = (min, max, v) => Math.max(min, Math.min(max, v));

        let top, left, arrowOffset;

        if (placement === 'top' || placement === 'bottom') {
            top =
                placement === 'top'
                    ? rect.top - tooltipH - gap
                    : rect.bottom + gap;
            left = clamp(0, vw - tooltipW, iconCenterX - tooltipW / 2);
            arrowOffset = clamp(
                arrowSize,
                tooltipW - arrowSize * 2,
                iconCenterX - left - arrowSize,
            );
        } else {
            left =
                placement === 'left'
                    ? rect.left - tooltipW - gap
                    : rect.right + gap;
            top = clamp(0, vh - tooltipH, iconCenterY - tooltipH / 2);
            arrowOffset = clamp(
                arrowSize,
                tooltipH - arrowSize * 2,
                iconCenterY - top - arrowSize,
            );
        }

        this._tooltipTop = top;
        this._tooltipLeft = left;
        this._arrowOffset = arrowOffset;
        this._computedPlacement = placement;
    }

    showTooltip() {
        if (MasMnemonic.activeTooltip && MasMnemonic.activeTooltip !== this) {
            MasMnemonic.activeTooltip.closeOverlay();
            MasMnemonic.activeTooltip.tooltipVisible = false;
            MasMnemonic.activeTooltip.requestUpdate();
        }
        MasMnemonic.activeTooltip = this;
        if (this.smartPlacement) {
            this._computeTooltipPosition();
        }
        this.tooltipVisible = true;
        if (this.smartPlacement) {
            // Re-compute after first paint to use actual rendered dimensions
            this.updateComplete.then(() => this._computeTooltipPosition());
        }
    }

    hideTooltip() {
        if (MasMnemonic.activeTooltip === this) {
            MasMnemonic.activeTooltip = null;
        }
        this.tooltipVisible = false;
    }

    handleTap(e) {
        e.preventDefault();
        if (this.tooltipVisible) {
            this.hideTooltip();
        } else {
            this.showTooltip();
        }
    }

    closeOverlay() {
        const trigger = this.shadowRoot?.querySelector('overlay-trigger');
        if (trigger?.open !== undefined) {
            trigger.open = false;
        }
    }

    get effectiveContent() {
        return (
            this.tooltipText ||
            this.mnemonicText ||
            this.content ||
            this.textContent?.trim() ||
            ''
        );
    }

    get effectivePlacement() {
        return (
            this.tooltipPlacement ||
            this.mnemonicPlacement ||
            this.placement ||
            'top'
        );
    }

    renderIcon() {
        if (!this.src) return html`<slot></slot>`;
        return html`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`;
    }

    render() {
        const content = this.effectiveContent;
        const placement = this.effectivePlacement;

        if (!content) {
            return html`<span class="icon-only">${this.renderIcon()}</span>`;
        }

        // Check for Spectrum components at render time for better timing
        const useSpectrum = hasSpectrumTooltip();

        if (useSpectrum) {
            return html`
                <overlay-trigger
                    placement="${placement}"
                    @sp-opened=${() => this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        slot="hover-content"
                        placement="${placement}"
                        variant="${this.variant}"
                    >
                        ${unsafeHTML(content)}
                    </sp-tooltip>
                </overlay-trigger>
            `;
        }

        const plainContent = content.replace(/<[^>]*>/g, '');
        const visibleClass = this.tooltipVisible ? 'tooltip-visible' : '';
        const pointerHandlers = {
            pointerdown: (e) => {
                this.lastPointerType = e.pointerType;
            },
            pointerenter: (e) =>
                e.pointerType !== 'touch' && this.showTooltip(),
            pointerleave: (e) =>
                e.pointerType !== 'touch' && this.hideTooltip(),
            click: (e) => {
                if (this.lastPointerType === 'touch') this.handleTap(e);
                this.lastPointerType = null;
            },
        };
        const cp = this._computedPlacement;
        const isHorizontal = cp === 'top' || cp === 'bottom';
        const bodyStyle = this.smartPlacement
            ? `top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`
            : undefined;
        const tipOffset = isHorizontal
            ? `left:${this._arrowOffset}px`
            : `top:${this._arrowOffset}px`;

        return html`
            <span
                class="css-tooltip ${this.smartPlacement
                    ? 'smart'
                    : placement} ${visibleClass}"
                tabindex="0"
                role="img"
                aria-label="${plainContent}"
                @pointerdown=${pointerHandlers.pointerdown}
                @pointerenter=${pointerHandlers.pointerenter}
                @pointerleave=${pointerHandlers.pointerleave}
                @click=${pointerHandlers.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${ifDefined(bodyStyle)}>
                    ${unsafeHTML(content)}
                    ${this.smartPlacement
                        ? html`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${cp}"
                              style="${tipOffset}"
                          ></span>`
                        : nothing}
                </span>
            </span>
        `;
    }
}

customElements.define('mas-mnemonic', MasMnemonic);
