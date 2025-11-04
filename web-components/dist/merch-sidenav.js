var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/sidenav/merch-sidenav.js
import { html as html4, css as css3, LitElement as LitElement4, nothing as nothing2 } from "/deps/lit-all.min.js";

// node_modules/@spectrum-web-components/reactive-controllers/src/MatchMedia.js
var MatchMediaController = class {
  constructor(e, t) {
    this.key = Symbol("match-media-key");
    this.matches = false;
    this.host = e, this.host.addController(this), this.media = window.matchMedia(t), this.matches = this.media.matches, this.onChange = this.onChange.bind(this), e.addController(this);
  }
  hostConnected() {
    var e;
    (e = this.media) == null || e.addEventListener("change", this.onChange);
  }
  hostDisconnected() {
    var e;
    (e = this.media) == null || e.removeEventListener("change", this.onChange);
  }
  onChange(e) {
    this.matches !== e.matches && (this.matches = e.matches, this.host.requestUpdate(this.key, !this.matches));
  }
};

// src/merch-search.js
import { html, LitElement } from "/deps/lit-all.min.js";

// src/constants.js
var Commitment = Object.freeze({
  MONTH: "MONTH",
  YEAR: "YEAR",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  PERPETUAL: "PERPETUAL",
  TERM_LICENSE: "TERM_LICENSE",
  ACCESS_PASS: "ACCESS_PASS",
  THREE_MONTHS: "THREE_MONTHS",
  SIX_MONTHS: "SIX_MONTHS"
});
var Term = Object.freeze({
  ANNUAL: "ANNUAL",
  MONTHLY: "MONTHLY",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  P1D: "P1D",
  P1Y: "P1Y",
  P3Y: "P3Y",
  P10Y: "P10Y",
  P15Y: "P15Y",
  P3D: "P3D",
  P7D: "P7D",
  P30D: "P30D",
  HALF_YEARLY: "HALF_YEARLY",
  QUARTERLY: "QUARTERLY"
});
var SELECTOR_MAS_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
var SELECTOR_MAS_CHECKOUT_LINK = 'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var SELECTOR_MAS_UPT_LINK = 'a[is="upt-link"]';
var SELECTOR_MAS_ELEMENT = `${SELECTOR_MAS_INLINE_PRICE},${SELECTOR_MAS_CHECKOUT_LINK},${SELECTOR_MAS_UPT_LINK}`;
var EVENT_MERCH_SEARCH_CHANGE = "merch-search:change";
var EVENT_MERCH_SIDENAV_SELECT = "merch-sidenav:select";
var CheckoutWorkflowStep = Object.freeze({
  SEGMENTATION: "segmentation",
  BUNDLE: "bundle",
  COMMITMENT: "commitment",
  RECOMMENDATION: "recommendation",
  EMAIL: "email",
  PAYMENT: "payment",
  CHANGE_PLAN_TEAM_PLANS: "change-plan/team-upgrade/plans",
  CHANGE_PLAN_TEAM_PAYMENT: "change-plan/team-upgrade/payment"
});
var Env = Object.freeze({
  STAGE: "STAGE",
  PRODUCTION: "PRODUCTION",
  LOCAL: "LOCAL"
});

