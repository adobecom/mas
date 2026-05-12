import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

function hasSpectrumTooltip() {
    // Only use Spectrum if ALL required components are available
    return (
        customElements.get('sp-tooltip') !== undefined &&
        customElements.get('overlay-trigger') !== undefined &&
        document.querySelector('sp-theme') !== null
    );
}

/**
 * MasMnemonic - A web component that handles mnemonics (icons with optional tooltips) within MAS
 * Automatically detects if Spectrum Web Components are available and renders appropriately
 */
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
        // Tooltip visibility state
        tooltipVisible: { type: Boolean, state: true },
        // Computed positioning state for CSS fallback tooltip
        _tooltipTop: { type: Number, state: true },
        _tooltipLeft: { type: Number, state: true },
        _arrowOffset: { type: Number, state: true },
        _computedPlacement: { type: String, state: true },
    };

    static styles = css`
        :host {
            display: contents;
            overflow: visible;
        }

        /* CSS tooltip styles - these are local fallbacks, main styles in global.css.js */
        .css-tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
        }

        .css-tooltip .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 200px;
            overflow: visible;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip:focus-visible .css-tooltip-body {
            opacity: 1;
            visibility: visible;
        }

        /* Arrow: child of body, positioned on the side facing the icon */
        .css-tooltip-tip.top {
            top: 100%;
            border-top-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.bottom {
            top: -6px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.left {
            left: 100%;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.right {
            left: -6px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `;

    constructor() {
        super();
        this.content = '';
        this.placement = 'top';
        this.variant = 'info';
        this.size = 'xs';
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

        // Measure actual tooltip body if already rendered
        const body = this.shadowRoot?.querySelector('.css-tooltip-body');
        const tooltipW = body ? body.offsetWidth : tooltipMaxWidth;
        const tooltipH = body ? body.offsetHeight : tooltipEstHeight;

        const preferred = this.effectivePlacement;
        let placement = preferred;

        // Flip logic
        if (placement === 'top' && rect.top - tooltipH - gap < 0) {
            placement = 'bottom';
        } else if (placement === 'bottom' && rect.bottom + tooltipH + gap > vh) {
            placement = 'top';
        } else if (placement === 'left' && rect.left - tooltipW - gap < 0) {
            placement = 'right';
        } else if (placement === 'right' && rect.right + tooltipW + gap > vw) {
            placement = 'left';
        }

        const iconCenterX = rect.left + rect.width / 2;
        const iconCenterY = rect.top + rect.height / 2;
        const arrowSize = 6;

        let top, left, arrowOffset;

        if (placement === 'top') {
            top = rect.top - tooltipH - gap;
            // Center horizontally, clamp to viewport
            left = Math.max(
                0,
                Math.min(vw - tooltipW, iconCenterX - tooltipW / 2),
            );
            // Arrow left offset relative to tooltip left edge, pointing at icon center
            arrowOffset = Math.max(
                arrowSize,
                Math.min(tooltipW - arrowSize * 2, iconCenterX - left - arrowSize),
            );
        } else if (placement === 'bottom') {
            top = rect.bottom + gap;
            left = Math.max(
                0,
                Math.min(vw - tooltipW, iconCenterX - tooltipW / 2),
            );
            arrowOffset = Math.max(
                arrowSize,
                Math.min(tooltipW - arrowSize * 2, iconCenterX - left - arrowSize),
            );
        } else if (placement === 'left') {
            left = rect.left - tooltipW - gap;
            // Center vertically, clamp to viewport
            top = Math.max(
                0,
                Math.min(vh - tooltipH, iconCenterY - tooltipH / 2),
            );
            // Arrow top offset relative to tooltip top edge, pointing at icon center
            arrowOffset = Math.max(
                arrowSize,
                Math.min(tooltipH - arrowSize * 2, iconCenterY - top - arrowSize),
            );
        } else {
            // right
            left = rect.right + gap;
            top = Math.max(
                0,
                Math.min(vh - tooltipH, iconCenterY - tooltipH / 2),
            );
            arrowOffset = Math.max(
                arrowSize,
                Math.min(tooltipH - arrowSize * 2, iconCenterY - top - arrowSize),
            );
        }

        this._tooltipTop = top;
        this._tooltipLeft = left;
        this._arrowOffset = arrowOffset;
        this._computedPlacement = placement;

        // Store anchor rect for arrow absolute positioning in render
        this._anchorRect = rect;
    }

    showTooltip() {
        if (MasMnemonic.activeTooltip && MasMnemonic.activeTooltip !== this) {
            MasMnemonic.activeTooltip.closeOverlay();
            MasMnemonic.activeTooltip.tooltipVisible = false;
            MasMnemonic.activeTooltip.requestUpdate();
        }
        MasMnemonic.activeTooltip = this;
        this._computeTooltipPosition();
        this.tooltipVisible = true;
        // Re-compute after first paint to use actual rendered dimensions
        this.updateComplete.then(() => this._computeTooltipPosition());
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
        return this.tooltipText || this.mnemonicText || this.content || '';
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
            return this.renderIcon();
        }

        // Check for Spectrum components at render time for better timing
        const useSpectrum = hasSpectrumTooltip();

        if (useSpectrum) {
            // Use Spectrum tooltip with singleton dismiss logic
            return html`
                <overlay-trigger
                    placement="${placement}"
                    @sp-opened=${() => this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${placement}"
                        variant="${this.variant}"
                    >
                        ${unsafeHTML(content)}
                    </sp-tooltip>
                </overlay-trigger>
            `;
        } else {
            // Use CSS tooltip with pointerType-aware handlers
            // Mouse/pen: hover to show/hide via pointerenter/leave
            // Touch: tap to toggle via click (pointerType === 'touch')
            const plainContent = content.replace(/<[^>]*>/g, '');
            const cp = this._computedPlacement;
            const isHorizontal = cp === 'top' || cp === 'bottom';
            const bodyStyle = `top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`;
            const tipOffset = isHorizontal
                ? `left:${this._arrowOffset}px`
                : `top:${this._arrowOffset}px`;
            return html`
                <span
                    class="css-tooltip ${this.tooltipVisible
                        ? 'tooltip-visible'
                        : ''}"
                    tabindex="0"
                    role="img"
                    aria-label="${plainContent}"
                    @pointerdown=${(e) => {
                        this.lastPointerType = e.pointerType;
                    }}
                    @pointerenter=${(e) =>
                        e.pointerType !== 'touch' && this.showTooltip()}
                    @pointerleave=${(e) =>
                        e.pointerType !== 'touch' && this.hideTooltip()}
                    @click=${(e) => {
                        if (this.lastPointerType === 'touch') this.handleTap(e);
                        this.lastPointerType = null;
                    }}
                >
                    ${this.renderIcon()}
                    <span class="css-tooltip-body" style="${bodyStyle}">
                        ${unsafeHTML(content)}
                        <span
                            aria-hidden="true"
                            role="presentation"
                            class="css-tooltip-tip ${cp}"
                            style="${tipOffset}"
                        ></span>
                    </span>
                </span>
            `;
        }
    }
}

customElements.define('mas-mnemonic', MasMnemonic);
