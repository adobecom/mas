var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/mas-mnemonic.js
import { LitElement, html, css } from "./lit-all.min.js";
import { unsafeHTML } from "./lit-all.min.js";
function hasSpectrumTooltip() {
  return customElements.get("sp-tooltip") !== void 0 && customElements.get("overlay-trigger") !== void 0 && document.querySelector("sp-theme") !== null;
}
var _MasMnemonic = class _MasMnemonic extends LitElement {
  constructor() {
    super();
    this.content = "";
    this.placement = "top";
    this.variant = "info";
    this.size = "xs";
    this.tooltipVisible = false;
    this.lastPointerType = null;
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("mousedown", this.handleClickOutside);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.handleClickOutside);
  }
  handleClickOutside(event) {
    const path = event.composedPath();
    if (_MasMnemonic.activeTooltip === this && !path.includes(this)) {
      this.hideTooltip();
    }
  }
  showTooltip() {
    if (_MasMnemonic.activeTooltip && _MasMnemonic.activeTooltip !== this) {
      _MasMnemonic.activeTooltip.closeOverlay();
      _MasMnemonic.activeTooltip.tooltipVisible = false;
      _MasMnemonic.activeTooltip.requestUpdate();
    }
    _MasMnemonic.activeTooltip = this;
    this.tooltipVisible = true;
  }
  hideTooltip() {
    if (_MasMnemonic.activeTooltip === this) {
      _MasMnemonic.activeTooltip = null;
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
    const trigger = this.shadowRoot?.querySelector("overlay-trigger");
    if (trigger?.open !== void 0) {
      trigger.open = false;
    }
  }
  get effectiveContent() {
    return this.tooltipText || this.mnemonicText || this.content || "";
  }
  get effectivePlacement() {
    return this.tooltipPlacement || this.mnemonicPlacement || this.placement || "top";
  }
  renderIcon() {
    if (!this.src) return html`<slot></slot>`;
    if (this.src.startsWith("sp-icon-")) {
      return html`${unsafeHTML(`<${this.src} size="${this.size || "m"}"></${this.src}>`)}`;
    }
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
    const useSpectrum = hasSpectrumTooltip();
    if (useSpectrum) {
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
                        ${content}
                    </sp-tooltip>
                </overlay-trigger>
            `;
    } else {
      return html`
                <span
                    class="css-tooltip ${placement} ${this.tooltipVisible ? "tooltip-visible" : ""}"
                    data-tooltip="${content}"
                    tabindex="0"
                    role="img"
                    aria-label="${content}"
                    @pointerdown=${(e) => {
        this.lastPointerType = e.pointerType;
      }}
                    @pointerenter=${(e) => e.pointerType !== "touch" && this.showTooltip()}
                    @pointerleave=${(e) => e.pointerType !== "touch" && this.hideTooltip()}
                    @click=${(e) => {
        if (this.lastPointerType === "touch") this.handleTap(e);
        this.lastPointerType = null;
      }}
                >
                    ${this.renderIcon()}
                </span>
            `;
    }
  }
};
__publicField(_MasMnemonic, "activeTooltip", null);
__publicField(_MasMnemonic, "properties", {
  content: { type: String },
  placement: { type: String },
  variant: { type: String },
  // Icon-based tooltip properties
  src: { type: String },
  size: { type: String },
  tooltipText: { type: String, attribute: "tooltip-text" },
  tooltipPlacement: { type: String, attribute: "tooltip-placement" },
  // Support studio's mnemonic attribute names
  mnemonicText: { type: String, attribute: "mnemonic-text" },
  mnemonicPlacement: { type: String, attribute: "mnemonic-placement" },
  // Tooltip visibility state
  tooltipVisible: { type: Boolean, state: true }
});
__publicField(_MasMnemonic, "styles", css`
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

        .css-tooltip[data-tooltip]::before {
            content: attr(data-tooltip);
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

        .css-tooltip[data-tooltip]::after {
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

        .css-tooltip.tooltip-visible[data-tooltip]::before,
        .css-tooltip.tooltip-visible[data-tooltip]::after,
        .css-tooltip:focus-visible[data-tooltip]::before,
        .css-tooltip:focus-visible[data-tooltip]::after {
            opacity: 1;
            visibility: visible;
        }

        /* Position variants */
        .css-tooltip.top[data-tooltip]::before {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top[data-tooltip]::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom[data-tooltip]::before {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom[data-tooltip]::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left[data-tooltip]::before {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left[data-tooltip]::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right[data-tooltip]::before {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right[data-tooltip]::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);
var MasMnemonic = _MasMnemonic;
customElements.define("mas-mnemonic", MasMnemonic);
export {
  MasMnemonic as default
};
//# sourceMappingURL=mas-mnemonic.js.map
