import { css } from './css.js';
import { escapeHTML } from './utils.js';

function hasSpectrumTooltip() {
    // Only use Spectrum if ALL required components are available
    return (
        customElements.get('sp-tooltip') !== undefined &&
        customElements.get('overlay-trigger') !== undefined &&
        document.querySelector('sp-theme') !== null
    );
}

export default class MasMnemonic extends HTMLElement {
    static activeTooltip = null;

    static observedAttributes = [
        'content',
        'placement',
        'variant',
        'src',
        'size',
        'tooltip-text',
        'tooltip-placement',
        'mnemonic-text',
        'mnemonic-placement',
        'alt',
        'smart-placement',
    ];

    static styles = css`
        :host {
            display: contents;
            overflow: visible;
        }

        /* CSS tooltip styles - these are local fallbacks, main styles in global.css */
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

    #markup;
    #tooltipVisible = false;
    #tooltipTop = 0;
    #tooltipLeft = 0;
    #arrowOffset = 0;
    #computedPlacement = 'top';
    #updatePending = false;
    #updatePromise;
    #resolveConnected;
    #connected = new Promise((resolve) => {
        this.#resolveConnected = resolve;
    });

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.lastPointerType = null;
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.requestUpdate();
    }

    get content() {
        return this.getAttribute('content') ?? '';
    }

    set content(value) {
        setAttribute(this, 'content', value);
    }

    get placement() {
        return this.getAttribute('placement') ?? 'top';
    }

    set placement(value) {
        setAttribute(this, 'placement', value);
    }

    get variant() {
        return this.getAttribute('variant') ?? '';
    }

    set variant(value) {
        setAttribute(this, 'variant', value);
    }

    get src() {
        return this.getAttribute('src') ?? undefined;
    }

    set src(value) {
        setAttribute(this, 'src', value);
    }

    get size() {
        return this.getAttribute('size') ?? 'xs';
    }

    set size(value) {
        setAttribute(this, 'size', value);
    }

    get tooltipText() {
        return this.getAttribute('tooltip-text') ?? undefined;
    }

    set tooltipText(value) {
        setAttribute(this, 'tooltip-text', value);
    }

    get tooltipPlacement() {
        return this.getAttribute('tooltip-placement') ?? undefined;
    }

    set tooltipPlacement(value) {
        setAttribute(this, 'tooltip-placement', value);
    }

    get mnemonicText() {
        return this.getAttribute('mnemonic-text') ?? undefined;
    }

    set mnemonicText(value) {
        setAttribute(this, 'mnemonic-text', value);
    }

    get mnemonicPlacement() {
        return this.getAttribute('mnemonic-placement') ?? undefined;
    }

    set mnemonicPlacement(value) {
        setAttribute(this, 'mnemonic-placement', value);
    }

    get alt() {
        return this.getAttribute('alt') ?? undefined;
    }

    set alt(value) {
        setAttribute(this, 'alt', value);
    }

    get smartPlacement() {
        return this.hasAttribute('smart-placement');
    }

    set smartPlacement(value) {
        this.toggleAttribute('smart-placement', Boolean(value));
    }

    get tooltipVisible() {
        return this.#tooltipVisible;
    }

    set tooltipVisible(value) {
        if (Object.is(value, this.#tooltipVisible)) return;
        this.#tooltipVisible = value;
        this.requestUpdate();
    }

    get _tooltipTop() {
        return this.#tooltipTop;
    }

    set _tooltipTop(value) {
        if (Object.is(value, this.#tooltipTop)) return;
        this.#tooltipTop = value;
        this.requestUpdate();
    }

    get _tooltipLeft() {
        return this.#tooltipLeft;
    }

    set _tooltipLeft(value) {
        if (Object.is(value, this.#tooltipLeft)) return;
        this.#tooltipLeft = value;
        this.requestUpdate();
    }

    get _arrowOffset() {
        return this.#arrowOffset;
    }

    set _arrowOffset(value) {
        if (Object.is(value, this.#arrowOffset)) return;
        this.#arrowOffset = value;
        this.requestUpdate();
    }

    get _computedPlacement() {
        return this.#computedPlacement;
    }

    set _computedPlacement(value) {
        if (Object.is(value, this.#computedPlacement)) return;
        this.#computedPlacement = value;
        this.requestUpdate();
    }

    connectedCallback() {
        for (const property of PROPERTIES) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
        this.#resolveConnected();
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
        window.removeEventListener('mousedown', this.handleClickOutside);
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue !== value) this.requestUpdate();
    }

    requestUpdate() {
        if (this.#updatePending) return;
        this.#updatePending = true;
        this.#updatePromise = this.#enqueueUpdate();
    }

    get updateComplete() {
        return this.#updatePromise.then(() =>
            this.#updatePending ? this.updateComplete : true,
        );
    }

    async #enqueueUpdate() {
        await this.#connected;
        this.#updatePending = false;
        this.#render();
        return true;
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

    get iconMarkup() {
        if (!this.src) return '<slot></slot>';
        return `<merch-icon src="${escapeHTML(this.src)}" size="${escapeHTML(this.size)}"></merch-icon>`;
    }

    get contentMarkup() {
        const content = this.effectiveContent;
        const placement = escapeHTML(this.effectivePlacement);
        const icon = this.iconMarkup;
        if (!content) return `<span class="icon-only">${icon}</span>`;
        // Check for Spectrum components at render time for better timing
        if (hasSpectrumTooltip()) {
            return `<overlay-trigger placement="${placement}">
                <span slot="trigger">${icon}</span>
                <sp-tooltip slot="hover-content" placement="${placement}" variant="${escapeHTML(this.variant)}">${content}</sp-tooltip>
            </overlay-trigger>`;
        }
        const plainContent = escapeHTML(content.replace(/<[^>]*>/g, ''));
        const tip = this.smartPlacement
            ? '<span aria-hidden="true" role="presentation" class="css-tooltip-tip"></span>'
            : '';
        return `<span class="css-tooltip ${this.smartPlacement ? 'smart' : placement}" tabindex="0" role="img" aria-label="${plainContent}">
            ${icon}
            <span class="css-tooltip-body">${content}${tip}</span>
        </span>`;
    }

    #bindListeners() {
        this.shadowRoot
            .querySelector('overlay-trigger')
            ?.addEventListener('sp-opened', () => this.showTooltip());
        const wrapper = this.shadowRoot.querySelector('.css-tooltip');
        if (!wrapper) return;
        wrapper.addEventListener('pointerdown', (e) => {
            this.lastPointerType = e.pointerType;
        });
        wrapper.addEventListener(
            'pointerenter',
            (e) => e.pointerType !== 'touch' && this.showTooltip(),
        );
        wrapper.addEventListener(
            'pointerleave',
            (e) => e.pointerType !== 'touch' && this.hideTooltip(),
        );
        wrapper.addEventListener('click', (e) => {
            if (this.lastPointerType === 'touch') this.handleTap(e);
            this.lastPointerType = null;
        });
    }

    #render() {
        const markup = this.contentMarkup;
        if (markup !== this.#markup) {
            this.#markup = markup;
            this.shadowRoot.innerHTML = markup;
            this.#bindListeners();
        }
        const wrapper = this.shadowRoot.querySelector('.css-tooltip');
        if (!wrapper) return;
        wrapper.classList.toggle('tooltip-visible', this.tooltipVisible);
        if (!this.smartPlacement) return;
        const cp = this._computedPlacement;
        const isHorizontal = cp === 'top' || cp === 'bottom';
        wrapper.querySelector('.css-tooltip-body').style.cssText =
            `top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`;
        const tip = wrapper.querySelector('.css-tooltip-tip');
        tip.className = `css-tooltip-tip ${cp}`;
        tip.style.cssText = isHorizontal
            ? `left:${this._arrowOffset}px`
            : `top:${this._arrowOffset}px`;
    }
}

const PROPERTIES = [
    'content',
    'placement',
    'variant',
    'src',
    'size',
    'tooltipText',
    'tooltipPlacement',
    'mnemonicText',
    'mnemonicPlacement',
    'alt',
    'smartPlacement',
];

function setAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MasMnemonic.styles);

customElements.define('mas-mnemonic', MasMnemonic);
