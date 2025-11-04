var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/mas-mnemonic.js
var mas_mnemonic_exports = {};
__export(mas_mnemonic_exports, {
  default: () => MasMnemonic
});
import { LitElement, html, css } from "/deps/lit-all.min.js";
function hasSpectrumTooltip() {
  return customElements.get("sp-tooltip") !== void 0 && customElements.get("overlay-trigger") !== void 0 && document.querySelector("sp-theme") !== null;
}
var MasMnemonic;
var init_mas_mnemonic = __esm({
  "src/mas-mnemonic.js"() {
    MasMnemonic = class extends LitElement {
      constructor() {
        super();
        this.content = "";
        this.placement = "top";
        this.variant = "info";
        this.size = "xs";
      }
      get effectiveContent() {
        return this.tooltipText || this.mnemonicText || this.content || "";
      }
      get effectivePlacement() {
        return this.tooltipPlacement || this.mnemonicPlacement || this.placement || "top";
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
        const useSpectrum = hasSpectrumTooltip();
        if (useSpectrum) {
          return html`
                <overlay-trigger placement="${placement}">
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
                    class="css-tooltip ${placement}"
                    data-tooltip="${content}"
                    tabindex="0"
                    role="img"
                    aria-label="${content}"
                >
                    ${this.renderIcon()}
                </span>
            `;
        }
      }
    };
    __publicField(MasMnemonic, "properties", {
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
      mnemonicPlacement: { type: String, attribute: "mnemonic-placement" }
    });
    __publicField(MasMnemonic, "styles", css`
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
            padding: 8px 12px;
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
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
            pointer-events: none;
            transition: opacity 0.3s;
        }

        .css-tooltip:hover[data-tooltip]::before,
        .css-tooltip:hover[data-tooltip]::after,
        .css-tooltip:focus[data-tooltip]::before,
        .css-tooltip:focus[data-tooltip]::after {
            opacity: 1;
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
    customElements.define("mas-mnemonic", MasMnemonic);
  }
});

// src/merch-icon.js
import { LitElement as LitElement2, html as html2, css as css2 } from "/deps/lit-all.min.js";
function hasSpectrumTooltip2() {
  return customElements.get("sp-tooltip") !== void 0 || document.querySelector("sp-theme") !== null;
}
var MerchIcon = class extends LitElement2 {
  constructor() {
    super();
    this.size = "m";
    this.alt = "";
    this.loading = "lazy";
  }
  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => this.handleTooltips(), 0);
  }
  handleTooltips() {
    if (hasSpectrumTooltip2()) return;
    const tooltipElements = this.querySelectorAll(
      "sp-tooltip, overlay-trigger"
    );
    tooltipElements.forEach((element) => {
      let content = "";
      let placement = "top";
      if (element.tagName === "SP-TOOLTIP") {
        content = element.textContent;
        placement = element.getAttribute("placement") || "top";
      } else if (element.tagName === "OVERLAY-TRIGGER") {
        const tooltip = element.querySelector("sp-tooltip");
        if (tooltip) {
          content = tooltip.textContent;
          placement = tooltip.getAttribute("placement") || element.getAttribute("placement") || "top";
        }
      }
      if (content) {
        const masMnemonic = document.createElement("mas-mnemonic");
        masMnemonic.setAttribute("content", content);
        masMnemonic.setAttribute("placement", placement);
        const img = this.querySelector("img");
        const link = this.querySelector("a");
        if (link && link.contains(img)) {
          masMnemonic.appendChild(link);
        } else if (img) {
          masMnemonic.appendChild(img);
        }
        this.innerHTML = "";
        this.appendChild(masMnemonic);
        Promise.resolve().then(() => init_mas_mnemonic());
      }
      element.remove();
    });
  }
  render() {
    const { href } = this;
    return href ? html2`<a href="${href}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>` : html2` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`;
  }
};
__publicField(MerchIcon, "properties", {
  size: { type: String, attribute: true },
  src: { type: String, attribute: true },
  alt: { type: String, attribute: true },
  href: { type: String, attribute: true },
  loading: { type: String, attribute: true }
});
__publicField(MerchIcon, "styles", css2`
        :host {
            --img-width: 32px;
            --img-height: 32px;
            display: block;
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }

        :host([size='xxs']) {
            --img-width: 13px;
            --img-height: 13px;
        }

        :host([size='xs']) {
            --img-width: 20px;
            --img-height: 20px;
        }

        :host([size='s']) {
            --img-width: 24px;
            --img-height: 24px;
        }

        :host([size='m']) {
            --img-width: 30px;
            --img-height: 30px;
        }

        :host([size='l']) {
            --img-width: 40px;
            --img-height: 40px;
        }

        img {
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }
    `);
customElements.define("merch-icon", MerchIcon);
export {
  MerchIcon as default
};
//# sourceMappingURL=merch-icon.js.map