// src/utils.js
function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}
function createTag(tag, attributes = {}, content = null, is = null) {
  const element = is ? document.createElement(tag, { is }) : document.createElement(tag);
  if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else {
    element.innerHTML = content;
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}
function historyPushState(queryParams) {
  if (!window.history.pushState) return;
  const newURL = new URL(window.location.href);
  newURL.search = `?${queryParams}`;
  window.history.pushState({ path: newURL.href }, "", newURL.href);
}
function updateHash(key, value) {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  hash.set(key, value);
  window.location.hash = hash.toString();
}
function paramsToHash(keys = []) {
  keys.forEach((key) => {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(key);
    if (!value) return;
    if (window.location.hash.includes(`${key}=`)) {
      updateHash(key, value);
    } else {
      window.location.hash = window.location.hash ? `${window.location.hash}&${key}=${value}` : `${key}=${value}`;
    }
    urlParams.delete(key);
    historyPushState(urlParams.toString());
  });
}

// src/deeplink.js
var EVENT_HASHCHANGE = "hashchange";
function parseState(hash = window.location.hash) {
  const result = [];
  const keyValuePairs = hash.replace(/^#/, "").split("&");
  for (const pair of keyValuePairs) {
    const [key, value = ""] = pair.split("=");
    if (key) {
      result.push([key, decodeURIComponent(value.replace(/\+/g, " "))]);
    }
  }
  return Object.fromEntries(result);
}
function pushStateFromComponent(component, value) {
  if (component.deeplink) {
    const state = {};
    state[component.deeplink] = value;
    pushState(state);
  }
}
function pushState(state) {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  Object.entries(state).forEach(([key, value2]) => {
    if (value2) {
      hash.set(key, value2);
    } else {
      hash.delete(key);
    }
  });
  hash.sort();
  const value = hash.toString();
  if (value === window.location.hash) return;
  let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
  window.location.hash = value;
  window.scrollTo(0, lastScrollTop);
}
function deeplink(callback) {
  const handler = () => {
    if (window.location.hash && !window.location.hash.includes("=")) return;
    const state = parseState(window.location.hash);
    callback(state);
  };
  handler();
  window.addEventListener(EVENT_HASHCHANGE, handler);
  return () => {
    window.removeEventListener(EVENT_HASHCHANGE, handler);
  };
}

// src/merch-search.js
var MerchSearch = class extends LitElement {
  get search() {
    return this.querySelector(`sp-search`);
  }
  constructor() {
    super();
    this.handleInput = () => {
      pushStateFromComponent(this, this.search.value);
      if (this.search.value) {
        this.dispatchEvent(
          new CustomEvent(EVENT_MERCH_SEARCH_CHANGE, {
            bubbles: true,
            composed: true,
            detail: {
              type: "search",
              value: this.search.value
            }
          })
        );
      }
    };
    this.handleInputDebounced = debounce(this.handleInput.bind(this));
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.search) return;
    this.search.addEventListener("input", this.handleInputDebounced);
    this.search.addEventListener("submit", this.handleInputSubmit);
    this.updateComplete.then(() => {
      this.setStateFromURL();
    });
    this.startDeeplink();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.search.removeEventListener("input", this.handleInputDebounced);
    this.search.removeEventListener("submit", this.handleInputSubmit);
    this.stopDeeplink?.();
  }
  /*
   * set the state of the search based on the URL
   */
  setStateFromURL() {
    const state = parseState();
    const value = state[this.deeplink];
    if (value) {
      this.search.value = value;
    }
  }
  startDeeplink() {
    this.stopDeeplink = deeplink(({ search }) => {
      this.search.value = search ?? "";
    });
  }
  handleInputSubmit(event) {
    event.preventDefault();
  }
  render() {
    return html`<slot></slot>`;
  }
};
__publicField(MerchSearch, "properties", {
  deeplink: { type: String }
});
customElements.define("merch-search", MerchSearch);

// src/sidenav/merch-sidenav-list.js
import { html as html2, LitElement as LitElement2, css, nothing } from "/deps/lit-all.min.js";
var MerchSidenavList = class extends LitElement2 {
  constructor() {
    super();
    this.toggleIconColor = false;
    this.handleClickDebounced = debounce(this.handleClick.bind(this));
  }
  selectElement(element, selected = true) {
    element.selected = selected;
    if (element.parentNode.tagName === "SP-SIDENAV-ITEM") {
      this.selectElement(element.parentNode, false);
    }
    const selectionElement = element.querySelector(".selection");
    selectionElement?.setAttribute("selected", selected);
    const selection = selectionElement?.dataset;
    const iconSrc = selected && this.toggleIconColor ? selection?.light : selection?.dark;
    if (iconSrc) {
      element.querySelector("img")?.setAttribute("src", iconSrc);
    }
    if (selected) {
      this.selectedElement = element;
      this.selectedText = selection?.selectedText || element.label;
      this.selectedValue = element.value;
      setTimeout(() => {
        element.selected = true;
      }, 1);
      this.dispatchEvent(
        new CustomEvent(EVENT_MERCH_SIDENAV_SELECT, {
          bubbles: true,
          composed: true,
          detail: {
            type: "sidenav",
            value: this.selectedValue,
            elt: this.selectedElement
          }
        })
      );
    }
  }
  markCurrentItem(element) {
    const sidenav = element.closest("sp-sidenav");
    if (!sidenav) return;
    sidenav.querySelectorAll("sp-sidenav-item[aria-current]").forEach((currentItem) => {
      currentItem.removeAttribute("aria-current");
    });
    element.setAttribute("aria-current", "true");
  }
  /**
   * click handler to manage first level items state of sidenav
   * @param {*} param
   */
  handleClick({ target: item }, shouldUpdateHash = true) {
    const { value, parentNode } = item;
    this.selectElement(item);
    this.markCurrentItem(item);
    if (parentNode?.tagName === "SP-SIDENAV") {
      parentNode.querySelectorAll(
        "sp-sidenav-item[expanded],sp-sidenav-item[selected]"
      ).forEach((item2) => {
        if (item2.value !== value) {
          item2.expanded = false;
          item2.removeAttribute("aria-expanded");
          this.selectElement(item2, false);
        }
      });
      parentNode.querySelectorAll(".selection[selected=true]").forEach((selection) => {
        const item2 = selection.parentElement;
        if (item2.value !== value) {
          this.selectElement(item2, false);
        }
      });
    } else if (parentNode?.tagName === "SP-SIDENAV-ITEM") {
      const topLevelItems = parentNode.closest("sp-sidenav")?.querySelectorAll(":scope > sp-sidenav-item");
      [...topLevelItems].filter((item2) => item2 !== parentNode).forEach((item2) => {
        item2.expanded = false;
        item2.removeAttribute("aria-expanded");
      });
      parentNode.closest("sp-sidenav")?.querySelectorAll("sp-sidenav-item[selected]").forEach((item2) => {
        if (item2.value !== value) {
          this.selectElement(item2, false);
        }
      });
    }
    if (shouldUpdateHash) {
      pushStateFromComponent(this, value);
    }
  }
  /**
   * leaf level item selection handler
   * @param {*} event
   */
  selectionChanged(event) {
    const {
      target: { value, parentNode }
    } = event;
    this.selectElement(
      this.querySelector(`sp-sidenav-item[value="${value}"]`)
    );
    pushStateFromComponent(this, value);
  }
  startDeeplink() {
    this.stopDeeplink = deeplink((params) => {
      const value = params[this.deeplink] ?? "all";
      let element = this.querySelector(
        `sp-sidenav-item[value="${value}"]`
      );
      if (!element) {
        element = this.querySelector("sp-sidenav-item:first-child");
        updateHash(this.deeplink, element.value);
      }
      this.updateComplete.then(() => {
        if (element.firstElementChild?.tagName === "SP-SIDENAV-ITEM") {
          element.expanded = true;
          element.setAttribute("aria-expanded", "true");
        }
        if (element.parentNode?.tagName === "SP-SIDENAV-ITEM") {
          element.parentNode.expanded = true;
          element.parentNode.setAttribute("aria-expanded", "true");
        }
        this.handleClick(
          { target: element },
          !!window.location.hash.includes("category")
        );
      });
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleClickDebounced);
    this.updateComplete.then(() => {
      if (!this.deeplink) return;
      paramsToHash(["filter", "single_app"]);
      this.startDeeplink();
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClickDebounced);
    this.stopDeeplink?.();
  }
  render() {
    return html2`<div
            aria-label="${this.label}"
            @change="${(e) => this.selectionChanged(e)}"
        >
            ${this.sidenavListTitle ? html2`<h2>${this.sidenavListTitle}</h2>` : nothing}
            <slot></slot>
        </div>`;
  }
};
__publicField(MerchSidenavList, "properties", {
  sidenavListTitle: { type: String },
  label: { type: String },
  deeplink: { type: String, attribute: "deeplink" },
  selectedText: {
    type: String,
    reflect: true,
    attribute: "selected-text"
  },
  selectedValue: {
    type: String,
    reflect: true,
    attribute: "selected-value"
  },
  toggleIconColor: {
    type: Boolean,
    attribute: "toggle-icon-color"
  }
});
__publicField(MerchSidenavList, "styles", css`
        :host {
            display: block;
            contain: content;
            margin-top: var(--merch-sidenav-list-gap);
        }

        :host h2 {
            color: var(--merch-sidenav-list-title-color);
            font-size: var(--merch-sidenav-list-title-font-size);
            font-weight: var(--merch-sidenav-list-title-font-weight);
            padding: var(--merch-sidenav-list-title-padding);
            line-height: var(--merch-sidenav-list-title-line-height);
            margin: 0;
        }

        .right {
            position: absolute;
            right: 0;
        }
    `);
customElements.define("merch-sidenav-list", MerchSidenavList);

// src/sidenav/merch-sidenav-checkbox-group.js
import { html as html3, LitElement as LitElement3, css as css2 } from "/deps/lit-all.min.js";
var MerchSidenavCheckboxGroup = class extends LitElement3 {
  constructor() {
    super();
    this.selectedValues = [];
  }
  /**
   * leaf level item change handler
   * @param {*} event
   */
  selectionChanged({ target }) {
    const name = target.getAttribute("name");
    if (name) {
      const index = this.selectedValues.indexOf(name);
      if (target.checked && index === -1) {
        this.selectedValues.push(name);
      } else if (!target.checked && index >= 0) {
        this.selectedValues.splice(index, 1);
      }
    }
    pushStateFromComponent(this, this.selectedValues.join(","));
  }
  addGroupTitle() {
    const id = "sidenav-checkbox-group-title";
    const h3El = createTag("h3", { id });
    h3El.textContent = this.sidenavCheckboxTitle;
    this.prepend(h3El);
    this.setAttribute("role", "group");
    this.setAttribute("aria-labelledby", id);
  }
  startDeeplink() {
    this.stopDeeplink = deeplink(({ types }) => {
      if (types) {
        const newTypes = types.split(",");
        [.../* @__PURE__ */ new Set([...newTypes, ...this.selectedValues])].forEach(
          (name) => {
            const checkbox = this.querySelector(
              `sp-checkbox[name=${name}]`
            );
            if (checkbox)
              checkbox.checked = newTypes.includes(name);
          }
        );
        this.selectedValues = newTypes;
      } else {
        this.selectedValues.forEach((name) => {
          const checkbox = this.querySelector(
            `sp-checkbox[name=${name}]`
          );
          if (checkbox) checkbox.checked = false;
        });
        this.selectedValues = [];
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.updateComplete.then(async () => {
      this.addGroupTitle();
      this.startDeeplink();
    });
  }
  disconnectedCallback() {
    this.stopDeeplink?.();
  }
  render() {
    return html3`<div aria-label="${this.label}">
            <div
                @change="${(e) => this.selectionChanged(e)}"
                class="checkbox-group"
            >
                <slot></slot>
            </div>
        </div>`;
  }
};
__publicField(MerchSidenavCheckboxGroup, "properties", {
  sidenavCheckboxTitle: { type: String },
  label: { type: String },
  deeplink: { type: String },
  selectedValues: { type: Array, reflect: true },
  value: { type: String }
});
__publicField(MerchSidenavCheckboxGroup, "styles", css2`
        :host {
            display: block;
            contain: content;
            border-top: 1px solid var(--color-gray-200);
            padding: var(--merch-sidenav-checkbox-group-padding);
            margin-top: var(--merch-sidenav-checkbox-group-gap);
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
        }
    `);
customElements.define(
  "merch-sidenav-checkbox-group",
  MerchSidenavCheckboxGroup
);

// src/media.js
var SPECTRUM_MOBILE_LANDSCAPE = "(max-width: 700px)";
var TABLET_DOWN = "(max-width: 1199px)";

// src/sidenav/merch-sidenav.js
var SEARCH_SIZE = {
  catalog: "l"
};
var CHECKBOX_SIZE = {
  catalog: "xl"
};
var MerchSideNav = class extends LitElement4 {
  constructor() {
    super();
    __publicField(this, "mobileDevice", new MatchMediaController(this, SPECTRUM_MOBILE_LANDSCAPE));
    __publicField(this, "mobileAndTablet", new MatchMediaController(this, TABLET_DOWN));
    this.open = false;
    this.autoclose = false;
    this.variant = null;
    this.closeModal = this.closeModal.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener(EVENT_MERCH_SIDENAV_SELECT, this.handleSelection);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(
      EVENT_MERCH_SIDENAV_SELECT,
      this.handleSelection
    );
  }
  firstUpdated() {
    const searchSize = SEARCH_SIZE[this.variant];
    if (searchSize) {
      const search = this.querySelector("merch-search sp-search");
      search.setAttribute("size", searchSize);
    }
    const checkboxSize = CHECKBOX_SIZE[this.variant];
    if (checkboxSize) {
      const checkboxes = this.querySelectorAll(
        "merch-sidenav-checkbox-group sp-checkbox"
      );
      checkboxes.forEach((checkbox) => {
        checkbox.setAttribute("size", checkboxSize);
      });
    }
  }
  updated() {
    if (this.mobileAndTablet.matches) {
      this.modal = true;
      this.style.padding = 0;
      this.style.margin = 0;
    } else {
      this.modal = false;
      this.style.removeProperty("padding");
      this.style.removeProperty("margin");
      if (this.open) this.closeModal();
    }
  }
  get filters() {
    return this.querySelector("merch-sidenav-list");
  }
  get search() {
    return this.querySelector("merch-search");
  }
  render() {
    return this.mobileAndTablet.matches ? this.asDialog : this.asAside;
  }
  get asDialog() {
    if (!this.open) return nothing2;
    const closeButton = !this.autoclose ? html4`<sp-link @click="${this.closeModal}"
                  >${this.closeText || "Close"}</sp-link
              >` : nothing2;
    return html4`
            <sp-theme color="light" scale="medium">
                <sp-overlay type="modal" open @sp-closed=${this.closeModal}>
                    <sp-dialog-base
                        dismissable
                        underlay
                        no-divider
                        @close=${this.closeModal}
                    >
                        <div id="content">
                            <div id="sidenav">
                                <div>
                                    <h2>${this.sidenavTitle}</h2>
                                    <slot></slot>
                                </div>
                                ${closeButton}
                            </div>
                        </div>
                    </sp-dialog-base>
                </sp-overlay>
            </sp-theme>
        `;
  }
  get asAside() {
    return html4`<sp-theme color="light" scale="medium"
            ><h2>${this.sidenavTitle}</h2>
            <slot></slot
        ></sp-theme>`;
  }
  get dialog() {
    return this.shadowRoot.querySelector("sp-dialog-base");
  }
  handleSelection() {
    if (this.autoclose) this.closeModal();
  }
  closeModal() {
    this.open = false;
    document.querySelector("body")?.classList.remove("merch-modal");
  }
  showModal() {
    this.open = true;
    document.querySelector("body")?.classList.add("merch-modal");
  }
};
__publicField(MerchSideNav, "properties", {
  sidenavTitle: { type: String },
  closeText: { type: String, attribute: "close-text" },
  modal: { type: Boolean, reflect: true },
  open: { type: Boolean, state: true, reflect: true },
  autoclose: { type: Boolean, attribute: "autoclose", reflect: true }
});
__publicField(MerchSideNav, "styles", css3`
        :host {
            --merch-sidenav-padding: 16px;
            --merch-sidenav-collection-gap: 30px;
            /* Title */
            --merch-sidenav-title-font-size: 12px;
            --merch-sidenav-title-font-weight: 400;
            --merch-sidenav-title-line-height: 16px;
            --merch-sidenav-title-color: var(--spectrum-gray-700, #464646);
            --merch-sidenav-title-padding: 6px 12px 16px;
            /* Search */
            --merch-sidenav-search-gap: 10px;
            /* List */
            --merch-sidenav-list-gap: 0;
            --merch-sidenav-list-title-color: var(--spectrum-gray-700, #464646);
            --merch-sidenav-list-title-font-size: 14px;
            --merch-sidenav-list-title-font-weight: 400;
            --merch-sidenav-list-title-padding: 6px 12px 8px;
            --merch-sidenav-list-title-line-height: 18px;
            --merch-sidenav-item-height: unset;
            --merch-sidenav-item-inline-padding: 12px;
            --merch-sidenav-item-font-weight: 400;
            --merch-sidenav-item-font-size: 14px;
            --merch-sidenav-item-line-height: 18px;
            --merch-sidenav-item-label-top-margin: 6px;
            --merch-sidenav-item-label-bottom-margin: 8px;
            --merch-sidenav-item-icon-top-margin: 7px;
            --merch-sidenav-item-icon-gap: 8px;
            --merch-sidenav-item-selected-color: var(
                --spectrum-gray-800,
                #222222
            );
            --merch-sidenav-item-selected-background: var(
                --spectrum-gray-200,
                #e6e6e6
            );
            --merch-sidenav-list-item-gap: 4px;
            /* Checkbox group */
            --merch-sidenav-checkbox-group-title-font-size: 14px;
            --merch-sidenav-checkbox-group-title-font-weight: 400;
            --merch-sidenav-checkbox-group-title-line-height: 18px;
            --merch-sidenav-checkbox-group-title-color: var(
                --spectrum-gray-700,
                #464646
            );
            --merch-sidenav-checkbox-group-title-padding: 6px 0 8px;
            --merch-sidenav-checkbox-group-gap: 32px;
            --merch-sidenav-checkbox-group-padding: 0 12px;
            --merch-sidenav-checkbox-group-label-font-size: 17px;
            --merch-sidenav-checkbox-group-checkbox-spacing: 22px;
            --merch-sidenav-checkbox-group-label-gap: 13px;
            --merch-sidenav-checkbox-group-label-top-margin: 8px;
            --merch-sidenav-checkbox-group-height: 40px;
            /* Modal */
            --merch-sidenav-modal-close-font-size: 15px;
            --merch-sidenav-modal-close-line-height: 19px;
            --merch-sidenav-modal-close-gap: 10px;
            --merch-sidenav-modal-border-radius: 8px;
            --merch-sidenav-modal-padding: var(--merch-sidenav-padding);

            display: block;
            z-index: 2;
            padding: var(--merch-sidenav-padding);
            margin-right: var(--merch-sidenav-collection-gap);
        }

        ::slotted(merch-sidenav-list) {
            --mod-sidenav-min-height: var(--merch-sidenav-item-height);
            --mod-sidenav-inline-padding: var(
                --merch-sidenav-item-inline-padding
            );
            --mod-sidenav-top-level-font-weight: var(
                --merch-sidenav-item-font-weight
            );
            --mod-sidenav-top-level-font-size: var(
                --merch-sidenav-item-font-size
            );
            --mod-sidenav-top-level-line-height: var(
                --merch-sidenav-item-line-height
            );
            --mod-sidenav-top-to-label: var(
                --merch-sidenav-item-label-top-margin
            );
            --mod-sidenav-bottom-to-label: var(
                --merch-sidenav-item-label-bottom-margin
            );
            --mod-sidenav-top-to-icon: var(
                --merch-sidenav-item-icon-top-margin
            );
            --mod-sidenav-icon-spacing: var(--merch-sidenav-item-icon-gap);
            --mod-sidenav-content-color-default-selected: var(
                --merch-sidenav-item-selected-color
            );
            --mod-sidenav-item-background-default-selected: var(
                --merch-sidenav-item-selected-background
            );
            --mod-sidenav-gap: var(--merch-sidenav-list-item-gap);
        }

        ::slotted(merch-sidenav-checkbox-group) {
            --mod-checkbox-font-size: var(
                --merch-sidenav-checkbox-group-label-font-size
            );
            --mod-checkbox-spacing: var(
                --merch-sidenav-checkbox-group-checkbox-spacing
            );
            --mod-checkbox-text-to-control: var(
                --merch-sidenav-checkbox-group-label-gap
            );
            --mod-checkbox-top-to-text: var(
                --merch-sidenav-checkbox-group-label-top-margin
            );
            --mod-checkbox-height: var(--merch-sidenav-checkbox-group-height);
        }

        :host h2 {
            color: var(--merch-sidenav-title-color);
            font-size: var(--merch-sidenav-title-font-size);
            font-weight: var(--merch-sidenav-title-font-weight);
            padding: var(--merch-sidenav-title-padding);
            line-height: var(--merch-sidenav-title-line-height);
            margin: 0;
        }

        #content {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: baseline;
        }

        ::slotted(merch-search) {
            display: block;
            margin-bottom: var(--merch-sidenav-search-gap);
        }

        :host([modal]) ::slotted(merch-search) {
            display: none;
        }

        #sidenav {
            display: flex;
            flex-direction: column;
            max-width: 248px;
            overflow-y: auto;
            place-items: center;
            position: relative;
            width: 100%;
            border-radius: var(--merch-sidenav-modal-border-radius);
            padding: var(--merch-sidenav-modal-padding);
        }

        sp-dialog-base {
            --mod-modal-confirm-border-radius: var(
                --merch-sidenav-modal-border-radius
            );
            --mod-modal-max-height: 100dvh;
        }

        sp-dialog-base #sidenav {
            box-sizing: border-box;
            max-width: 300px;
            max-height: 95dvh;
            background: #ffffff 0% 0% no-repeat padding-box;
            box-shadow: 0px 1px 4px #00000026;
        }

        :host(:not([autoclose])) #sidenav h2 {
            margin-top: calc(
                var(--merch-sidenav-modal-close-gap) +
                    var(--merch-sidenav-modal-close-line-height)
            );
        }

        sp-link {
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: var(--merch-sidenav-modal-close-font-size);
            line-height: var(--merch-sidenav-modal-close-line-height);
        }
    `);
customElements.define("merch-sidenav", MerchSideNav);
export {
  MerchSideNav
};
//# sourceMappingURL=merch-sidenav.js.map
