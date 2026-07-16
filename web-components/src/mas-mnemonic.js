import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { ifDefined } from 'lit/directives/if-defined.js';

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
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 60px;
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

        .css-tooltip::after {
            content: '';
            position: absolute;
            z-index: 999;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.1s ease,
                visibility 0.1s ease;
        }

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip.tooltip-visible::after,
        .css-tooltip:focus-visible .css-tooltip-body,
        .css-tooltip:focus-visible::after {
            opacity: 1;
            visibility: visible;
        }

        /* Placement variants (CSS-only mode) */
        .css-tooltip.top .css-tooltip-body {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom .css-tooltip-body {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left .css-tooltip-body {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right .css-tooltip-body {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }

        /* Smart-placement mode: JS-computed fixed positioning + inner arrow span */
        .css-tooltip.smart .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            max-width: 200px;
            overflow: visible;
            /* Cancel CSS-only placement transforms/margins from above */
            transform: none;
            margin: 0;
            bottom: auto;
            right: auto;
        }

        /* Hide the ::after arrow in smart mode; inner span is used instead */
        .css-tooltip.smart::after {
            content: none;
        }

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        /* Inner arrow span: positioned on the side facing the icon */
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

        .css-tooltip-body p {
            margin: 0;
        }

        /* Icon-only (no tooltip): keep inline so icons don't block-stack in <p> */
        .icon-only {
            display: inline-block;
        }
    `;

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
