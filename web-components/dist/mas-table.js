var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

// src/mas-mnemonic.js
var mas_mnemonic_exports = {};
__export(mas_mnemonic_exports, {
  default: () => MasMnemonic
});
import { LitElement, html, css } from "./lit-all.min.js";
function hasSpectrumTooltip() {
  return customElements.get("sp-tooltip") !== void 0 && customElements.get("overlay-trigger") !== void 0 && document.querySelector("sp-theme") !== null;
}
var _MasMnemonic, MasMnemonic;
var init_mas_mnemonic = __esm({
  "src/mas-mnemonic.js"() {
    _MasMnemonic = class _MasMnemonic extends LitElement {
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
    MasMnemonic = _MasMnemonic;
    customElements.define("mas-mnemonic", MasMnemonic);
  }
});

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
var EVENT_MERCH_CARD_ACTION_MENU_TOGGLE = "merch-card:action-menu-toggle";
var EVENT_MERCH_QUANTITY_SELECTOR_CHANGE = "merch-quantity-selector:change";
var EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED = "merch-card-collection:literals-changed";
var EVENT_AEM_LOAD = "aem:load";
var EVENT_AEM_ERROR = "aem:error";
var EVENT_MAS_READY = "mas:ready";
var EVENT_MAS_ERROR = "mas:error";
var CLASS_NAME_FAILED = "placeholder-failed";
var CLASS_NAME_PENDING = "placeholder-pending";
var CLASS_NAME_RESOLVED = "placeholder-resolved";
var EVENT_TYPE_FAILED = "mas:failed";
var EVENT_TYPE_RESOLVED = "mas:resolved";
var LOG_NAMESPACE = "mas/commerce";
var STATE_FAILED = "failed";
var STATE_PENDING = "pending";
var STATE_RESOLVED = "resolved";
var HEADER_X_REQUEST_ID = "X-Request-Id";
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
var MARK_START_SUFFIX = ":start";
var MARK_DURATION_SUFFIX = ":duration";
var TEMPLATE_PRICE_LEGAL = "legal";

// src/utils.js
var MAS_COMMERCE_SERVICE = "mas-commerce-service";
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
function printMeasure(measure) {
  return `startTime:${measure.startTime.toFixed(2)}|duration:${measure.duration.toFixed(2)}`;
}
function isMobileOrTablet() {
  return window.matchMedia("(max-width: 1024px)").matches;
}
function getService() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}
function getOuterHeight(element) {
  const style = window.getComputedStyle(element);
  return element.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}

// ../node_modules/@dexter/tacocat-core/src/utilities.js
function getParameter(key, defaults = {}, { metadata = true, search = true, storage = true } = {}) {
  let param;
  if (search && param == null) {
    const params = new URLSearchParams(window.location.search);
    const searchKey = isString(search) ? search : key;
    param = params.get(searchKey);
  }
  if (storage && param == null) {
    const storageKey = isString(storage) ? storage : key;
    param = window.sessionStorage.getItem(storageKey) ?? window.localStorage.getItem(storageKey);
  }
  if (metadata && param == null) {
    const metadataKey = toKebabCase(isString(metadata) ? metadata : key);
    const element = document.documentElement.querySelector(
      `meta[name="${metadataKey}"]`
    );
    param = element?.content;
  }
  return param == null ? defaults[key] : param;
}
var isBoolean = (value) => typeof value === "boolean";
var isFunction = (value) => typeof value === "function";
var isString = (value) => typeof value === "string";
function toBoolean(value, defaultValue) {
  if (isBoolean(value)) return value;
  const string = String(value);
  if (string === "1" || string === "true") return true;
  if (string === "0" || string === "false") return false;
  return defaultValue;
}
function toKebabCase(value = "") {
  return String(value).replace(
    /(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,
    (_, p1, p2) => `${p1}-${p2}`
  ).replace(/\W+/gu, "-").toLowerCase();
}

// src/lana.js
var config = {
  clientId: "merch-at-scale",
  delimiter: "\xB6",
  ignoredProperties: ["analytics", "literals", "element"],
  serializableTypes: ["Array", "Object"],
  sampleRate: 1,
  severity: "e",
  tags: "acom",
  isProdDomain: false
};
var PAGE_LIMIT = 1e3;
function isError(value) {
  return value instanceof Error || typeof value?.originatingRequest === "string";
}
function serializeValue(value) {
  if (value == null) return void 0;
  const type = typeof value;
  if (type === "function") {
    return value.name ? `function ${value.name}` : "function";
  }
  if (type === "object") {
    if (value instanceof Error) return value.message;
    if (typeof value.originatingRequest === "string") {
      const { message, originatingRequest, status } = value;
      return [message, status, originatingRequest].filter(Boolean).join(" ");
    }
    const objectType = value[Symbol.toStringTag] ?? Object.getPrototypeOf(value).constructor.name;
    if (!config.serializableTypes.includes(objectType)) return objectType;
  }
  return value;
}
function serializeParam(key, value) {
  if (config.ignoredProperties.includes(key)) return void 0;
  return serializeValue(value);
}
var lanaAppender = {
  append(entry) {
    if (entry.level !== "error") return;
    const { message, params } = entry;
    const errors = [];
    const values = [];
    let payload = message;
    params.forEach((param) => {
      if (param != null) {
        (isError(param) ? errors : values).push(param);
      }
    });
    if (errors.length) {
      payload += " " + errors.map(serializeValue).join(" ");
    }
    const { pathname, search } = window.location;
    let page = `${config.delimiter}page=${pathname}${search}`;
    if (page.length > PAGE_LIMIT) {
      page = `${page.slice(0, PAGE_LIMIT)}<trunc>`;
    }
    payload += page;
    if (values.length) {
      payload += `${config.delimiter}facts=`;
      payload += JSON.stringify(values, serializeParam);
    }
    window.lana?.log(payload, config);
  }
};
function updateConfig(newConfig) {
  Object.assign(
    config,
    Object.fromEntries(
      Object.entries(newConfig).filter(
        ([key, value]) => key in config && value !== "" && value !== null && value !== void 0 && !Number.isNaN(value)
        // Correctly exclude NaN
      )
    )
  );
}

// src/log.js
var HostEnv = {
  LOCAL: "local",
  PROD: "prod",
  STAGE: "stage"
};
var LogLevels = {
  DEBUG: "debug",
  ERROR: "error",
  INFO: "info",
  WARN: "warn"
};
var appenders = /* @__PURE__ */ new Set();
var filters = /* @__PURE__ */ new Set();
var loggerIndexes = /* @__PURE__ */ new Map();
var consoleAppender = {
  append({ level, message, params, timestamp, source }) {
    console[level](
      `${timestamp}ms [${source}] %c${message}`,
      "font-weight: bold;",
      ...params
    );
  }
};
var debugFilter = { filter: ({ level }) => level !== LogLevels.DEBUG };
var quietFilter = { filter: () => false };
function createEntry(level, message, namespace, params, source) {
  return {
    level,
    message,
    namespace,
    get params() {
      if (params.length === 1 && isFunction(params[0])) {
        params = params[0]();
        if (!Array.isArray(params)) params = [params];
      }
      return params;
    },
    source,
    timestamp: performance.now().toFixed(3)
  };
}
function handleEntry(entry) {
  if ([...filters].every((filter) => filter(entry))) {
    appenders.forEach((appender) => appender(entry));
  }
}
function createLog(namespace) {
  const index = (loggerIndexes.get(namespace) ?? 0) + 1;
  loggerIndexes.set(namespace, index);
  const id = `${namespace} #${index}`;
  const log2 = {
    id,
    namespace,
    module: (name) => createLog(`${log2.namespace}/${name}`),
    updateConfig
  };
  Object.values(LogLevels).forEach((level) => {
    log2[level] = (message, ...params) => handleEntry(createEntry(level, message, namespace, params, id));
  });
  return Object.seal(log2);
}
function use(...plugins) {
  plugins.forEach((plugin) => {
    const { append, filter } = plugin;
    if (isFunction(filter)) filters.add(filter);
    if (isFunction(append)) appenders.add(append);
  });
}
function init(env = {}) {
  const { name } = env;
  const debug = toBoolean(
    getParameter("commerce.debug", { search: true, storage: true }),
    name === HostEnv.LOCAL
  );
  if (debug) use(consoleAppender);
  else use(debugFilter);
  if (name === HostEnv.PROD) use(lanaAppender);
  return Log;
}
function reset() {
  appenders.clear();
  filters.clear();
}
var Log = {
  ...createLog(LOG_NAMESPACE),
  Level: LogLevels,
  Plugins: { consoleAppender, debugFilter, quietFilter, lanaAppender },
  init,
  reset,
  use
};

// src/utilities.js
var MAS_COMMERCE_SERVICE2 = "mas-commerce-service";
var log = Log.module("utilities");
var setImmediate = (getConfig) => window.setTimeout(getConfig);
function getService2() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE2)?.[0];
}

// src/mas-error.js
var MasError = class _MasError extends Error {
  /**
   * Creates a new MasError instance
   * @param {string} message - The error message
   * @param {Object} context - Additional context information about the error
   * @param {unknown} cause - The original error that caused this error
   */
  constructor(message, context, cause) {
    super(message, { cause });
    this.name = "MasError";
    if (context.response) {
      const requestId = context.response.headers?.get(HEADER_X_REQUEST_ID);
      if (requestId) {
        context.requestId = requestId;
      }
      if (context.response.status) {
        context.status = context.response.status;
        context.statusText = context.response.statusText;
      }
      if (context.response.url) {
        context.url = context.response.url;
      }
    }
    delete context.response;
    this.context = context;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _MasError);
    }
  }
  /**
   * Returns a string representation of the error including context
   * @returns {string} String representation of the error
   */
  toString() {
    const contextStr = Object.entries(this.context || {}).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ");
    let errorString = `${this.name}: ${this.message}`;
    if (contextStr) {
      errorString += ` (${contextStr})`;
    }
    if (this.cause) {
      errorString += `
Caused by: ${this.cause}`;
    }
    return errorString;
  }
};

// src/mas-element.js
var StateClassName = {
  [STATE_FAILED]: CLASS_NAME_FAILED,
  [STATE_PENDING]: CLASS_NAME_PENDING,
  [STATE_RESOLVED]: CLASS_NAME_RESOLVED
};
var StateEventType = {
  [STATE_FAILED]: EVENT_TYPE_FAILED,
  [STATE_RESOLVED]: EVENT_TYPE_RESOLVED
};
var _service;
var MasElement = class {
  constructor(wrapperElement) {
    __privateAdd(this, _service);
    __publicField(this, "changes", /* @__PURE__ */ new Map());
    __publicField(this, "connected", false);
    __publicField(this, "error");
    __publicField(this, "log");
    __publicField(this, "options");
    __publicField(this, "promises", []);
    __publicField(this, "state", STATE_PENDING);
    __publicField(this, "timer", null);
    __publicField(this, "value");
    __publicField(this, "version", 0);
    __publicField(this, "wrapperElement");
    this.wrapperElement = wrapperElement;
    this.log = Log.module("mas-element");
  }
  update() {
    [STATE_FAILED, STATE_PENDING, STATE_RESOLVED].forEach((state) => {
      this.wrapperElement.classList.toggle(
        StateClassName[state],
        state === this.state
      );
    });
  }
  notify() {
    if (this.state === STATE_RESOLVED || this.state === STATE_FAILED) {
      if (this.state === STATE_RESOLVED) {
        this.promises.forEach(
          ({ resolve }) => resolve(this.wrapperElement)
        );
      } else if (this.state === STATE_FAILED) {
        this.promises.forEach(({ reject }) => reject(this.error));
      }
      this.promises = [];
    }
    let detail = this.error;
    if (this.error instanceof MasError) {
      detail = {
        message: this.error.message,
        ...this.error.context
      };
    }
    this.wrapperElement.dispatchEvent(
      new CustomEvent(StateEventType[this.state], {
        bubbles: true,
        composed: true,
        detail
      })
    );
  }
  /**
   * Adds name/value of the updated attribute to the `changes` map,
   * requests placeholder update.
   */
  attributeChangedCallback(name, _, value) {
    this.changes.set(name, value);
    this.requestUpdate();
  }
  /**
   * Triggers when this component is connected to DOM.
   * Subscribes to the `ready` event of the commerce service,
   * requests placeholder update.
   */
  connectedCallback() {
    __privateSet(this, _service, getService2());
    this.requestUpdate(true);
  }
  /**
   * Triggers when this component is disconnected from DOM.
   * Runs and then erases all disposers.
   */
  disconnectedCallback() {
    if (this.connected) {
      this.connected = false;
      this.log?.debug("Disconnected:", { element: this.wrapperElement });
    }
  }
  /**
   * Returns a promise resolving to this placeholder
   * when its value is resolved or rejected.
   * If placeholder is not pending for completion of an async operation
   * the returned promise is already resolved or rejected.
   */
  onceSettled() {
    const { error, promises, state } = this;
    if (STATE_RESOLVED === state)
      return Promise.resolve(this.wrapperElement);
    if (STATE_FAILED === state) return Promise.reject(error);
    return new Promise((resolve, reject) => {
      promises.push({ resolve, reject });
    });
  }
  /**
   * Sets component state to "RESOLVED".
   * Updates its class list and stored value, notifies observers and fires "RESOLVED" event.
   */
  toggleResolved(version, value, options) {
    if (version !== this.version) return false;
    if (options !== void 0) this.options = options;
    this.state = STATE_RESOLVED;
    this.value = value;
    this.update();
    this.log?.debug("Resolved:", { element: this.wrapperElement, value });
    setImmediate(() => this.notify());
    return true;
  }
  /**
   * Sets component state to "FAILED".
   * Updates its class list and stored error, notifies observers and fires "FAILED" event.
   */
  toggleFailed(version, error, options) {
    if (version !== this.version) return false;
    if (options !== void 0) this.options = options;
    this.error = error;
    this.state = STATE_FAILED;
    this.update();
    const wcName = this.wrapperElement.getAttribute("is");
    this.log?.error(`${wcName}: Failed to render: ${error.message}`, {
      element: this.wrapperElement,
      ...error.context,
      ...__privateGet(this, _service)?.duration
    });
    setImmediate(() => this.notify());
    return true;
  }
  /**
   * Sets component state to "PENDING".
   * Increments its version, updates CSS classes, notifies observers and fires "PENDING" event.
   */
  togglePending(options) {
    this.version++;
    if (options) this.options = options;
    this.state = STATE_PENDING;
    this.update();
    this.log?.debug("Pending:", {
      osi: this.wrapperElement?.options?.wcsOsi
    });
    return this.version;
  }
  /**
   * Queues task to update this component.
   * Skips rendering if update is not forced and no changes were accumulated since the previous update.
   * Calls `render` method to perform the update.
   * Restores previous state of the component if the `render` method returned `false`.
   */
  requestUpdate(force = false) {
    if (!this.wrapperElement.isConnected || !getService2()) return;
    if (this.timer) return;
    const { error, options, state, value, version } = this;
    this.state = STATE_PENDING;
    this.timer = setImmediate(async () => {
      this.timer = null;
      let changes = null;
      if (this.changes.size) {
        changes = Object.fromEntries(this.changes.entries());
        this.changes.clear();
      }
      if (this.connected) {
        this.log?.debug("Updated:", {
          element: this.wrapperElement,
          changes
        });
      } else {
        this.connected = true;
        this.log?.debug("Connected:", {
          element: this.wrapperElement,
          changes
        });
      }
      if (changes || force) {
        try {
          const result = await this.wrapperElement.render?.();
          if (result === false && this.state === STATE_PENDING && this.version === version) {
            this.state = state;
            this.error = error;
            this.value = value;
            this.update();
            this.notify();
          }
        } catch (error2) {
          this.toggleFailed(this.version, error2, options);
        }
      }
    });
  }
};
_service = new WeakMap();

// src/upt-link.js
function getPromoTermsUrl(env) {
  const host = env === "PRODUCTION" ? "www.adobe.com" : "www.stage.adobe.com";
  return `https://${host}/offers/promo-terms.html`;
}
var _service2;
var _UptLink = class _UptLink extends HTMLAnchorElement {
  constructor() {
    super();
    __publicField(this, "masElement", new MasElement(this));
    __privateAdd(this, _service2);
    this.setAttribute("is", _UptLink.is);
  }
  get isUptLink() {
    return true;
  }
  /**
   * @param {string} osi
   * @param {string} promotionCode
   */
  initializeWcsData(osi, promotionCode) {
    this.setAttribute("data-wcs-osi", osi);
    if (promotionCode)
      this.setAttribute("data-promotion-code", promotionCode);
  }
  attributeChangedCallback(name, oldValue, value) {
    this.masElement.attributeChangedCallback(name, oldValue, value);
  }
  connectedCallback() {
    this.masElement.connectedCallback();
    __privateSet(this, _service2, getService());
    if (__privateGet(this, _service2)) {
      this.log = __privateGet(this, _service2).log.module("upt-link");
    }
  }
  disconnectedCallback() {
    this.masElement.disconnectedCallback();
    __privateSet(this, _service2, void 0);
  }
  requestUpdate(force = false) {
    this.masElement.requestUpdate(force);
  }
  onceSettled() {
    return this.masElement.onceSettled();
  }
  async render() {
    const service = getService();
    if (!service) return false;
    if (!this.dataset.imsCountry) {
      service.imsCountryPromise.then((countryCode) => {
        if (countryCode) this.dataset.imsCountry = countryCode;
      });
    }
    const options = service.collectCheckoutOptions({}, this);
    if (!options.wcsOsi) {
      this.log.error(`Missing 'data-wcs-osi' attribute on upt-link.`);
      return false;
    }
    const version = this.masElement.togglePending(options);
    const promises = service.resolveOfferSelectors(options);
    try {
      const [[offer]] = await Promise.all(promises);
      const { country, language, env } = options;
      let params = `locale=${language}_${country}&country=${country}&offer_id=${offer.offerId}`;
      const promotionCode = this.getAttribute("data-promotion-code");
      if (promotionCode)
        params += `&promotion_code=${encodeURIComponent(promotionCode)}`;
      this.href = `${getPromoTermsUrl(env)}?${params}`;
      this.masElement.toggleResolved(version, offer, options);
    } catch (error) {
      const masError = new Error(
        `Could not resolve offer selectors for id: ${options.wcsOsi}.`,
        error.message
      );
      this.masElement.toggleFailed(version, masError, options);
      return false;
    }
  }
  /**
   * @param {HTMLElement} element
   */
  static createFrom(element) {
    const uptLink = new _UptLink();
    for (const attribute of element.attributes) {
      if (attribute.name === "is") continue;
      if (attribute.name === "class" && attribute.value.includes("upt-link"))
        uptLink.setAttribute(
          "class",
          attribute.value.replace("upt-link", "").trim()
        );
      else uptLink.setAttribute(attribute.name, attribute.value);
    }
    uptLink.innerHTML = element.innerHTML;
    uptLink.setAttribute("tabindex", 0);
    return uptLink;
  }
};
_service2 = new WeakMap();
__publicField(_UptLink, "is", "upt-link");
__publicField(_UptLink, "tag", "a");
__publicField(_UptLink, "observedAttributes", [
  "data-wcs-osi",
  "data-promotion-code",
  "data-ims-country"
]);
var UptLink = _UptLink;
if (!window.customElements.get(UptLink.is)) {
  window.customElements.define(UptLink.is, UptLink, {
    extends: UptLink.tag
  });
}

// src/hydrate.js
var DEFAULT_BADGE_COLOR = "#000000";
var DEFAULT_BADGE_BACKGROUND_COLOR = "#F8D904";
var DEFAULT_BORDER_COLOR = "#EAEAEA";
var DEFAULT_TRIAL_BADGE_BORDER_COLOR = "#31A547";
var CHECKOUT_STYLE_PATTERN = /(accent|primary|secondary)(-(outline|link))?/;
var ANALYTICS_TAG = "mas:product_code/";
var ANALYTICS_LINK_ATTR = "daa-ll";
var ANALYTICS_SECTION_ATTR = "daa-lh";
var SPECTRUM_BUTTON_SIZES = ["XL", "L", "M", "S"];
var TEXT_TRUNCATE_SUFFIX = "...";
function appendSlot(fieldName, fields, el, mapping) {
  const config2 = mapping[fieldName];
  if (fields[fieldName] && config2) {
    const attributes = { slot: config2?.slot, ...config2?.attributes };
    let content = fields[fieldName];
    if (config2.maxCount && typeof content === "string") {
      const [truncatedContent, cleanContent] = getTruncatedTextData(
        content,
        config2.maxCount,
        config2.withSuffix
      );
      if (truncatedContent !== content) {
        attributes.title = cleanContent;
        content = truncatedContent;
      }
    }
    const tag = createTag(config2.tag, attributes, content);
    el.append(tag);
  }
}
function processMnemonics(fields, merchCard, mnemonicsConfig) {
  const icons = (fields.mnemonicIcon || []).filter((icon) => icon);
  const mnemonics = icons.map((icon, index) => ({
    icon,
    alt: fields.mnemonicAlt?.[index] ?? "",
    link: fields.mnemonicLink?.[index] ?? ""
  }));
  mnemonics?.forEach(({ icon: src, alt, link: href }) => {
    if (href && !/^https?:/.test(href)) {
      try {
        href = new URL(`https://${href}`).href.toString();
      } catch (e) {
        href = "#";
      }
    }
    const attrs = {
      slot: "icons",
      src,
      loading: merchCard.loading,
      size: mnemonicsConfig?.size ?? "l"
    };
    if (alt) attrs.alt = alt;
    if (href) attrs.href = href;
    const merchIcon = createTag("merch-icon", attrs);
    merchCard.append(merchIcon);
  });
  const slotIcons = merchCard.shadowRoot.querySelector('slot[name="icons"]');
  if (slotIcons) {
    slotIcons.style.display = mnemonics?.length ? null : "none";
  }
}
function processBadge(fields, merchCard, mapping) {
  if (mapping.badge?.slot) {
    if (fields.badge?.length && !fields.badge?.startsWith("<merch-badge")) {
      let badgeDefaultBgColor = DEFAULT_BADGE_BACKGROUND_COLOR;
      let setBorderColorForBadge = false;
      if (mapping.allowedBadgeColors?.includes(mapping.badge?.default)) {
        badgeDefaultBgColor = mapping.badge?.default;
        if (!fields.borderColor) {
          setBorderColorForBadge = true;
        }
      }
      const bgColorToUse = fields.badgeBackgroundColor || badgeDefaultBgColor;
      let borderColorToUse = fields.borderColor || "";
      if (setBorderColorForBadge) {
        borderColorToUse = mapping.badge?.default;
        fields.borderColor = mapping.badge?.default;
      }
      fields.badge = `<merch-badge variant="${fields.variant}" background-color="${bgColorToUse}" border-color="${borderColorToUse}">${fields.badge}</merch-badge>`;
    }
    appendSlot("badge", fields, merchCard, mapping);
  } else {
    if (fields.badge) {
      merchCard.setAttribute("badge-text", fields.badge);
      if (!mapping.disabledAttributes?.includes("badgeColor")) {
        merchCard.setAttribute(
          "badge-color",
          fields.badgeColor || DEFAULT_BADGE_COLOR
        );
      }
      if (!mapping.disabledAttributes?.includes("badgeBackgroundColor")) {
        merchCard.setAttribute(
          "badge-background-color",
          fields.badgeBackgroundColor || DEFAULT_BADGE_BACKGROUND_COLOR
        );
      }
      merchCard.setAttribute(
        "border-color",
        fields.badgeBackgroundColor || DEFAULT_BADGE_BACKGROUND_COLOR
      );
    } else {
      merchCard.setAttribute(
        "border-color",
        fields.borderColor || DEFAULT_BORDER_COLOR
      );
    }
  }
}
function processTrialBadge(fields, merchCard, mapping) {
  if (mapping.trialBadge && fields.trialBadge) {
    if (!fields.trialBadge.startsWith("<merch-badge")) {
      const borderColorToUse = !mapping.disabledAttributes?.includes(
        "trialBadgeBorderColor"
      ) && fields.trialBadgeBorderColor || DEFAULT_TRIAL_BADGE_BORDER_COLOR;
      fields.trialBadge = `<merch-badge variant="${fields.variant}" border-color="${borderColorToUse}">${fields.trialBadge}</merch-badge>`;
    }
    appendSlot("trialBadge", fields, merchCard, mapping);
  }
}
function processSize(fields, merchCard, sizeConfig) {
  if (sizeConfig?.includes(fields.size)) {
    merchCard.setAttribute("size", fields.size);
  }
}
function processCardName(fields, merchCard) {
  if (fields.cardName) {
    merchCard.setAttribute("name", fields.cardName);
  }
}
function processTitle(fields, merchCard, titleConfig) {
  if (fields.cardTitle) {
    fields.cardTitle = processMnemonicElements(fields.cardTitle);
  }
  appendSlot("cardTitle", fields, merchCard, { cardTitle: titleConfig });
}
function processSubtitle(fields, merchCard, mapping) {
  appendSlot("subtitle", fields, merchCard, mapping);
}
function processBackgroundColor(fields, merchCard, allowedColors, backgroundColorConfig) {
  if (!fields.backgroundColor || fields.backgroundColor.toLowerCase() === "default") {
    merchCard.style.removeProperty("--merch-card-custom-background-color");
    merchCard.removeAttribute("background-color");
    return;
  }
  if (allowedColors?.[fields.backgroundColor]) {
    merchCard.style.setProperty(
      "--merch-card-custom-background-color",
      `var(${allowedColors[fields.backgroundColor]})`
    );
    merchCard.setAttribute("background-color", fields.backgroundColor);
  } else if (backgroundColorConfig?.attribute && fields.backgroundColor) {
    merchCard.setAttribute(
      backgroundColorConfig.attribute,
      fields.backgroundColor
    );
    merchCard.style.removeProperty("--merch-card-custom-background-color");
  }
}
function processBorderColor(fields, merchCard, variantMapping) {
  const borderColorConfig = variantMapping?.borderColor;
  const customBorderColor = "--consonant-merch-card-border-color";
  if (fields.borderColor?.toLowerCase() === "transparent") {
    merchCard.style.setProperty(customBorderColor, "transparent");
  } else if (fields.borderColor && borderColorConfig) {
    const specialValue = borderColorConfig?.specialValues?.[fields.borderColor];
    const isGradient = specialValue?.includes("gradient") || /-gradient/.test(fields.borderColor);
    const isSpectrumColor = /^spectrum-.*-(plans|special-offers)$/.test(
      fields.borderColor
    );
    if (isGradient) {
      merchCard.setAttribute("gradient-border", "true");
      let borderColorKey = fields.borderColor;
      if (borderColorConfig?.specialValues) {
        for (const [key, value] of Object.entries(
          borderColorConfig.specialValues
        )) {
          if (value === fields.borderColor) {
            borderColorKey = key;
            break;
          }
        }
      }
      merchCard.setAttribute("border-color", borderColorKey);
      merchCard.style.removeProperty(customBorderColor);
    } else if (isSpectrumColor) {
      merchCard.setAttribute("border-color", fields.borderColor);
      merchCard.style.setProperty(
        customBorderColor,
        `var(--${fields.borderColor})`
      );
    } else {
      merchCard.style.setProperty(
        customBorderColor,
        `var(--${fields.borderColor})`
      );
    }
  }
}
function processBackgroundImage(fields, merchCard, backgroundImageConfig) {
  if (fields.backgroundImage) {
    const imgAttributes = {
      loading: merchCard.loading ?? "lazy",
      src: fields.backgroundImage
    };
    if (fields.backgroundImageAltText) {
      imgAttributes.alt = fields.backgroundImageAltText;
    } else {
      imgAttributes.role = "none";
    }
    if (!backgroundImageConfig) return;
    if (backgroundImageConfig?.attribute) {
      merchCard.setAttribute(
        backgroundImageConfig.attribute,
        fields.backgroundImage
      );
      return;
    }
    merchCard.append(
      createTag(
        backgroundImageConfig.tag,
        { slot: backgroundImageConfig.slot },
        createTag("img", imgAttributes)
      )
    );
  }
}
function processMnemonicElements(htmlContent) {
  if (!htmlContent || typeof htmlContent !== "string") return htmlContent;
  if (htmlContent.includes("<mas-mnemonic")) {
    Promise.resolve().then(() => (init_mas_mnemonic(), mas_mnemonic_exports)).catch(console.error);
  }
  return htmlContent;
}
function processPrices(fields, merchCard, mapping) {
  if (fields.prices) {
    fields.prices = processMnemonicElements(fields.prices);
  }
  appendSlot("prices", fields, merchCard, mapping);
}
function transformLinkToButton(linkElement, merchCard, aemFragmentMapping) {
  const isCheckoutLink = linkElement.hasAttribute("data-wcs-osi") && Boolean(linkElement.getAttribute("data-wcs-osi"));
  const originalClassName = linkElement.className || "";
  const checkoutLinkStyle = CHECKOUT_STYLE_PATTERN.exec(originalClassName)?.[0] ?? "accent";
  const isAccent = checkoutLinkStyle.includes("accent");
  const isPrimary = checkoutLinkStyle.includes("primary");
  const isSecondary = checkoutLinkStyle.includes("secondary");
  const isOutline = checkoutLinkStyle.includes("-outline");
  const isLinkStyle = checkoutLinkStyle.includes("-link");
  linkElement.classList.remove("accent", "primary", "secondary");
  let newButtonElement;
  if (merchCard.consonant) {
    newButtonElement = createConsonantButton(
      linkElement,
      isAccent,
      isCheckoutLink,
      isLinkStyle,
      isPrimary,
      isSecondary,
      aemFragmentMapping?.ctas?.size
    );
  } else if (isLinkStyle) {
    newButtonElement = linkElement;
  } else {
    let variant;
    if (isAccent) {
      variant = "accent";
    } else if (isPrimary) {
      variant = "primary";
    } else if (isSecondary) {
      variant = "secondary";
    }
    newButtonElement = merchCard.spectrum === "swc" ? createSpectrumSwcButton(
      linkElement,
      aemFragmentMapping,
      isOutline,
      variant,
      isCheckoutLink
    ) : createSpectrumCssButton(
      linkElement,
      aemFragmentMapping,
      isOutline,
      variant,
      isCheckoutLink
    );
  }
  return newButtonElement;
}
function processDescriptionLinks(merchCard, aemFragmentMapping) {
  const { slot } = aemFragmentMapping?.description;
  const links = merchCard.querySelectorAll(
    `[slot="${slot}"] a[data-wcs-osi]`
  );
  if (!links.length) return;
  links.forEach((link) => {
    const checkoutLink = transformLinkToButton(
      link,
      merchCard,
      aemFragmentMapping
    );
    link.replaceWith(checkoutLink);
  });
}
function processDescription(fields, merchCard, mapping) {
  if (fields.description) {
    fields.description = processMnemonicElements(fields.description);
  }
  if (fields.promoText) {
    fields.promoText = processMnemonicElements(fields.promoText);
  }
  if (fields.shortDescription) {
    fields.shortDescription = processMnemonicElements(
      fields.shortDescription
    );
  }
  appendSlot("promoText", fields, merchCard, mapping);
  appendSlot("description", fields, merchCard, mapping);
  appendSlot("shortDescription", fields, merchCard, mapping);
  if (fields.shortDescription) {
    merchCard.setAttribute("action-menu", "true");
    if (!fields.actionMenuLabel) {
      merchCard.setAttribute("action-menu-label", "More options");
    }
  }
  processDescriptionLinks(merchCard, mapping);
  appendSlot("callout", fields, merchCard, mapping);
  appendSlot("quantitySelect", fields, merchCard, mapping);
  appendSlot("whatsIncluded", fields, merchCard, mapping);
}
function processAddon(fields, merchCard, mapping) {
  if (!mapping.addon) return;
  const addonField = fields.addon?.replace(/[{}]/g, "");
  if (!addonField) return;
  if (/disabled/.test(addonField)) return;
  const addon = createTag("merch-addon", { slot: "addon" }, addonField);
  [...addon.querySelectorAll(SELECTOR_MAS_INLINE_PRICE)].forEach((span) => {
    const parent = span.parentElement;
    if (parent?.nodeName !== "P") return;
    parent.setAttribute("data-plan-type", "");
  });
  merchCard.append(addon);
}
function processAddonConfirmation(fields, merchCard, mapping) {
  if (fields.addonConfirmation) {
    appendSlot("addonConfirmation", fields, merchCard, mapping);
  }
}
function processStockOffersAndSecureLabel(fields, merchCard, aemFragmentMapping, settings) {
  if (settings?.secureLabel && aemFragmentMapping?.secureLabel) {
    merchCard.setAttribute("secure-label", settings.secureLabel);
  }
}
function getTruncatedTextData(text, limit, withSuffix = true) {
  try {
    const _text = typeof text !== "string" ? "" : text;
    const cleanText = clearTags(_text);
    if (cleanText.length <= limit) return [_text, cleanText];
    let index = 0;
    let inTag = false;
    let remaining = withSuffix ? limit - TEXT_TRUNCATE_SUFFIX.length < 1 ? 1 : limit - TEXT_TRUNCATE_SUFFIX.length : limit;
    const openTags = [];
    for (const char of _text) {
      index++;
      if (char === "<") {
        inTag = true;
        if (_text[index] === "/") {
          openTags.pop();
        } else {
          let tagName = "";
          for (const tagChar of _text.substring(index)) {
            if (tagChar === " " || tagChar === ">") break;
            tagName += tagChar;
          }
          openTags.push(tagName);
        }
      }
      if (char === "/") {
        if (_text[index] === ">") {
          openTags.pop();
        }
      }
      if (char === ">") {
        inTag = false;
        continue;
      }
      if (inTag) continue;
      remaining--;
      if (remaining === 0) break;
    }
    let trimmedText = _text.substring(0, index).trim();
    if (openTags.length > 0) {
      if (openTags[0] === "p") openTags.shift();
      for (const tag of openTags.reverse()) {
        trimmedText += `</${tag}>`;
      }
    }
    const truncatedText = `${trimmedText}${withSuffix ? TEXT_TRUNCATE_SUFFIX : ""}`;
    return [truncatedText, cleanText];
  } catch (error) {
    const fallbackText = typeof text === "string" ? text : "";
    const cleanFallback = clearTags(fallbackText);
    return [fallbackText, cleanFallback];
  }
}
function clearTags(text) {
  if (!text) return "";
  let result = "";
  let inTag = false;
  for (const char of text) {
    if (char === "<") inTag = true;
    if (char === ">") {
      inTag = false;
      continue;
    }
    if (inTag) continue;
    result += char;
  }
  return result;
}
function processUptLinks(fields, merchCard) {
  const placeholders = merchCard.querySelectorAll("a.upt-link");
  placeholders.forEach((placeholder) => {
    const uptLink = UptLink.createFrom(placeholder);
    placeholder.replaceWith(uptLink);
    uptLink.initializeWcsData(fields.osi, fields.promoCode);
  });
}
function createSpectrumCssButton(cta, aemFragmentMapping, isOutline, variant, isCheckout) {
  let button = cta;
  if (isCheckout) {
    const CheckoutButton = customElements.get("checkout-button");
    button = CheckoutButton.createCheckoutButton({}, cta.innerHTML);
  } else {
    button.innerHTML = `<span>${button.textContent}</span>`;
  }
  button.setAttribute("tabindex", 0);
  for (const attr of cta.attributes) {
    if (["class", "is"].includes(attr.name)) continue;
    button.setAttribute(attr.name, attr.value);
  }
  button.firstElementChild?.classList.add("spectrum-Button-label");
  const size = aemFragmentMapping?.ctas?.size ?? "M";
  const variantClass = `spectrum-Button--${variant}`;
  const sizeClass = SPECTRUM_BUTTON_SIZES.includes(size) ? `spectrum-Button--size${size}` : "spectrum-Button--sizeM";
  const spectrumClass = ["spectrum-Button", variantClass, sizeClass];
  if (isOutline) {
    spectrumClass.push("spectrum-Button--outline");
  }
  button.classList.add(...spectrumClass);
  return button;
}
function createSpectrumSwcButton(cta, aemFragmentMapping, isOutline, variant, isCheckout) {
  let button = cta;
  if (isCheckout) {
    const CheckoutButton = customElements.get("checkout-button");
    button = CheckoutButton.createCheckoutButton(cta.dataset);
    button.connectedCallback();
    button.render();
  }
  let treatment = "fill";
  if (isOutline) {
    treatment = "outline";
  }
  const spectrumCta = createTag(
    "sp-button",
    {
      treatment,
      variant,
      tabIndex: 0,
      size: aemFragmentMapping?.ctas?.size ?? "m",
      ...cta.dataset.analyticsId && {
        "data-analytics-id": cta.dataset.analyticsId
      }
    },
    cta.innerHTML
  );
  spectrumCta.source = button;
  (isCheckout ? button.onceSettled() : Promise.resolve(button)).then(
    (target) => {
      spectrumCta.setAttribute("data-navigation-url", target.href);
    }
  );
  spectrumCta.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    button.click();
  });
  return spectrumCta;
}
function createConsonantButton(cta, isAccent, isCheckout, isLinkStyle, isPrimary, isSecondary, size) {
  let button = cta;
  if (isCheckout) {
    try {
      const CheckoutLink = customElements.get("checkout-link");
      if (CheckoutLink) {
        button = CheckoutLink.createCheckoutLink(
          cta.dataset,
          cta.innerHTML
        ) ?? cta;
      }
    } catch {
    }
  }
  if (!isLinkStyle) {
    button.classList.add("button", "con-button");
    if (size && size !== "m") {
      button.classList.add(`button-${size}`);
    }
    if (isAccent) {
      button.classList.add("blue");
    }
    if (isPrimary) {
      button.classList.add("primary");
    }
    if (isSecondary) {
      button.classList.add("secondary");
    }
  }
  return button;
}
function processCTAs(fields, merchCard, aemFragmentMapping, variant) {
  if (fields.ctas) {
    fields.ctas = processMnemonicElements(fields.ctas);
    const { slot } = aemFragmentMapping.ctas;
    const footer = createTag("div", { slot }, fields.ctas);
    const ctas = [...footer.querySelectorAll("a")].map(
      (cta) => transformLinkToButton(cta, merchCard, aemFragmentMapping)
    );
    footer.innerHTML = "";
    footer.append(...ctas);
    merchCard.append(footer);
  }
}
function processAnalytics(fields, merchCard) {
  const { tags } = fields;
  const cardAnalyticsId = tags?.find(
    (tag) => typeof tag === "string" && tag.startsWith(ANALYTICS_TAG)
  )?.split("/").pop();
  if (!cardAnalyticsId) return;
  merchCard.setAttribute(ANALYTICS_SECTION_ATTR, cardAnalyticsId);
  const elements = [
    ...merchCard.shadowRoot.querySelectorAll(
      `a[data-analytics-id],button[data-analytics-id]`
    ),
    ...merchCard.querySelectorAll(
      `a[data-analytics-id],button[data-analytics-id]`
    )
  ];
  elements.forEach((el, index) => {
    el.setAttribute(
      ANALYTICS_LINK_ATTR,
      `${el.dataset.analyticsId}-${index + 1}`
    );
  });
}
function updateLinksCSS(merchCard) {
  if (merchCard.spectrum !== "css") return;
  [
    ["primary-link", "primary"],
    ["secondary-link", "secondary"]
  ].forEach(([className, variant]) => {
    merchCard.querySelectorAll(`a.${className}`).forEach((link) => {
      link.classList.remove(className);
      link.classList.add("spectrum-Link", `spectrum-Link--${variant}`);
    });
  });
}
function cleanup(merchCard) {
  merchCard.querySelectorAll("[slot]").forEach((el) => {
    el.remove();
  });
  merchCard.variant = void 0;
  const attributesToRemove = [
    "checkbox-label",
    "stock-offer-osis",
    "secure-label",
    "background-image",
    "background-color",
    "border-color",
    "badge-background-color",
    "badge-color",
    "badge-text",
    "gradient-border",
    "size",
    ANALYTICS_SECTION_ATTR
  ];
  attributesToRemove.forEach((attr) => merchCard.removeAttribute(attr));
  const classesToRemove = ["wide-strip", "thin-strip"];
  merchCard.classList.remove(...classesToRemove);
}
async function hydrate(fragment, merchCard) {
  if (!fragment) {
    const cardIdForError = merchCard?.id || "unknown";
    console.error(
      `hydrate: Fragment is undefined. Cannot hydrate card (merchCard id: ${cardIdForError}).`
    );
    throw new Error(
      `hydrate: Fragment is undefined for card (merchCard id: ${cardIdForError}).`
    );
  }
  if (!fragment.fields) {
    const problemId = fragment.id || "unknown";
    const cardIdForError = merchCard?.id || "unknown";
    console.error(
      `hydrate: Fragment for card ID '${problemId}' (merchCard id: ${cardIdForError}) is missing 'fields'. Cannot hydrate.`
    );
    throw new Error(
      `hydrate: Fragment for card ID '${problemId}' (merchCard id: ${cardIdForError}) is missing 'fields'.`
    );
  }
  const { id, fields, settings = {}, priceLiterals } = fragment;
  const { variant } = fields;
  if (!variant) throw new Error(`hydrate: no variant found in payload ${id}`);
  cleanup(merchCard);
  merchCard.settings = settings;
  if (priceLiterals) merchCard.priceLiterals = priceLiterals;
  merchCard.id ?? (merchCard.id = fragment.id);
  merchCard.variant = variant;
  await merchCard.updateComplete;
  const { aemFragmentMapping: mapping } = merchCard.variantLayout;
  if (!mapping)
    throw new Error(`hydrate: variant mapping not found for ${id}`);
  if (mapping.style === "consonant") {
    merchCard.setAttribute("consonant", true);
  }
  processMnemonics(fields, merchCard, mapping.mnemonics);
  processTrialBadge(fields, merchCard, mapping);
  processSize(fields, merchCard, mapping.size);
  processCardName(fields, merchCard);
  processTitle(fields, merchCard, mapping.title);
  processBadge(fields, merchCard, mapping);
  processSubtitle(fields, merchCard, mapping);
  processPrices(fields, merchCard, mapping);
  processBackgroundImage(fields, merchCard, mapping.backgroundImage);
  processBackgroundColor(
    fields,
    merchCard,
    mapping.allowedColors,
    mapping.backgroundColor
  );
  processBorderColor(fields, merchCard, mapping);
  processDescription(fields, merchCard, mapping);
  processAddon(fields, merchCard, mapping);
  processAddonConfirmation(fields, merchCard, mapping);
  processStockOffersAndSecureLabel(fields, merchCard, mapping, settings);
  try {
    processUptLinks(fields, merchCard);
  } catch {
  }
  processCTAs(fields, merchCard, mapping, variant);
  processAnalytics(fields, merchCard);
  updateLinksCSS(merchCard);
}

// src/mas-table.css.js
var TABLE_CSS = String.raw`
.table,
.table.merch {
  --border-color: #DADADA;
  --highlight-background: #F3D949;
  --hover-border-color: #357BEB;
  --checkmark-color: #2C2C2C;
  --border-radius: 16px;

  max-width: 1200px;
  margin: auto;
  padding: 20px 0;
  border-color: var(--border-color);
}

.section[class *= "grid-width-"] .table {
  width: 100%;
}

.table a:not([class*="button"]) {
  display: inline-block;
}

.table > .row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50%, 1fr));
}

.table .col {
  display: flex;
  flex-wrap: wrap;
  min-height: 27px;
  border-left: 1px var(--border-color) solid;
  border-right: 1px solid transparent;
  border-top: 1px var(--border-color) solid;
  background-color: var(--color-white);
}

.table .col.section-row-title {
  flex-wrap: nowrap;
}

.table .section-row .col {
  align-items: center;
}

.table:not(.left, .header-left) .col{
  justify-content: center;
}

.table.top .section-row .col {
  flex-direction: column;
  justify-content: start;
}

.table.top.left .section-row .col {
  align-items: start;
}

.table:not(.merch) .col-1:not(:only-child) {
  background-color: var(--color-gray-100);
}

.table .col:last-child {
  border-right: 1px var(--border-color) solid;
}

.table .row:last-child .col {
  border-bottom: 1px var(--border-color) solid;
}

.table .col,
.table .col p {
  font-size: var(--type-body-s-size);
  line-height: var(--type-body-s-lh);
}

.table .col p {
  margin: 0;
}

.table .col p picture {
  margin-right: 8px;
}

.table .col picture {
  display: flex;
}

.section.table-section,
.section.table-merch-section {
  background: var(--color-white);
}

.table.sticky,
.table.sticky .row-1,
.table.sticky .row-heading {
  background: inherit;
}

.table.merch .col {
  border-top: 1px var(--border-color) solid;
  border-left: 1px var(--border-color) solid;
}

.table.merch .col.border-bottom {
  border-bottom: 1px var(--border-color) solid;
}

.table .row-highlight .col.col-highlight {
  border-color: transparent;
}

.table.collapse .section-head-collaped .col {
  border-bottom: 1px var(--border-color) solid;
}

.table .row-highlight .col-highlight {
  font-size: var(--type-body-s-size);
  line-height: var(--type-body-s-lh);
  background-color: var(--highlight-background);
  border: 1px solid var(--highlight-background);
  padding: 10px 30px;
  text-transform: capitalize;
  border-radius: 0;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.table .row-highlight .col-highlight:first-child:not(.hidden),
.table .row-highlight .col-highlight.hidden + .col-highlight:not(.hidden),
.table .row-highlight .col-highlight:only-child:not(.hidden) {
  border-top-left-radius: var(--border-radius);
}

.table .row-highlight .col-highlight:last-child:not(.hidden),
.table .row-highlight .col-highlight:not(.hidden):has(+ .col-highlight.hidden),
.table .row-highlight .col-highlight:only-child:not(.hidden) {
  border-top-right-radius: var(--border-radius);
}

.table .row-highlight .col-highlight.hidden {
  visibility: hidden;
}

.table .highlight-text {
  overflow: hidden;
  width: 0;
  height: 0;
}

.table .col-heading.hidden {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-radius: 0 !important;
}

[dir="rtl"] .table .row-heading .col-heading.col.no-rounded,
.table .row-heading .col-heading.col.no-rounded {
  border-radius: 0;
}

.table.merch .row-heading .col-heading:not(.no-rounded):first-child {
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: 0;
}

.table.merch .row-heading .col-heading:not(.no-rounded):last-child {
  border-top-left-radius: 0;
  border-top-right-radius: var(--border-radius);
}

[dir="rtl"] .table.merch .row-heading .col-heading:not(.no-rounded):first-child {
  border-top-left-radius: 0;
  border-top-right-radius: var(--border-radius);
}

[dir="rtl"] .table.merch .row-heading .col-heading:not(.no-rounded):last-child {
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: 0;
}

.table.m-heading-icon .row-heading .col-heading img {
  height: var(--icon-size-m);
  width: auto;
}

.table .section-row .col.section-row-title,
.table .section-row .col.section-row-title p {
  font-size: var(--type-body-s-size);
  line-height: var(--type-body-s-lh);
}

.table:not(.merch):not(.left, .header-left) .section-row .col:not(.section-row-title),
.table .row-heading .col.col-heading {
  text-align: center;
}

.table .row-heading .col.col-heading {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.table .col-heading * {
  max-width: 100%;
}

.table .row-heading .col.col-heading .buttons-wrapper {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.table.header-left .row-heading .col.col-heading {
  text-align: start;
  padding: 24px;
}

.table .row-heading .col.col-heading .action-area {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.table.header-left .row-heading .col.col-heading .buttons-wrapper {
  justify-content: flex-start;
}

.table.button-right.merch .row-heading .col.col-heading .buttons-wrapper {
  justify-content: flex-end;
}

.table.merch.button-right .row-heading .col.col-heading .buttons-wrapper > * {
  margin: 12px 0 12px 12px;
}

.table .row-heading .col.col-heading .buttons-wrapper > * {
  margin: 10px 6px;
}

.table.header-left .row-heading .col.col-heading .buttons-wrapper > * {
  margin-inline-start: 0;
}

.table .row-heading .col-heading .header-product-tile {
  display: inline-flex;
  gap: 8px;
  justify-content: center;
}

.table.header-left .row-heading .col-heading .header-product-tile {
  justify-content: flex-start;
}

.table .row-heading .col-heading .header-product-tile picture {
  display: flex;
  margin: 0;
}

.table .row-heading .col-heading .tracking-header {
  font-size: var(--type-heading-s-size);
  line-height: var(--type-heading-s-lh);
  font-weight: bold;
  padding: var(--spacing-xxs) 0;
}

.table .row-heading .col-heading .pricing {
  font-size: var(--type-heading-m-size);
  line-height: var(--type-heading-m-lh);
  font-weight: bold;
  padding: var(--spacing-xxs) 0;
}

.table .row-heading .col-heading .pricing [is='inline-price'],
.table .row-heading .col-heading .pricing .placeholder-resolved {
  display: inline-block;
  min-height: 30px;
  min-width: 1px;
  line-height: 30px;
}

.table .row-heading .col-heading .pricing .price:not(.price-strikethrough):not(.price-promo-strikethrough):not(.price-legal) {
  font-size: var(--type-heading-m-size);
  line-height: var(--type-heading-m-lh);
  font-weight: 700;
}

.table .row-heading .col-heading .pricing [data-template='strikethrough'],
.table .row-heading .col-heading .pricing .price-strikethrough {
  display: inline-block;
  font-size: var(--type-body-s-size);
  line-height: var(--type-heading-m-lh);
  font-weight: 700;
}

.table .divider {
  display: none;
}

.table .section-head .col {
  background-color: var(--color-gray-100);
  padding: 24px;
}

.table .section-row .col {
  padding: 16px 24px;
  column-gap: 0.5ch;
}

.table .section-row .col:has(> p:nth-child(2)) {
  flex-direction: column;
}

.table.header-left .section-row .col:has(> p:nth-child(2)),
.table.left .section-row .col:has(> p:nth-child(2)) {
  align-items: flex-start;
}

.table .section-head-title.point-cursor {
  cursor: pointer;
}

.table .section-head .section-head-title > :not(.icon) {
  font-size: var(--type-body-m-size);
  line-height: var(--type-heading-s-lh);
  width: calc(100% - 25px);
}

.table .section-head .section-head-title,
.table .section-row .section-row-title,
.table .section-row .section-row-title .table-title-row,
.table.merch .section-head .col-merch,
.table.merch .section-row .col-merch {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table.collapse .section-row.hidden {
  display: none;
}

.table:not(.merch) .section-head > :not(:first-child) {
  border-left-color: transparent;
}

.table:not(.merch) .section-head > :not(:last-child) {
  border-right-color: transparent;
}

.table .light {
  color: var(--color-white);
}

.table:not(.merch) .row .col span.milo-tooltip {
  margin-right: -4px;
}

[dir='rtl'] .table:not(.merch) .row .col span.milo-tooltip {
  margin-right: 0;
  margin-left: -4px;
}

.table span[data-tooltip] .icon-milo {
  height: 16px;
}

.table span[data-tooltip] .icon-milo:hover {
  cursor: pointer;
}

.table span[data-tooltip] .active .icon-milo path,
.table span[data-tooltip] .icon-milo:hover path {
  color: var(--hover-border-color);
}

.table .icon-milo-checkmark {
  color: var(--checkmark-color);
  width: 21px;
  height: 100%;
}

.table .icon.expand {
  background-color: transparent;
  border: 0;
  background-image: url('../../ui/img/chevron-wide-black.svg');
  background-repeat: no-repeat;
  background-position: center;
  width: 12px;
  aspect-ratio: 1.7;
  cursor: pointer;
  rotate: -90deg;
  background-size: contain;
}

[dir="rtl"] .table .icon.expand {
  rotate: 90deg;
}

.table .section-head-title:hover .icon.expand {
  filter: invert(41%) sepia(22%) saturate(100) hue-rotate(203deg) brightness(96%) contrast(93%);
}

.table .icon.expand[aria-expanded=true] {
  rotate: unset;
}

.table .row-highlight .col-highlight.transparent-border {
  border-color: transparent;
}

[dir="rtl"] .table .col {
  border-right: 1px var(--border-color) solid;
  border-left: 1px var(--border-color) solid;
}

[dir="rtl"] .table.merch .col {
  border-left: 1px var(--border-color) solid;
}

[dir="rtl"] .table .col:first-child {
  border-right: 1px var(--border-color) solid;
}

[dir="rtl"] .table .col:last-child:not(.hover) {
  border-left: 1px var(--border-color) solid;
}

[dir="rtl"] .table.merch .col-merch .col-merch-content picture {
  margin-right: 0;
  margin-left: 16px;
}

@media (min-width: 900px) {
  .table .col.hover {
    border-left: 1px solid var(--hover-border-color);
    border-right: 1px solid var(--hover-border-color);
  }

  .table .row-highlight .col-highlight {
    border-top-color: transparent;
    border-left-color: transparent;
    border-right-color: transparent;
  }

  .table .row-highlight .col-highlight.hover {
    border-top: 1px solid var(--hover-border-color);
    border-left: 1px solid var(--hover-border-color);
    border-right: 1px solid var(--hover-border-color);
  }

  [dir="rtl"] .table .col-heading:first-child {
    border-top-left-radius: 0;
    border-top-right-radius: var(--border-radius);
  }

  [dir="rtl"] .table .col-heading:last-child {
    border-top-right-radius: 0;
    border-top-left-radius: var(--border-radius);
  }

  .table .row-heading .col-heading.hover {
    border-top: 1px solid var(--hover-border-color);
  }

  .table .row:last-child .col.hover,
  .table .col.hover.hover-border-bottom {
    border-bottom: 1px solid var(--hover-border-color);
  }

  .table .col.no-top-border.hover {
    border-top-color: var(--border-color);
  }

  .table .section-head .col.hover {
    border-right: 1px solid var(--hover-border-color);
    border-left: 1px solid var(--hover-border-color);
  }

  .table .row:not(.section-head) .col:not(.col-highlight):not(.hidden).hover {
    background-color: var(--color-gray-100);
  }

  .table.merch .col.hover {
    border-left: 1px solid var(--hover-border-color);
    border-right: 1px solid var(--hover-border-color);
  }

  .table.merch .col.border-bottom.hover {
    border-bottom: 1px solid var(--hover-border-color);
  }
}

.table.has-addon .row-heading .col.col-heading:not(.col-1) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-xxs);
  padding: var(--spacing-xs);
}

.table.has-addon .row-heading .col.col-heading:not(.col-1) .buttons-wrapper {
  align-items: flex-end;
}

.table.has-addon p.body {
  font-size: var(--type-body-xxs-size);
  line-height: var(--type-body-xxs-lh);
  margin-bottom: var(--spacing-xxs);
}

.table.has-addon .addon-label {
  font-size: var(--type-body-xs-size);
  line-height: var(--type-body-xs-lh);
  border-radius: 4px;
  display: flex;
  align-items: start;
  flex-direction: row;
  text-align: start;
  font-style: normal;
  font-weight: 400;
  color: black;
  padding: 5px 10px;
  box-sizing: border-box;
}

.table.has-addon .addon-label:not(:empty) {
  background-color: var(--color-gray-300);
}

.table.has-addon .addon-label .icon {
  display: flex;
  align-self: center;
}

.table.has-addon .addon-label .icon,
.table.has-addon span[data-tooltip] .active .icon-milo path {
  color: black;
}

.table.has-addon .pricing-before,
.table.has-addon .pricing-after {
  min-height: 21px;
  font-size: var(--type-body-xs-size);
  line-height: var(--type-body-xs-lh);
}

.table.has-addon .pricing-after {
  margin-bottom: var(--spacing-xxs);
}

.table.has-addon .pricing.has-pricing-before {
  padding-top: 0;
}

.table.has-addon .pricing.has-pricing-after {
  padding-bottom: 0;
}

.table.has-addon .table-title-text .blockquote,
.table.has-addon .table-title-text code {
  font-family: var(--body-font-family);
  background-color: var(--color-gray-300);
  padding: 2px 10px;
  border-radius: 4px;
  margin: 0;
  margin-bottom: var(--spacing-xxs);
  display: inline-block;
  font-size: var(--type-body-xs-size);
  line-height: var(--type-body-xs-lh);
  color: black;
}

.table.has-addon .col.section-row-title .blockquote p {
  font-size: var(--type-body-xs-size);
  line-height: var(--type-body-xs-lh);
}

.table.has-addon .addon-promo {
  color: #05834E;
  font-size: var(--type-body-xs-size);
  line-height: var(--type-body-xs-lh);
  margin-bottom: var(--spacing-xxs);
}

.table.has-addon .addon-promo a {
  font-weight: 700;
  text-decoration: underline;
}

.table .row-highlight,
.table .row-heading {
  position: sticky;
  z-index: 1;
  transition: box-shadow 200ms cubic-bezier(0.33, 1, 0.68, 1);
}

.table.cancel-sticky .row-heading,
.table.cancel-sticky .row-highlight {
  position: static;
}

.table:not(.merch) .row-heading.active,
.table.merch .row-heading.active .col-heading {
  transition-duration: 400ms;
  box-shadow: 0 6px 3px -3px rgb(0 0 0 / 15%);
}

.table[class*="sticky"] .row-heading.active {
  z-index: 3;
}

.top-border-transparent {
  border-top: 1px solid transparent;
}

.table .col-heading:not(.left-round):last-child {
  border-top-right-radius: var(--border-radius);
}

[dir="rtl"] .table .col-heading:not(.left-round):last-child {
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: 0;
}

@media (min-width: 769px) {
  .table .col-heading:first-child {
    border-top-left-radius: var(--border-radius);
  }

  .table-section .filters {
    display: none;
  }

  .table.merch .filters {
    display: grid;
  }

  .table > .row {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .table.merch > .row {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-m);
  }
}

@media (min-width: 900px) {
  .table-merch-section .filters {
    display: none;
  }
}

.table.merch > .row {
  grid-template-columns: repeat(auto-fit, minmax(100px, 2fr));
  gap: var(--spacing-xs);
}

.table.merch .section-head .col.section-head-title ,
.table.merch .row-heading .col.col-heading {
  text-align: left;
}

.table.merch .col,
.table.merch .row-heading .col.col-heading {
  padding-left: 24px;
  padding-right: 24px;
}

.table.merch .row-heading .col.col-heading .buttons-wrapper {
  justify-content: flex-start;
}

.table.merch .row-heading .col.col-heading .buttons-wrapper > * {
  margin: 12px 12px 12px 0;
}

.table.merch .col.no-borders {
  visibility: hidden;
}

.table.merch .section-head .col {
  padding: 24px;
}

.table.merch .col-merch .col-merch-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  border: none;
}

.table.merch .col-merch .col-merch-content picture {
  display: flex;
  width: 30px;
  margin-right: 16px;
}

.table .col-heading:only-child {
  border-top-right-radius: var(--border-radius);
  border-top-left-radius: var(--border-radius);
}

@media (max-width: 899px) {
  .table,
  .table.merch {
    margin: 0 30px;
  }
  
  [dir="rtl"] .table .left-round,
  .table .right-round {
    border-top-right-radius: var(--border-radius);
    border-top-left-radius: 0;
  }
  
  [dir="rtl"] .table .right-round,
  .table .left-round {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: 0;
  }

  .section[class *= "grid-width-"] .table {
    margin: 0;
  }

  .table:not(.merch) .row .section-head-title,
  .table:not(.merch) .row .section-row-title {
    border-right: 1px solid var(--border-color);
  }

  .table:not(.merch) .section-head {
    display: block;
  }

  .table .section-head .col:not(.section-head-title),
  .table:not(.merch) .col-heading.col-1,
  .table:not(.merch) .row-highlight .col-highlight.col-1:not(:only-child) {
    display: none;
  }

  .table:not(.merch) .row-highlight:has(> :only-child) {
    grid-template-columns: repeat(auto-fit, 100%);
  }

  .table:not(.merch) .section-row-title {
    grid-row: 1;
    grid-column: 1 / x;
    background-color: var(--color-gray-100);
  }

  .table .row-heading .col-heading .pricing {
    overflow-wrap: anywhere;
  }

  .table .row-heading .col-heading span[is='inline-price'] {
    display: inline;
  }

  .table .row-heading .col:nth-child(n+1) {
    padding: 20px;
  }

  .table:not(.merch) .row-heading .col-heading.col-1.hidden + .col-heading:not(.hidden) {
    border-top-left-radius: var(--border-radius);
  }

  [dir="rtl"] .table:not(.merch) .row-heading .col-heading.col-1.hidden + .col-heading:not(.hidden) {
    border-top-left-radius: 0;
    border-top-right-radius: var(--border-radius);
  }

  .table .hide-mobile {
    display: none !important;
  }
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  padding: 20px 30px 0;
  gap: 30px;
}

.filter-wrapper {
  text-align: center;
}

.filter {
  border: none;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 146px;
  appearance: none;
  position: relative;
  padding-right: 30px;
  background: url("../../ui/img/chevron-wide-black.svg") no-repeat 100%;
}

@media (max-width: 768px) {
  .table .col {
    border: 1px var(--border-color) solid;
  }

  .table .col.force-last {
    order: 1;
  }

  .table .col-heading.force-last {
    border-top-right-radius: var(--border-radius);
    border-top-left-radius: 0;
  }

  [dir="rtl"] .table .col-heading.force-last {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: 0;
  }

  .table .col-heading.force-last + .col-heading {
    border-top-right-radius: 0;
    border-top-left-radius: var(--border-radius);
  }

  [dir="rtl"] .table .col-heading.force-last + .col-heading {
    border-top-left-radius: 0;
    border-top-right-radius: var(--border-radius);
  }

  .table:not(.merch) .section-row-title {
    grid-column: 1 / span 2;
  }
}

@media (max-width: 600px) {
  .table.header-left .row-heading .col.col-heading {
    padding: var(--spacing-xs);
  }
}

@media (max-width: 480px) {
  .table,
  .table.merch {
    min-width: 100%;
    margin: 0;
  }

  .table.merch .col-merch .col-merch-content {
    flex-direction: column;
    align-items: initial;
  }

  .table :is(.heading-button,.action-area) {
    max-width: 100%;
  }
}
`;

// src/variants/mini-compare-chart.js
import { html as html17, css as css15, unsafeCSS as unsafeCSS3 } from "./lit-all.min.js";

// src/variants/variant-layout.js
import { html as html16, nothing as nothing5 } from "./lit-all.min.js";

// src/variants/catalog.js
import { html as html2, css as css2 } from "./lit-all.min.js";

// src/media.js
var MOBILE_LANDSCAPE = "(max-width: 767px)";
var TABLET_DOWN = "(max-width: 1199px)";
var TABLET_UP = "(min-width: 768px)";
var DESKTOP_UP = "(min-width: 1200px)";
var LARGE_DESKTOP = "(min-width: 1600px)";
var Media = {
  matchMobile: window.matchMedia(MOBILE_LANDSCAPE),
  matchDesktop: window.matchMedia(`${DESKTOP_UP} and (not ${LARGE_DESKTOP})`),
  matchDesktopOrUp: window.matchMedia(DESKTOP_UP),
  matchLargeDesktop: window.matchMedia(LARGE_DESKTOP),
  get isMobile() {
    return this.matchMobile.matches;
  },
  get isDesktop() {
    return this.matchDesktop.matches;
  },
  get isDesktopOrUp() {
    return this.matchDesktopOrUp.matches;
  }
};
var media_default = Media;
function isDesktop() {
  return Media.isDesktop;
}

// src/variants/catalog.css.js
var CSS = `
:root {
    --consonant-merch-card-catalog-width: 302px;
    --consonant-merch-card-catalog-icon-size: 40px;
}

.collection-container.catalog {
    --merch-card-collection-card-min-height: 330px;
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

merch-sidenav.catalog {
    --merch-sidenav-title-font-size: 15px;
    --merch-sidenav-title-font-weight: 500;
    --merch-sidenav-title-line-height: 19px;
    --merch-sidenav-title-color: rgba(70, 70, 70, 0.87);
    --merch-sidenav-title-padding: 8px 15px 21px;
    --merch-sidenav-item-height: 40px;
    --merch-sidenav-item-inline-padding: 15px;
    --merch-sidenav-item-font-weight: 700;
    --merch-sidenav-item-font-size: 17px;
    --merch-sidenav-item-line-height: normal;
    --merch-sidenav-item-label-top-margin: 8px;
    --merch-sidenav-item-label-bottom-margin: 11px;
    --merch-sidenav-item-icon-top-margin: 11px;
    --merch-sidenav-item-icon-gap: 13px;
    --merch-sidenav-item-selected-background: var(--spectrum-gray-300, #D5D5D5);
    --merch-sidenav-list-item-gap: 5px;
    --merch-sidenav-checkbox-group-padding: 0 15px;
    --merch-sidenav-modal-border-radius: 0;
}

merch-sidenav.catalog merch-sidenav-checkbox-group {
    border: none;
}

merch-sidenav.catalog merch-sidenav-list:not(:first-of-type) {
    --merch-sidenav-list-gap: 32px;
}

.one-merch-card.catalog,
.two-merch-cards.catalog,
.three-merch-cards.catalog,
.four-merch-cards.catalog {
    --merch-card-collection-card-width: var(--consonant-merch-card-catalog-width);
}

merch-card[variant="catalog"][size="wide"],
merch-card[variant="catalog"][size="super-wide"] {
    width: auto;
}

.collection-container.catalog merch-sidenav {
    --merch-sidenav-gap: 10px;
}

merch-card-collection-header.catalog {
    --merch-card-collection-header-row-gap: var(--consonant-merch-spacing-xs);
    --merch-card-collection-header-search-max-width: 244px;
}

@media screen and ${MOBILE_LANDSCAPE} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-columns: min-content auto;
    }
}

@media screen and ${TABLET_UP} {
    merch-card-collection-header.catalog {
        --merch-card-collection-header-column-gap: 16px;
    }
}

@media screen and ${DESKTOP_UP} {
    :root {
        --consonant-merch-card-catalog-width: 276px;
    }

    merch-card-collection-header.catalog {
        --merch-card-collection-header-result-font-size: 17px;
    }
}

merch-card[variant="catalog"] [slot="action-menu-content"] {
  background-color: #000;
  color: var(--color-white, #fff);
  font-size: var(--consonant-merch-card-body-xs-font-size);
  width: fit-content;
  padding: var(--consonant-merch-spacing-xs);
  border-radius: var(--consonant-merch-spacing-xxxs);
  position: absolute;
  top: 55px;
  right: 15px;
  line-height: var(--consonant-merch-card-body-line-height);
}

[dir="rtl"] merch-card[variant="catalog"] [slot="action-menu-content"] {
  right: initial;
  left: 15px;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul {
  padding-left: 0;
  padding-bottom: var(--consonant-merch-spacing-xss);
  margin-top: 0;
  margin-bottom: 0;
  list-style-position: inside;
  list-style-type: '\u2022 ';
}

[dir="rtl"] merch-card[variant="catalog"] [slot="action-menu-content"] ul {
  padding-right: 0;
  padding-left: unset;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul li {
  padding-left: 0;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="action-menu-content"] ul li p {
  display: inline;
}

merch-card[variant="catalog"] [slot="action-menu-content"] ::marker {
  margin-right: 0;
}

merch-card[variant="catalog"] [slot="action-menu-content"] p {
  color: var(--color-white, #fff);
  margin: 0;
}

merch-card[variant="catalog"] [slot="action-menu-content"] a {
  color: var(--consonant-merch-card-background-color);
  text-decoration: underline;
}

merch-card[variant="catalog"] .payment-details {
  font-size: var(--consonant-merch-card-body-font-size);
  font-style: italic;
  font-weight: 400;
  line-height: var(--consonant-merch-card-body-line-height);
}

merch-card[variant="catalog"] [slot="footer"] .spectrum-Link--primary {
  font-size: 15px;
  font-weight: 700;
}`;

// src/variants/catalog.js
var CATALOG_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  badge: true,
  ctas: { slot: "footer", size: "m" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  prices: { tag: "h3", slot: "heading-xs" },
  shortDescription: {
    tag: "div",
    slot: "action-menu-content",
    attributes: { tabindex: "0" }
  },
  size: ["wide", "super-wide"],
  title: { tag: "h3", slot: "heading-xs" }
};
var Catalog = class extends VariantLayout {
  constructor(card) {
    super(card);
    __publicField(this, "dispatchActionMenuToggle", () => {
      this.card.dispatchEvent(
        new CustomEvent(EVENT_MERCH_CARD_ACTION_MENU_TOGGLE, {
          bubbles: true,
          composed: true,
          detail: {
            card: this.card.name,
            type: "action-menu"
          }
        })
      );
    });
    __publicField(this, "toggleActionMenu", (e) => {
      if (!this.actionMenuContentSlot || !e || e.type !== "click" && e.code !== "Space" && e.code !== "Enter")
        return;
      e.preventDefault();
      e.stopPropagation();
      this.setMenuVisibility(!this.isMenuOpen());
    });
    __publicField(this, "toggleActionMenuFromCard", (e) => {
      const retract = e?.type === "mouseleave" ? true : void 0;
      this.card.blur();
      this.setIconVisibility(false);
      if (!this.actionMenuContentSlot) return;
      if (e?.type === "mouseleave") {
        this.setMenuVisibility(false);
      }
    });
    __publicField(this, "showActionMenuOnHover", () => {
      if (!this.actionMenu) return;
      this.setIconVisibility(true);
    });
    __publicField(this, "hideActionMenu", () => {
      this.setMenuVisibility(false);
      this.setIconVisibility(false);
    });
    __publicField(this, "hideActionMenuOnBlur", (e) => {
      if (e.relatedTarget === this.actionMenu || this.actionMenu?.contains(e.relatedTarget))
        return;
      if (this.slottedContent?.contains(e.relatedTarget)) return;
      if (this.isMenuOpen()) {
        this.setMenuVisibility(false);
      }
      if (!this.card.contains(e.relatedTarget)) {
        this.setIconVisibility(false);
      }
    });
    __publicField(this, "handleCardFocusOut", (e) => {
      if (e.relatedTarget === this.actionMenu || this.actionMenu?.contains(e.relatedTarget) || e.relatedTarget === this.card) {
        return;
      }
      if (this.slottedContent && (e.target === this.slottedContent || this.slottedContent.contains(e.target))) {
        if (!this.slottedContent.contains(e.relatedTarget)) {
          this.setMenuVisibility(false);
        }
      }
      if (!this.card.contains(e.relatedTarget) && !this.isMenuOpen()) {
        this.setIconVisibility(false);
      }
    });
    __publicField(this, "handleKeyDown", (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        this.hideActionMenu();
        this.actionMenu?.focus();
      }
    });
  }
  get actionMenu() {
    return this.card.shadowRoot.querySelector(".action-menu");
  }
  get actionMenuContentSlot() {
    return this.card.shadowRoot.querySelector(
      'slot[name="action-menu-content"]'
    );
  }
  get slottedContent() {
    return this.card.querySelector('[slot="action-menu-content"]');
  }
  setIconVisibility(visible) {
    if (this.slottedContent) {
      if (isMobileOrTablet() && this.card.actionMenu) return;
      this.actionMenu?.classList.toggle("invisible", !visible);
      this.actionMenu?.classList.toggle("always-visible", visible);
    }
  }
  setMenuVisibility(open) {
    this.actionMenuContentSlot?.classList.toggle("hidden", !open);
    this.setAriaExpanded(this.actionMenu, open.toString());
    if (open) {
      this.dispatchActionMenuToggle();
      setTimeout(() => {
        const firstLink = this.slottedContent?.querySelector("a");
        if (firstLink) firstLink.focus();
      }, 0);
    }
  }
  isMenuOpen() {
    return !this.actionMenuContentSlot?.classList.contains("hidden");
  }
  renderLayout() {
    return html2` <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot> ${this.badge}
                    <div
                        class="action-menu
                ${this.slottedContent ? isMobileOrTablet() && this.card.actionMenu ? "always-visible" : "invisible" : "hidden"}"
                        @click="${this.toggleActionMenu}"
                        @keypress="${this.toggleActionMenu}"
                        @focus="${this.showActionMenuOnHover}"
                        @blur="${this.hideActionMenuOnBlur}"
                        tabindex="0"
                        aria-expanded="false"
                        aria-hidden="false"
                        role="button"
                    >
                        ${this.card.actionMenuLabel} - ${this.card.title}
                    </div>
                </div>
                <slot
                    name="action-menu-content"
                    class="action-menu-content
            ${!this.card.actionMenuContent ? "hidden" : ""}"
                    >${this.card.actionMenuContent}
                </slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-m"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html2`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html2`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
  }
  getGlobalCSS() {
    return CSS;
  }
  setAriaExpanded(element, value) {
    element.setAttribute("aria-expanded", value);
  }
  connectedCallbackHook() {
    this.card.addEventListener("mouseenter", this.showActionMenuOnHover);
    this.card.addEventListener("mouseleave", this.toggleActionMenuFromCard);
    this.card.addEventListener("focusin", this.showActionMenuOnHover);
    this.card.addEventListener("focusout", this.handleCardFocusOut);
    this.card.addEventListener("keydown", this.handleKeyDown);
  }
  disconnectedCallbackHook() {
    this.card.removeEventListener("mouseenter", this.showActionMenuOnHover);
    this.card.removeEventListener(
      "mouseleave",
      this.toggleActionMenuFromCard
    );
    this.card.removeEventListener("focusin", this.showActionMenuOnHover);
    this.card.removeEventListener("focusout", this.handleCardFocusOut);
    this.card.removeEventListener("keydown", this.handleKeyDown);
  }
};
__publicField(Catalog, "variantStyle", css2`
        :host([variant='catalog']) {
            min-height: 330px;
            width: var(--consonant-merch-card-catalog-width);
        }

        .body .catalog-badge {
            display: flex;
            height: fit-content;
            flex-direction: column;
            width: fit-content;
            max-width: 140px;
            border-radius: 5px;
            position: relative;
            top: 0;
            margin-left: var(--consonant-merch-spacing-xxs);
            box-sizing: border-box;
        }

        :host([variant='catalog']) .action-menu:dir(rtl) {
            right: initial;
            left: 16px;
        }
    `);

// src/variants/image.js
import { html as html3, css as css3 } from "./lit-all.min.js";

// src/variants/image.css.js
var CSS2 = `
:root {
  --consonant-merch-card-image-width: 300px;
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

.one-merch-card.image,
.two-merch-cards.image,
.three-merch-cards.image,
.four-merch-cards.image {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
  grid-template-columns: minmax(300px, var(--consonant-merch-card-image-width));
}

.section[class*="-merch-cards"]:has(merch-card[variant="image"]) > .content {
  --merch-card-collection-card-width: var(--consonant-merch-card-image-width);
}

@media screen and ${TABLET_UP} {
  .two-merch-cards.image,
  .three-merch-cards.image,
  .four-merch-cards.image {
      grid-template-columns: repeat(2, minmax(300px, var(--consonant-merch-card-image-width)));
  }
}

@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-image-width: 378px;
  }

  .three-merch-cards.image {
      grid-template-columns: repeat(3, var(--consonant-merch-card-image-width));
  }

  .four-merch-cards.image {
      grid-template-columns: repeat(4, var(--consonant-merch-card-image-width));
  }
}
`;

// src/variants/image.js
var IMAGE_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  badge: {
    tag: "div",
    slot: "badge",
    default: "spectrum-yellow-300-plans"
  },
  badgeIcon: true,
  borderColor: { attribute: "border-color" },
  allowedBadgeColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-gray-700-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  ctas: { slot: "footer", size: "m" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  prices: { tag: "h3", slot: "heading-xs" },
  promoText: { tag: "p", slot: "promo-text" },
  size: ["wide", "super-wide"],
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "body-xxs" },
  backgroundImage: { tag: "div", slot: "bg-image" }
};
var Image = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS2;
  }
  renderLayout() {
    return html3`<div class="image">
                <slot name="bg-image"></slot>
                <slot name="badge"></slot>
            </div>
            <div class="body">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${this.promoBottom ? html3`<slot name="body-xs"></slot
                          ><slot name="promo-text"></slot>` : html3`<slot name="promo-text"></slot
                          ><slot name="body-xs"></slot>`}
            </div>
            ${this.evergreen ? html3`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card["detailBg"]}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  ` : html3`
                      <hr />
                      ${this.secureLabelFooter}
                  `}`;
  }
};
__publicField(Image, "variantStyle", css3`
        :host([variant='image']) {
            min-height: 330px;
            width: var(--consonant-merch-card-image-width);
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='image']) ::slotted([slot='badge']) {
            position: absolute;
            top: 16px;
            right: 0px;
        }

        :host-context([dir='rtl'])
            :host([variant='image'])
            ::slotted([slot='badge']) {
            left: 0px;
            right: initial;
        }
    `);

// src/variants/inline-heading.js
import { html as html4 } from "./lit-all.min.js";

// src/variants/inline-heading.css.js
var CSS3 = `
:root {
  --consonant-merch-card-inline-heading-width: 300px;
}

.one-merch-card.inline-heading,
.two-merch-cards.inline-heading,
.three-merch-cards.inline-heading,
.four-merch-cards.inline-heading {
    grid-template-columns: var(--consonant-merch-card-inline-heading-width);
}

@media screen and ${TABLET_UP} {
  .two-merch-cards.inline-heading,
  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(2, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-inline-heading-width: 378px;
  }

  .three-merch-cards.inline-heading,
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(3, var(--consonant-merch-card-inline-heading-width));
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.inline-heading {
      grid-template-columns: repeat(4, var(--consonant-merch-card-inline-heading-width));
  }
}
`;

// src/variants/inline-heading.js
var InlineHeading = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS3;
  }
  renderLayout() {
    return html4` ${this.badge}
            <div class="body">
                <div class="top-section">
                    <slot name="icons"></slot>
                    <slot name="heading-xs"></slot>
                </div>
                <slot name="body-xs"></slot>
            </div>
            ${!this.card.customHr ? html4`<hr />` : ""} ${this.secureLabelFooter}`;
  }
};

// src/variants/mini-compare-chart-mweb.js
import { html as html5, css as css4, unsafeCSS, nothing } from "./lit-all.min.js";

// src/variants/mini-compare-chart-mweb.css.js
var CSS4 = `
  :root {
    --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
    --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  }

  merch-card[variant="mini-compare-chart-mweb"] {
    background: linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--consonant-merch-card-border-color, #E9E9E9) border-box;
    border: 1px solid transparent;
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
    width: 100%;
    box-sizing: border-box;
    position: relative;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="badge"] {
    position: absolute;
    top: 16px;
    inset-inline-end: 0;
    line-height: 16px;
  }

  merch-card[variant="mini-compare-chart-mweb"] div[class$='-badge']:dir(rtl) {
    left: 0;
    right: initial;
    padding: 8px 11px;
    border-radius: 0 5px 5px 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-badge {
    max-width: calc(var(--consonant-merch-card-plans-width) * var(--merch-badge-card-size) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-inline-end: 8px;
    border-radius: .5rem;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart-mweb"] [is="inline-price"] {
    display: inline-block;
    min-height: 30px;
    min-width: 1px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .price-unit-type.disabled,
  merch-card[variant="mini-compare-chart-mweb"] .price-tax-inclusivity.disabled {
    display: none;
  }

	merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
		padding: unset;
	}

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-unit-type.disabled,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-tax-inclusivity.disabled {
    display: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span.price.price-strikethrough,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] s {
    font-size: 20px;
    color: #6B6B6B;
    text-decoration: line-through;
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"]:has(span[is='inline-price'] + span[is='inline-price']) span[is='inline-price'] {
    display: inline;
    text-decoration: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] [is="inline-price"][data-template="legal"] {
    display: block;
    min-height: unset;
    padding: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-recurrence,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span[data-template="recurrence"] {
    text-transform: lowercase;
    line-height: 1.4;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-plan-type,
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] span[data-template="planType"] {
    text-transform: unset;
    display: block;
    color: var(--spectrum-gray-700, #505050);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    padding: 12px 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    margin-block-end: calc(-1 * var(--consonant-merch-spacing-xxs));
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] a.spectrum-Link.spectrum-Link--secondary {
    color: inherit;
  }

  merch-card[variant="mini-compare-chart-mweb"] ul {
    padding: 0;
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] ul li {
    font-family: 'Adobe Clean', sans-serif;
    color: #292929;
    line-height: 140%;
    display: inline-flex;
    list-style: none;
    padding: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] ul li::before {
    display: inline-block;
    content: var(--list-checked-icon);
    margin-right: var(--consonant-merch-spacing-xxs);
    vertical-align: middle;
    flex-shrink: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] .action-area {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="footer-rows"] ul {
    margin-block-start: 0px;
    margin-block-end: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon img {
    max-width: initial;
    width: 32px;
    height: 32px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-s-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-s-line-height);
    color: #2C2C2C;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
    color: #2C2C2C;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart-mweb"] .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
    background-size: 28px 28px;
    background-position: center;
    background-repeat: no-repeat;
    transition: background-image 0.3s ease;
  }

  merch-card[variant="mini-compare-chart-mweb"] .toggle-icon.expanded {
    background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container.open {
    display: block;
    padding-block-start: 12px;
    padding-block-end: 4px;
  }

.collection-container.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
}

.one-merch-card.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart-mweb,
.three-merch-cards.mini-compare-chart-mweb,
.four-merch-cards.mini-compare-chart-mweb {
  --merch-card-collection-card-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Sections inside tabs/fragments that don't receive the .mini-compare-chart-mweb class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content,
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .content {
  display: contents;
}

.one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Place compare-plans text-block below all cards in multi-card layouts */
.two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block,
.three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block,
.four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) .text-block {
  grid-column: 1 / -1;
}

/* bullet list */
merch-card[variant="mini-compare-chart-mweb"] {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-m-font-size);
  line-height: 1.4;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual,
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual-prefix::after,
merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] >.price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart-mweb"].bullet-list p.card-heading[slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
  padding: 12px 0 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
	font-size: var(--consonant-merch-card-heading-xxs-font-size);
	line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
  padding: 0 0 var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
  padding: 12px var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart-mweb"] [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart-mweb"] merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart-mweb"] footer {
  gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] [slot="secure-transaction-label"] {
	display: flex;
}

merch-card[variant="mini-compare-chart-mweb"] .footer-rows-container {
  background-color: #F8F8F8;
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart-mweb"] .price-plan-type{

    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
		font-style: italic;
}

/* mini compare mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-heading-l-font-size);
    line-height: var(--consonant-merch-card-heading-l-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
    font-size: var(--consonant-merch-card-body-m-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
    font-size: var(--consonant-merch-card-body-xxs-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
		font-size: var(--consonant-merch-card-body-s-font-size);
		line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${TABLET_DOWN} {
  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-xs"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-xs"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }
}
@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-mweb-width), var(--consonant-merch-card-mini-compare-chart-mweb-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-mweb-width), var(--consonant-merch-card-mini-compare-chart-mweb-wide-width)));
  }

  merch-card[variant="mini-compare-chart-mweb"] [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart-mweb"] .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
  }

  merch-card[variant="mini-compare-chart-mweb"] .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-mweb-width: 378px;
    --consonant-merch-card-mini-compare-chart-mweb-wide-width: 484px;
  }
  .one-merch-card.mini-compare-chart-mweb,
  .one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  }

  .two-merch-cards.mini-compare-chart-mweb,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-mweb-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards.mini-compare-chart-mweb,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-mweb-width));
    gap: var(--consonant-merch-spacing-m);
  }

  /* Card fills the wider column in sparse layouts (one/two cards) */
  .one-merch-card.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .one-merch-card:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards.mini-compare-chart-mweb merch-card[variant="mini-compare-chart-mweb"],
  .two-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) merch-card[variant="mini-compare-chart-mweb"] {
    max-width: var(--consonant-merch-card-mini-compare-chart-mweb-wide-width);
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.mini-compare-chart-mweb,
  .four-merch-cards:has(merch-card[variant="mini-compare-chart-mweb"]) {
    grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-mweb-width));
  }
}

merch-card[variant="mini-compare-chart-mweb"] div[slot="footer-rows"]  {
  height: 100%;
  min-height: var(--consonant-merch-card-mini-compare-chart-mweb-footer-rows-height);
}

merch-card .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;

// src/variants/mini-compare-chart-mweb.js
var FOOTER_ROW_MIN_HEIGHT = 32;
var MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "subtitle" },
  prices: { tag: "p", slot: "heading-m-price" },
  promoText: { tag: "div", slot: "promo-text" },
  shortDescription: { tag: "div", slot: "body-m" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  secureLabel: true,
  planType: true,
  badgeIcon: true,
  badge: { tag: "div", slot: "badge", default: "spectrum-yellow-300-plans" },
  allowedBadgeColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-gray-700-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  size: ["wide", "super-wide"],
  ctas: { slot: "footer", size: "l" },
  footerRows: { tag: "div", slot: "footer-rows" },
  style: "consonant"
};
var MiniCompareChartMweb = class extends VariantLayout {
  constructor(card) {
    super(card);
    __publicField(this, "getRowMinHeightPropertyName", (index) => `--consonant-merch-card-footer-row-${index}-min-height`);
    __publicField(this, "getMiniCompareFooter", () => {
      return html5` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`;
    });
    __publicField(this, "getMiniCompareFooterRows", () => {
      return html5` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`;
    });
    this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
  }
  connectedCallbackHook() {
    this.card.addEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
  }
  disconnectedCallbackHook() {
    this.card.removeEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
    this._syncObserver?.disconnect();
    this._syncObserver = null;
  }
  updatePriceQuantity({ detail }) {
    if (!this.mainPrice || !detail?.option) return;
    this.mainPrice.dataset.quantity = detail.option;
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
      options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
      return;
    }
    if (element.dataset.template === "strikethrough" || element.dataset.template === "price") {
      options.displayPerUnit = false;
    }
  }
  getGlobalCSS() {
    return CSS4;
  }
  adjustMiniCompareBodySlots() {
    if (this.card.getBoundingClientRect().width <= 2) {
      if (!this._syncObserver) {
        this._syncObserver = new ResizeObserver(() => {
          if (this.card.getBoundingClientRect().width > 2) {
            this._syncObserver?.disconnect();
            this._syncObserver = null;
            this.adjustMiniCompareBodySlots();
            this.adjustMiniCompareFooterRows();
          }
        });
        this._syncObserver.observe(this.card);
      }
      return;
    }
    let slots = [
      "heading-xs",
      "subtitle",
      "heading-m-price",
      "promo-text",
      "body-m",
      "body-xs",
      "footer-rows"
    ];
    slots.forEach((slot) => {
      const lightEl = this.card.querySelector(`[slot="${slot}"]`);
      const el = lightEl ?? this.card.shadowRoot.querySelector(`slot[name="${slot}"]`);
      this.updateCardElementMinHeight(el, slot);
    });
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector('slot[name="promo-text"]'),
      "promo-text"
    );
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector("footer"),
      "footer"
    );
  }
  adjustMiniCompareFooterRows() {
    if (this.card.getBoundingClientRect().width === 0) return;
    const footerRows = this.card.querySelector('[slot="footer-rows"] ul');
    if (!footerRows || !footerRows.children) return;
    [...footerRows.children].forEach((el, index) => {
      const height = Math.max(
        FOOTER_ROW_MIN_HEIGHT,
        parseFloat(window.getComputedStyle(el).height) || 0
      );
      const maxMinHeight = parseFloat(
        this.getContainer().style.getPropertyValue(
          this.getRowMinHeightPropertyName(index + 1)
        )
      ) || 0;
      if (height > maxMinHeight) {
        this.getContainer().style.setProperty(
          this.getRowMinHeightPropertyName(index + 1),
          `${height}px`
        );
      }
    });
  }
  removeEmptyRows() {
    const footerRows = this.card.querySelectorAll(".footer-row-cell");
    footerRows.forEach((row) => {
      const rowDescription = row.querySelector(
        ".footer-row-cell-description"
      );
      if (rowDescription) {
        const isEmpty = !rowDescription.textContent.trim();
        if (isEmpty) {
          row.remove();
        }
      }
    });
  }
  setupToggle() {
    if (this.toggleSetupDone) return;
    const bodyXs = this.card.querySelector('[slot="body-xs"]');
    if (!bodyXs) return;
    const titleEl = bodyXs.querySelector("p");
    const listEl = bodyXs.querySelector("ul");
    if (!titleEl || !listEl) return;
    if (bodyXs.querySelector(".footer-rows-title")) return;
    this.toggleSetupDone = true;
    const titleText = titleEl.textContent.trim();
    const cardHeading = this.card.querySelector("h3")?.id;
    const listId = cardHeading ? `${cardHeading}-list` : `mweb-list-${Date.now()}`;
    listEl.setAttribute("id", listId);
    listEl.classList.add("checkmark-copy-container");
    const titleDiv = createTag(
      "div",
      { class: "footer-rows-title" },
      titleText
    );
    if (media_default.isMobile) {
      const toggleBtn = createTag("button", {
        class: "toggle-icon",
        "aria-label": titleText,
        "aria-expanded": "false",
        "aria-controls": listId
      });
      titleDiv.appendChild(toggleBtn);
      titleDiv.addEventListener("click", () => {
        const isOpen = listEl.classList.toggle("open");
        toggleBtn.classList.toggle("expanded", isOpen);
        toggleBtn.setAttribute("aria-expanded", String(isOpen));
      });
    } else {
      listEl.classList.add("open");
    }
    titleEl.replaceWith(titleDiv);
  }
  get mainPrice() {
    return this.card.querySelector(
      `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const headingPrice = this.mainPrice;
      if (!headingPrice) return;
      const legal = headingPrice.cloneNode(true);
      await headingPrice.onceSettled();
      if (!headingPrice?.options) return;
      if (headingPrice.options.displayPerUnit)
        headingPrice.dataset.displayPerUnit = "false";
      if (headingPrice.options.displayTax)
        headingPrice.dataset.displayTax = "false";
      if (headingPrice.options.displayPlanType)
        headingPrice.dataset.displayPlanType = "false";
      legal.setAttribute("data-template", "legal");
      headingPrice.parentNode.insertBefore(
        legal,
        headingPrice.nextSibling
      );
      await legal.onceSettled();
    } catch {
    }
  }
  get icons() {
    if (!this.card.querySelector('[slot="icons"]') && !this.card.getAttribute("id"))
      return nothing;
    return html5`<slot name="icons"></slot>`;
  }
  renderLayout() {
    return html5`
            ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="badge"></slot>
                <slot name="heading-xs"></slot>
                <slot name="subtitle"></slot>
                <slot name="heading-m-price"></slot>
                <slot name="body-m"></slot>
                <slot name="promo-text"></slot>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `;
  }
  async postCardUpdateHook() {
    await Promise.all(this.card.prices.map((price) => price.onceSettled()));
    if (!this.legalAdjusted) {
      await this.adjustLegal();
    }
    this.setupToggle();
    if (media_default.isMobile) {
      this.removeEmptyRows();
    } else {
      this.adjustMiniCompareFooterRows();
      const container = this.getContainer();
      if (!container) return;
      requestAnimationFrame(() => {
        const cards = container.querySelectorAll(
          'merch-card[variant="mini-compare-chart-mweb"]'
        );
        cards.forEach((card) => {
          card.variantLayout?.adjustMiniCompareBodySlots?.();
          card.variantLayout?.adjustMiniCompareFooterRows?.();
        });
      });
    }
  }
};
__publicField(MiniCompareChartMweb, "variantStyle", css4`
        :host([variant='mini-compare-chart-mweb']) .body > slot {
            display: block;
        }

        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart-mweb'])
            .mini-compare-chart-mweb-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart-mweb']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-footer-height
            );
            padding: 0;
            align-items: start;
            flex-flow: column nowrap;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart-mweb']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-mweb-top-section-height
            );
        }

        :host([variant='mini-compare-chart-mweb'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart-mweb'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
            :host([variant='mini-compare-chart-mweb']) footer {
                padding: 0;
            }
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        /* Use ::slotted() to target light DOM elements — shadow slots have display:contents so min-height is ignored on them */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-m']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-m-price']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='body-xxs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='price-commitment']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='offers']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-offers-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='promo-text']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='callout-content']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-callout-content-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='heading-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='subtitle']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='body-xs']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) ::slotted([slot='addon']) {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-addon-height
            );
        }
        /* Shadow DOM slot min-heights — ensures empty slots reserve space for cross-card alignment */
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-xs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart-mweb'])
            .body
            > slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
            );
        }
        :host([variant='mini-compare-chart-mweb']) .body > slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-mweb-body-m-height
            );
        }

        :host([variant='mini-compare-chart-mweb']) slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-yellow-300-plans']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-gray-300-plans']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-green-900-plans']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='spectrum-red-700-plans']
        ) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart-mweb'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='mini-compare-chart-mweb'])
            #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart-mweb']) .footer-rows-container {
            background-color: #f8f8f8;
            border-radius: 0 0 var(--consonant-merch-spacing-xxs)
                var(--consonant-merch-spacing-xxs);
        }

        :host([variant='mini-compare-chart-mweb']) .action-area {
            display: flex;
            justify-content: start;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }
    `);

// src/variants/plans.js
import { html as html6, css as css5, nothing as nothing2 } from "./lit-all.min.js";

// src/variants/plans.css.js
var CSS5 = `
:root {
    --consonant-merch-card-plans-width: 302px;
    --consonant-merch-card-plans-students-width: 302px;
    --consonant-merch-card-plans-icon-size: 40px;
}

merch-card[variant^="plans"] {
    --merch-card-plans-heading-xs-min-height: 23px;
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-plans-width);
}

merch-card[variant^="plans"] merch-badge {
    max-width: calc(var(--consonant-merch-card-plans-width) * var(--merch-badge-card-size) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
}

merch-card[variant="plans-students"] {
    width: var(--consonant-merch-card-plans-students-width);
}

merch-card[variant^="plans"][size="wide"], merch-card[variant^="plans"][size="super-wide"] {
    width: auto;
}

merch-card[variant^="plans"] [slot="icons"] {
    --img-width: 41.5px;
}

merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-legal) {
    display: inline-block;
    font-size: var(--consonant-merch-card-heading-xs-font-size);
    font-weight: 700;
}

merch-card[variant="plans"] [slot="subtitle"] {
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
}

merch-card[variant^="plans"] span.price-unit-type {
    display: block;
}

merch-card[variant^="plans"] .price-unit-type:not(.disabled)::before {
    content: "";
}
merch-card[variant^="plans"] [slot="callout-content"] span.price-unit-type,
merch-card[variant^="plans"] [slot="addon"] span.price-unit-type,
merch-card[variant^="plans"] .price.price-strikethrough span.price-unit-type,
merch-card[variant^="plans"] .price.price-promo-strikethrough span.price-unit-type,
merch-card[variant^="plans"] span.price-unit-type.disabled {
  display: inline;
}

merch-card[variant^="plans"] [slot="heading-xs"] span.price.price-strikethrough,
merch-card[variant^="plans"] [slot="heading-xs"] span.price.price-promo-strikethrough,
merch-card[variant^="plans"] [slot="heading-m"] span.price.price-strikethrough,
merch-card[variant^="plans"] [slot="heading-m"] span.price.price-promo-strikethrough,
merch-card[variant="plans-education"] [slot="body-xs"] span.price.price-strikethrough,
merch-card[variant="plans-education"] [slot="body-xs"] span.price.price-promo-strikethrough {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 700;
}

merch-card[variant^="plans"] [slot="heading-m"] p {
    font-size: var(--consonant-merch-card-heading-xxxs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
}

merch-card[variant^="plans"] [slot="heading-m"] span.price:not(.price-strikethrough):not(.price-promo-strikethrough):not(.price-legal) {
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
}

merch-card[variant^="plans"] [slot='heading-xs'],
merch-card[variant="plans-education"] span.heading-xs,
merch-card[variant="plans-education"] [slot="body-xs"] span.price:not(.price-strikethrough):not(.price-promo-strikethrough) {
    min-height: var(--merch-card-plans-heading-xs-min-height);
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(.heading-xs) {
    margin-bottom: 16x;
}

merch-card[variant="plans-education"] [slot="body-xs"] p:has(span[is="inline-price"]) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] span.text-l {
    display: block;
    font-size: 18px;
    line-height: 23px;
}

merch-card[variant="plans-education"] span.promo-text {
    margin-bottom: 8px;
}

merch-card[variant="plans-education"] p:has(a[href^='tel:']):has(+ p, + div) {
    margin-bottom: 16px;
}

merch-card[variant^="plans"] [slot="promo-text"],
merch-card[variant="plans-education"] span.promo-text {
    line-height: var(--consonant-merch-card-body-xs-line-height);
}

merch-card[variant="plans-education"] [slot="body-xs"] {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

merch-card[variant="plans-education"] .spacer {
    height: calc(var(--merch-card-plans-edu-list-max-offset) - var(--merch-card-plans-edu-list-offset));
}

merch-card[variant="plans-education"] ul + p {
    margin-top: 16px;
}

merch-card-collection.plans merch-card {
    width: auto;
    height: 100%;
}

merch-card-collection.plans merch-card[variant="plans"] aem-fragment + [slot^="heading-"] {
    margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
}

merch-card[variant^='plans'] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant^='plans'] span.price-legal::first-letter {
    text-transform: uppercase;
}

merch-card[variant^='plans'] span.price-legal .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant^="plans"] [slot="description"] {
    min-height: 84px;
}

merch-card[variant^="plans"] [slot="body-xs"] a {
    color: var(--link-color);
    display: inline-block;
    padding: 2px 0;
}

merch-card[variant^="plans"] [slot="promo-text"] a {
    color: inherit;
}

merch-card[variant^="plans"] [slot="callout-content"] {
    margin: 8px 0 0;
}

merch-card[variant^="plans"][size="super-wide"] [slot="callout-content"] {
    margin: 0;
}

merch-card[variant^="plans"] [slot='callout-content'] > div > div,
merch-card[variant^="plans"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
}

merch-card[variant^="plans"] [slot="callout-content"] > p:has(> .icon-button) {
    padding-inline-end: 36px;
}

merch-card[variant^="plans"] [slot='callout-content'] > p,
merch-card[variant^="plans"] [slot='callout-content'] > div > div > div {
    color: #000;
}

merch-card[variant^="plans"] [slot="callout-content"] img,
merch-card[variant^="plans"] [slot="callout-content"] .icon-button {
    margin: 1.5px 0 1.5px 8px;
}

merch-card[variant^="plans"] [slot="whats-included"] [slot="description"] {
  min-height: auto;
}

merch-card[variant^="plans"] [slot="quantity-select"] {
    margin-top: auto;
    padding-top: 8px;
}

merch-card[variant^="plans"]:has([slot="quantity-select"]) merch-addon {
    margin: 0;
}

merch-card[variant^="plans"] merch-addon {
    --merch-addon-gap: 10px;
    --merch-addon-align: center;
    --merch-addon-checkbox-size: 12px;
    --merch-addon-checkbox-border: 2px solid rgb(109, 109, 109);
    --merch-addon-checkbox-radius: 2px;
    --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
    --merch-addon-checkbox-checked-color: var(--color-accent);
    --merch-addon-label-size: 12px;
    --merch-addon-label-color: rgb(34, 34, 34);
    --merch-addon-label-line-height: normal;
}

merch-card[variant^="plans"] [slot="footer"] a {
    line-height: 19px;
    padding: 3px 16px 4px;
}

merch-card[variant^="plans"] [slot="footer"] .con-button > span {
    min-width: unset;
}

merch-card[variant^="plans"] merch-addon span[data-template="price"] {
    display: none;
}

merch-card[variant^="plans"]:not([size]) {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

.collection-container.plans {
    --merch-card-collection-card-min-height: 273px;
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-sidenav.plans {
    --merch-sidenav-padding: 16px 20px 16px 16px;
}

merch-card-collection-header.plans {
    --merch-card-collection-header-columns: 1fr fit-content(100%);
    --merch-card-collection-header-areas: "result filter";
}

.one-merch-card.plans,
.two-merch-cards.plans,
.three-merch-cards.plans,
.four-merch-cards.plans {
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-width);
}

merch-card-collection:has([slot="subtitle"]) merch-card {
    --merch-card-plans-subtitle-display: block;
}

.columns .text .foreground {
    margin: 0;
}

.columns.checkmark-list ul {
    margin: 0;
    padding-inline-start: 20px;
    list-style-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 18 18" height="18px"><path fill="currentcolor" d="M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z"></path></svg>');
}

.columns.checkmark-list ul li {
    padding-inline-start: 8px;
}

/* Tabs containers */

#tabs-plan {
    --tabs-active-text-color: #131313;
    --tabs-border-color: #444444;
}
#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"] {
    border-top-color: #EAEAEA;
    border-right-color: #EAEAEA;
}

#tabs-plan .tab-list-container button[role="tab"][aria-selected="false"]:first-of-type {
    border-left-color: #EAEAEA;
}

.plans-team {
    display: grid;
    grid-template-columns: min-content;
    justify-content: center;
}

.plans-team .columns .row-1 {
    grid-template-columns: repeat(2, calc(var(--consonant-merch-card-plans-width) * 2 + 32px));
    justify-content: center;
}

.plans-team .col-2 {
    align-content: center;
}

.plans-team .col-2 h3 {
    font-size: 20px;
    margin: 0 0 16px;
}

.plans-highlight .columns :is(.col-1, .col-2) :is(h1, h2, h3, h4, h5):first-child {
	background: rgb(238, 238, 238);
	padding: var(--spacing-m);
	font-size: var(--type-heading-s-size);
    line-height: var(--type-heading-s-lh);
}

.plans-team .col-2 p {
    margin: 0 0 16px;
}

.plans-team .text .foreground,
.plans-edu .text .foreground {
    max-width: unset;
    margin: 0;
}

.plans-edu .columns .row {
    grid-template-columns: repeat(auto-fit, var(--consonant-merch-card-plans-students-width));
    justify-content: center;
    align-items: center;
}

.plans-edu .columns .row-1 {
    grid-template-columns: var(--consonant-merch-card-plans-students-width);
    margin-block: var(--spacing-xs);
}

.plans-edu .columns .row-2 {
    margin-bottom: 40px;
}

.plans-edu .columns .row-3 {
    margin-bottom: 48px;
}

.plans-edu .col-2 h3 {
    margin: 0 0 16px;
    font-size: 20px;
}

.plans-individual .content,
.plans-team .content,
.plans-edu-inst .content {
    padding-bottom: 48px;
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }

    merch-card[variant="plans-education"] .spacer {
        height: 0px;
    }

    merch-card[variant^="plans"] merch-badge {
        max-width: calc(var(--consonant-merch-card-plans-width) - var(--merch-badge-with-offset) * 40px - var(--merch-badge-offset) * 48px);
    }
}

/* Tablet */
@media screen and ${TABLET_UP} {
    :root {
        --consonant-merch-card-plans-students-width: 486px;
    }

    .four-merch-cards.plans .foreground {
        max-width: unset;
    }
}

@media screen and ${TABLET_DOWN} {
    .plans-team .columns .row-1 {
        grid-template-columns: min-content;
    }

    .plans-edu-inst {
        display: grid;
        grid-template-columns: min-content;
        justify-content: center;
    }

    .plans-edu-inst .text .foreground {
        max-width: unset;
        margin: 0;
    }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
    :root {
        --consonant-merch-card-plans-width: 276px;
        --consonant-merch-card-plans-students-width: 484px;
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 30px;
    }

    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: fit-content(100%);
        --merch-card-collection-header-areas: "custom";
    }

    .collection-container.plans:has(merch-sidenav) {
        --translate-direction: -1;
        width: fit-content;
        position: relative;
        inset-inline-start: 50%;
        translate: calc(var(--translate-direction) * 50vw) 0;
        justify-content: start;
        padding-inline: 30px;
    }

    [dir="rtl"] .collection-container.plans:has(merch-sidenav) {
        --translate-direction: 1;
    }

    .plans-individual .content {
        padding-top: 24px;
    }

    .plans-edu .columns .row-1 {
        grid-template-columns: calc(var(--consonant-merch-card-plans-students-width) * 2 + var(--spacing-m));
    }

    .plans-edu-inst .text .foreground {
        max-width: 1200px;
        margin: auto;
    }
}

/* Large desktop */
@media screen and ${LARGE_DESKTOP} {
    .columns .four-merch-cards.plans {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-width));
    }

    merch-sidenav.plans {
        --merch-sidenav-collection-gap: 54px;
    }
}
`;

// src/variants/plans.js
var PLANS_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "subtitle" },
  prices: { tag: "p", slot: "heading-m" },
  promoText: { tag: "p", slot: "promo-text" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  callout: { tag: "div", slot: "callout-content" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  addon: true,
  secureLabel: true,
  planType: true,
  badgeIcon: true,
  badge: { tag: "div", slot: "badge", default: "spectrum-yellow-300-plans" },
  allowedBadgeColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-gray-700-plans",
    "spectrum-green-900-plans",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-green-900-plans",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  size: ["wide", "super-wide"],
  whatsIncluded: { tag: "div", slot: "whats-included" },
  ctas: { slot: "footer", size: "m" },
  style: "consonant",
  perUnitLabel: { tag: "span", slot: "per-unit-label" }
};
var PLANS_EDUCATION_AEM_FRAGMENT_MAPPING = {
  ...function() {
    const { whatsIncluded, size, ...rest } = PLANS_AEM_FRAGMENT_MAPPING;
    return rest;
  }(),
  title: { tag: "h3", slot: "heading-s" },
  secureLabel: false
};
var PLANS_STUDENTS_AEM_FRAGMENT_MAPPING = {
  ...function() {
    const { subtitle, whatsIncluded, size, quantitySelect, ...rest } = PLANS_AEM_FRAGMENT_MAPPING;
    return rest;
  }()
};
var Plans = class extends VariantLayout {
  constructor(card) {
    super(card);
    this.adaptForMedia = this.adaptForMedia.bind(this);
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
    options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
  }
  getGlobalCSS() {
    return CSS5;
  }
  /**
   * Moves a slot to its proper place (body or footer) depending on card size and screen size
   * @param {string} name
   * @param {string[]} sizes
   * @param {boolean} shouldBeInFooter
   * @returns
   */
  adjustSlotPlacement(name, sizes, shouldBeInFooter) {
    const shadowRoot = this.card.shadowRoot;
    const footer = shadowRoot.querySelector("footer");
    const size = this.card.getAttribute("size");
    if (!size) return;
    const slotInFooter = shadowRoot.querySelector(
      `footer slot[name="${name}"]`
    );
    const slotInBody = shadowRoot.querySelector(
      `.body slot[name="${name}"]`
    );
    const body = shadowRoot.querySelector(".body");
    if (!size.includes("wide")) {
      footer?.classList.remove("wide-footer");
      if (slotInFooter) slotInFooter.remove();
    }
    if (!sizes.includes(size)) return;
    footer?.classList.toggle("wide-footer", media_default.isDesktopOrUp);
    if (!shouldBeInFooter && slotInFooter) {
      if (slotInBody) slotInFooter.remove();
      else {
        const bodyPlaceholder = body.querySelector(
          `[data-placeholder-for="${name}"]`
        );
        if (bodyPlaceholder) bodyPlaceholder.replaceWith(slotInFooter);
        else body.appendChild(slotInFooter);
      }
      return;
    }
    if (shouldBeInFooter && slotInBody) {
      const bodyPlaceholder = document.createElement("div");
      bodyPlaceholder.setAttribute("data-placeholder-for", name);
      bodyPlaceholder.classList.add("slot-placeholder");
      if (!slotInFooter) {
        const slotInBodyClone = slotInBody.cloneNode(true);
        footer.prepend(slotInBodyClone);
      }
      slotInBody.replaceWith(bodyPlaceholder);
    }
  }
  adaptForMedia() {
    if (!this.card.closest(
      "merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns"
    )) {
      this.card.removeAttribute("size");
      return;
    }
    this.adjustSlotPlacement("addon", ["super-wide"], media_default.isDesktopOrUp);
    this.adjustSlotPlacement(
      "callout-content",
      ["super-wide"],
      media_default.isDesktopOrUp
    );
  }
  adjustCallout() {
    const tooltipIcon = this.card.querySelector(
      '[slot="callout-content"] .icon-button'
    );
    if (tooltipIcon && tooltipIcon.title) {
      tooltipIcon.dataset.tooltip = tooltipIcon.title;
      tooltipIcon.removeAttribute("title");
      tooltipIcon.classList.add("hide-tooltip");
      document.addEventListener("touchstart", (event) => {
        event.preventDefault();
        if (event.target !== tooltipIcon) {
          tooltipIcon.classList.add("hide-tooltip");
        } else {
          event.target.classList.toggle("hide-tooltip");
        }
      });
      document.addEventListener("mouseover", (event) => {
        event.preventDefault();
        if (event.target !== tooltipIcon) {
          tooltipIcon.classList.add("hide-tooltip");
        } else {
          event.target.classList.remove("hide-tooltip");
        }
      });
    }
  }
  async adjustEduLists() {
    if (this.card.variant !== "plans-education") return;
    const existingSpacer = this.card.querySelector(".spacer");
    if (existingSpacer) return;
    const body = this.card.querySelector('[slot="body-xs"]');
    if (!body) return;
    const list = body.querySelector("ul");
    if (!list) return;
    const listHeader = list.previousElementSibling;
    const spacer = document.createElement("div");
    spacer.classList.add("spacer");
    body.insertBefore(spacer, listHeader);
    const intersectionObs = new IntersectionObserver(([entry]) => {
      if (entry.boundingClientRect.height === 0) return;
      let offset = 0;
      const heading = this.card.querySelector('[slot="heading-s"]');
      if (heading) offset += getOuterHeight(heading);
      const subtitle = this.card.querySelector('[slot="subtitle"]');
      if (subtitle) offset += getOuterHeight(subtitle);
      const price = this.card.querySelector('[slot="heading-m"]');
      if (price) offset += 8 + getOuterHeight(price);
      for (const child of body.childNodes) {
        if (child.classList.contains("spacer")) break;
        offset += getOuterHeight(child);
      }
      const maxOffset = this.card.parentElement.style.getPropertyValue(
        "--merch-card-plans-edu-list-max-offset"
      );
      if (offset > (parseFloat(maxOffset) || 0)) {
        this.card.parentElement.style.setProperty(
          "--merch-card-plans-edu-list-max-offset",
          `${offset}px`
        );
      }
      this.card.style.setProperty(
        "--merch-card-plans-edu-list-offset",
        `${offset}px`
      );
      intersectionObs.disconnect();
    });
    intersectionObs.observe(this.card);
  }
  async postCardUpdateHook() {
    this.adaptForMedia();
    this.adjustAddon();
    this.adjustCallout();
    if (!this.legalAdjusted) {
      await this.adjustLegal();
      await this.adjustEduLists();
    }
  }
  get headingM() {
    return this.card.querySelector('[slot="heading-m"]');
  }
  get mainPrice() {
    const price = this.headingM.querySelector(
      `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price;
  }
  get divider() {
    return this.card.variant === "plans-education" ? html6`<div class="divider"></div>` : nothing2;
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const prices = [];
      const headingPrice = this.card.querySelector(
        `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
      );
      if (headingPrice) prices.push(headingPrice);
      const legalPromises = prices.map(async (price) => {
        const legal = price.cloneNode(true);
        await price.onceSettled();
        if (!price?.options) return;
        if (price.options.displayPerUnit)
          price.dataset.displayPerUnit = "false";
        if (price.options.displayTax)
          price.dataset.displayTax = "false";
        if (price.options.displayPlanType)
          price.dataset.displayPlanType = "false";
        legal.setAttribute("data-template", "legal");
        price.parentNode.insertBefore(legal, price.nextSibling);
        await legal.onceSettled();
      });
      await Promise.all(legalPromises);
    } catch {
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    addon.setAttribute("custom-checkbox", "");
    const price = this.mainPrice;
    if (!price) return;
    await price.onceSettled();
    const planType = price.value?.[0]?.planType;
    if (!planType) return;
    addon.planType = planType;
  }
  get stockCheckbox() {
    return this.card.checkboxLabel ? html6`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>` : nothing2;
  }
  get icons() {
    if (!this.card.querySelector('[slot="icons"]') && !this.card.getAttribute("id"))
      return nothing2;
    return html6`<slot name="icons"></slot>`;
  }
  connectedCallbackHook() {
    media_default.matchMobile.addEventListener("change", this.adaptForMedia);
    media_default.matchDesktopOrUp.addEventListener("change", this.adaptForMedia);
  }
  disconnectedCallbackHook() {
    media_default.matchMobile.removeEventListener("change", this.adaptForMedia);
    media_default.matchDesktopOrUp.removeEventListener(
      "change",
      this.adaptForMedia
    );
  }
  renderLayout() {
    return html6` ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="heading-xs"></slot>
                <slot name="heading-s"></slot>
                <slot name="subtitle"></slot>
                ${this.divider}
                <slot name="heading-m"></slot>
                <slot name="annualPrice"></slot>
                <slot name="priceLabel"></slot>
                <slot name="body-xxs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                ${this.stockCheckbox}
                <slot name="addon"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
  }
};
__publicField(Plans, "variantStyle", css5`
        :host([variant^='plans']) {
            min-height: 273px;
            --merch-card-plans-min-width: 244px;
            --merch-card-plans-padding: 15px;
            --merch-card-plans-subtitle-display: contents;
            --merch-card-plans-heading-min-height: 23px;
            --merch-color-green-promo: #05834e;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
            font-weight: 400;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant^='plans']) .slot-placeholder {
            display: none;
        }

        :host([variant='plans-education']) {
            min-height: unset;
        }

        :host([variant='plans-education']) ::slotted([slot='subtitle']) {
            font-size: var(--consonant-merch-card-heading-xxxs-font-size);
            line-height: var(--consonant-merch-card-heading-xxxs-line-height);
            font-style: italic;
            font-weight: 400;
        }

        :host([variant='plans-education']) .divider {
            border: 0;
            border-top: 1px solid #e8e8e8;
            margin-top: 8px;
            margin-bottom: 8px;
        }

        :host([variant='plans']) slot[name='subtitle'] {
            display: var(--merch-card-plans-subtitle-display);
            min-height: 18px;
            margin-top: 8px;
            margin-bottom: -8px;
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            min-height: var(--merch-card-plans-heading-min-height);
        }

        :host([variant^='plans']) .body {
            min-width: var(--merch-card-plans-min-width);
            padding: var(--merch-card-plans-padding);
        }

        :host([variant='plans'][size]) .body {
            max-width: none;
        }

        :host([variant^='plans']) ::slotted([slot='addon']) {
            margin-top: auto;
            padding-top: 8px;
        }

        :host([variant^='plans']) footer ::slotted([slot='addon']) {
            margin: 0;
            padding: 0;
        }

        :host([variant='plans']) .wide-footer #stock-checkbox {
            margin-top: 0;
        }

        :host([variant='plans']) #stock-checkbox {
            margin-top: 8px;
            gap: 9px;
            color: rgb(34, 34, 34);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
            padding-top: 4px;
            padding-bottom: 5px;
        }

        :host([variant='plans']) #stock-checkbox > span {
            border: 2px solid rgb(109, 109, 109);
            width: 12px;
            height: 12px;
        }

        :host([variant^='plans']) footer {
            padding: var(--merch-card-plans-padding);
            padding-top: 1px;
        }

        :host([variant='plans']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }

        :host([variant='plans']) ::slotted([slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans']) #badge {
            border-radius: 4px 0 0 4px;
            font-weight: 400;
            line-height: 21px;
            padding: 2px 10px 3px;
        }
    `);
__publicField(Plans, "collectionOptions", {
  customHeaderArea: (collection) => {
    if (!collection.sidenav) return nothing2;
    return html6`<slot name="resultsText"></slot>`;
  },
  headerVisibility: {
    search: false,
    sort: false,
    result: ["mobile", "tablet"],
    custom: ["desktop"]
  },
  onSidenavAttached: (collection) => {
    const minifyOverflowingWideCards = () => {
      const merchCards = collection.querySelectorAll("merch-card");
      for (const merchCard of merchCards) {
        if (merchCard.hasAttribute("data-size")) {
          merchCard.setAttribute(
            "size",
            merchCard.getAttribute("data-size")
          );
          merchCard.removeAttribute("data-size");
        }
      }
      if (!media_default.isDesktop) return;
      let columns = 0;
      for (const merchCard of merchCards) {
        if (merchCard.style.display === "none") continue;
        const size = merchCard.getAttribute("size");
        let columnCount = size === "wide" ? 2 : size === "super-wide" ? 3 : 1;
        if (columnCount === 2 && columns % 3 === 2) {
          merchCard.setAttribute("data-size", size);
          merchCard.removeAttribute("size");
          columnCount = 1;
        }
        columns += columnCount;
      }
    };
    media_default.matchDesktop.addEventListener(
      "change",
      minifyOverflowingWideCards
    );
    collection.addEventListener(
      EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
      minifyOverflowingWideCards
    );
    collection.onUnmount.push(() => {
      media_default.matchDesktop.removeEventListener(
        "change",
        minifyOverflowingWideCards
      );
      collection.removeEventListener(
        EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
        minifyOverflowingWideCards
      );
    });
  }
});

// src/variants/plans-v2.js
import { html as html7, css as css6, unsafeCSS as unsafeCSS2, nothing as nothing3 } from "./lit-all.min.js";

// src/variants/plans-v2.css.js
var CSS6 = `
:root {
    --consonant-merch-card-plans-v2-font-family-regular: 'Adobe Clean', 'adobe-clean', sans-serif;
    --consonant-merch-card-plans-v2-font-family: 'Adobe Clean Display', 'adobe-clean-display', 'Adobe Clean', 'adobe-clean', sans-serif;
    --consonant-merch-card-plans-v2-width: 276px;
    --consonant-merch-card-plans-v2-height: auto;
    --consonant-merch-card-plans-v2-icon-size: 41.5px;
    --consonant-merch-card-plans-v2-border-color: #E9E9E9;
    --consonant-merch-card-plans-v2-border-radius: 16px;
    --picker-up-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 3L8 6L2 6Z" fill="%222222"/></svg>');
    --picker-down-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 7L2 4L8 4Z" fill="%222222"/></svg>');
    --consonant-merch-spacing-m: 20px;
    --consonant-merch-card-plans-v2-toggle-background-color: #F8F8F8;
    --consonant-merch-card-plans-v2-toggle-label-color: #292929;
    --consonant-merch-card-plans-v2-divider-color: #E8E8E8;
    --consonant-merch-card-plans-v2-toggle-expanded-background-color: #FFFFFF;
}

merch-card[variant="plans-v2"] {
    width: var(--consonant-merch-card-plans-v2-width);
    height: var(--consonant-merch-card-plans-v2-height);
    border-radius: var(--consonant-merch-card-plans-v2-border-radius);
    background-color: var(--spectrum-gray-50, #FFFFFF);
    overflow: visible;
    position: relative;
    z-index: 1;
    background: linear-gradient(var(--spectrum-gray-50, #FFFFFF), var(--spectrum-gray-50, #FFFFFF)) padding-box, var(--consonant-merch-card-border-color, var(--consonant-merch-card-plans-v2-border-color)) border-box;
    border: 1px solid transparent;
}

merch-card[variant="plans-v2"]:has(merch-quantity-select:not([closed])) {
    z-index: 100;
}

merch-card[variant="plans-v2"] .spacer {
    height: calc(var(--merch-card-plans-v2-max-offset) - var(--merch-card-plans-v2-offset));
}

.dark merch-card[variant="plans-v2"] {
    --consonant-merch-card-background-color: rgb(20, 24, 38);
    --consonant-merch-card-border-color: #3D3D3D;
    --spectrum-gray-800: rgb(242, 242, 242);
    --spectrum-gray-700: rgb(219, 219, 219);
    background-color: var(--consonant-merch-card-background-color);
}

/* Keep "What you get" section white in dark mode */
.dark merch-card[variant="plans-v2"] merch-whats-included {
    background-color: #FFFFFF;
}

.dark merch-card[variant="plans-v2"] [slot="body-xs"] .spectrum-Link.spectrum-Link--primary {
    color: #FFFFFF;
}

.dark merch-card[variant="plans-v2"] merch-whats-included h4,
.dark merch-card[variant="plans-v2"] merch-whats-included ul li {
    color: #292929;
}
.dark merch-card[variant="plans-v2"] [slot="body-xs"] {
    color: #C6C6C6;
}
.dark merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select {
  --label-color: #C6C6C6 ;
}

/* Dark mode heading colors for wide cards */
.dark merch-card[variant="plans-v2"][size="wide"] [slot^="heading-"],
.dark merch-card[variant="plans-v2"][size="wide"] span[class^="heading-"],
.dark merch-card[variant="plans-v2"] span.price-unit-type,
.dark merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence  {
    color: #B6B6B6;
}

.dark merch-card[variant="plans-v2"] [slot="heading-m"] span.price.price-strikethrough,
.dark merch-card[variant="plans-v2"] [slot="heading-m"] s {
  color: #B6B6B6;
}

/* Dark mode strikethrough price size for wide cards */
.dark merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] span.price.price-strikethrough,
.dark merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] s {
    font-size: 20px;
}

.dark merch-card[variant="plans-v2"] {
  --consonant-merch-card-plans-v2-toggle-background-color: var(--consonant-merch-card-background-color);
  --consonant-merch-card-plans-v2-toggle-expanded-background-color: var(--consonant-merch-card-background-color);
  --consonant-merch-card-plans-v2-toggle-label-color: #FFFFFF;
  --consonant-merch-card-plans-v2-divider-color: var(--consonant-merch-card-background-color);
}
merch-card[variant="plans-v2"][size="wide"],
merch-card[variant="plans-v2"][size="super-wide"] {
    width: 100%;
    max-width: 768px;
}

merch-card[variant="plans-v2"] [slot="icons"] {
    --img-width: var(--consonant-merch-card-plans-v2-icon-size);
    --img-height: var(--consonant-merch-card-plans-v2-icon-size);
}
merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence,
merch-card[variant="plans-v2"] span.price-unit-type {
    color: #6B6B6B;
}

merch-card[variant="plans-v2"] span.price-unit-type {
    display: inline;
    font-size: 20px;
    font-weight: 900;
    line-height: 110%;
}

merch-card[variant="plans-v2"] .price-unit-type:not(.disabled)::before {
    content: '';
}

merch-card[variant="plans-v2"] .price-unit-type.disabled,
merch-card[variant="plans-v2"] .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-unit-type.disabled,
merch-card[variant="plans-v2"] [slot="heading-m"] .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] s .price-unit-type.disabled,
merch-card[variant="plans-v2"] s .price-tax-inclusivity.disabled,
merch-card[variant="plans-v2"] .price-strikethrough .price-unit-type.disabled,
merch-card[variant="plans-v2"] .price-strikethrough .price-tax-inclusivity.disabled {
    display: none;
}

merch-card[variant="plans-v2"] [slot="description"] {
    min-height: auto;
}

merch-card[variant="plans-v2"] [slot="description"] {
    min-height: auto;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] {}

merch-card[variant="plans-v2"] merch-addon {
    --merch-addon-gap: 10px;
    --merch-addon-align: flex-start;
}

merch-card[variant="plans-v2"] merch-addon span[data-template="price"] {
    display: inline;
}

merch-card[variant^="plans-v2"] span[data-template="legal"] {
    display: inline;
    color: var(--spectrum-gray-600, #6E6E6E);
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.375;
}

merch-card[variant="plans-v2"] span.text-l {
    display: inline;
    font-size: inherit;
    line-height: inherit;
}

merch-card[variant="plans-v2"] [slot="callout-content"] {
    margin: 0;
}

merch-card[variant="plans-v2"] [slot='callout-content'] > div > div,
merch-card[variant="plans-v2"] [slot="callout-content"] > p {
    background: transparent;
    padding: 0;
}

merch-card[variant="plans-v2"] [slot="footer"] a {
    line-height: 1.2;
    padding: 9px 18px 10px 18px;
}

merch-card[variant="plans-v2"] [slot="icons"] img {
    width: var(--consonant-merch-card-plans-v2-icon-size);
    height: var(--consonant-merch-card-plans-v2-icon-size);
}

merch-card[variant="plans-v2"] [slot="heading-xs"] {
    font-size: 28px;
    font-weight: 900;
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    line-height: 1.1;
    color: var(--spectrum-gray-800, #2C2C2C);
}

/* Mobile-specific heading-xs styles */
@media ${MOBILE_LANDSCAPE} {
    merch-card[variant="plans-v2"] [slot="heading-xs"] {
        font-size: 28px;
        font-weight: 800;
        line-height: 125%;
        letter-spacing: -0.02em;
        vertical-align: middle;
    }
    merch-card[variant="plans-v2"][size="wide"] [slot="heading-xs"] {
        font-size: 16px;
    }
}

/* Subtitle styling for regular cards */
merch-card[variant="plans-v2"] [slot="subtitle"] {
    font-size: 18px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-800, #2C2C2C);
    line-height: 23px;
}

/* Wide card override */
merch-card[variant="plans-v2"][size="wide"] [slot="subtitle"] {
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    font-size: 52px;
    font-weight: 900;
    line-height: 1.1;
}

merch-card[variant="plans-v2"] [slot="heading-m"] span.price, merch-card[variant="plans-v2"] [slot="heading-m"] p {
    font-size: 20px;
    font-weight: 900;
    font-family: var(--consonant-merch-card-plans-v2-font-family);
    color: var(--spectrum-gray-800, #2C2C2C);
    line-height: 1.1;
}

/* Mobile-specific wide card subtitle styles */
@media ${MOBILE_LANDSCAPE} {
    merch-card[variant="plans-v2"][size="wide"] [slot="subtitle"] {
        font-size: 28px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: 0px;
    }

    merch-card[variant="plans-v2"] span.price-unit-type,
    merch-card[variant="plans-v2"] [slot="heading-m"] span.price, merch-card[variant="plans-v2"] [slot="heading-m"] p {
        font-size: 28px;
    }
}

merch-card[variant="plans-v2"] [slot="heading-m"] {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    color: inherit;
}

merch-card[variant="plans-v2"] [slot="heading-m"] span.price.price-strikethrough,
merch-card[variant="plans-v2"] [slot="heading-m"] s {
    font-size: 20px;
    color: #6B6B6B;
    text-decoration: line-through;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    font-weight: 400;
}

merch-card[variant="plans-v2"] [slot="heading-m"]:has(span[is='inline-price'] + span[is='inline-price']) span[is='inline-price'] {
    display: inline;
    text-decoration: none;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-legal {
    font-size: 16px;
    font-weight: 400;
    color: var(--spectrum-gray-600, #6E6E6E);
    line-height: 1.375;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="recurrence"] {
    text-transform: lowercase;
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-recurrence:not(.disabled)::after,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="recurrence"]:not(.disabled)::after {
    content: ' ';
    white-space: pre;
}

merch-card[variant="plans-v2"] [slot="heading-m"] .price-plan-type,
merch-card[variant="plans-v2"] [slot="heading-m"] span[data-template="planType"] {
    text-transform: unset;
    display: block;
    color: var(--spectrum-gray-700, #505050);
    font-size: 16px;
    font-weight: 400;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="promo-text"] {
    font-size: 16px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--merch-color-green-promo, #05834E);
    line-height: 1.5;
    margin-bottom: 16px;
}

merch-card[variant="plans-v2"] [slot="promo-text"] a {
    color: inherit;
    text-decoration: underline;
}

merch-card[variant="plans-v2"] [slot="body-xs"] {
    --consonant-merch-card-body-xs-font-size: 18px;
    font-size: 18px;
    font-weight: 400;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-700, #505050);
    line-height: 1.4;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] {
    margin-bottom: 16px;
}

merch-card[variant="plans-v2"] [slot="quantity-select"] label {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: #464646;
    margin-bottom: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select {
    --qs-input-height: 32px;
    --qs-button-width: 18px;
    --qs-font-size: 14px;
    --border-color: #909090;
    --border-width: 1px;
    --background-color: #FDFDFD;
    --qs-label-font-size: 12px;
    --qs-label-color: #464646;
    --radius: 4px;
    --button-width: 29px;
    --qs-input-width: 59px;
    --picker-button-border-inline-start: none;
    --label-color: var(--spectrum-gray-700, #4B4B4B);
}

merch-card[variant="plans-v2"] [slot="quantity-select"] merch-quantity-select .item.highlighted {
    background-color: #F6F6F6;
}

merch-card[variant="plans-v2"] [slot="footer"] {}

merch-card[variant="plans-v2"] [slot="footer"] a {
    width: auto;
    min-width: fit-content;
    text-align: center;
    padding: 5px 18px 6px 18px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
}
    background-color: #3B63FB;
    color: #FFFFFF;
    border: 2px solid #3B63FB;
    border-radius: 20px;
    display: inline-flex;
    max-width: fit-content;
merch-card[variant="plans-v2"] [slot="footer"] a.con-button.blue {
    background-color: #1473E6;
    color: #FFFFFF;
    border: 2px solid #1473E6;
    border-radius: 20px;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.blue:hover {
    background-color: #0D66D0;
    border-color: #0D66D0;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.outline {
    background-color: transparent;
    color: #1473E6;
    border: 2px solid #1473E6;
}

merch-card[variant="plans-v2"] [slot="footer"] a.con-button.outline:hover {
    background-color: #F5F5F5;
}


merch-card[variant="plans-v2"] h4 {
    font-size: 18px;
    font-weight: 700;
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: var(--spectrum-gray-800, #292929);
    line-height: 22px;
    margin: 0 0 16px 0;
    align-self: flex-start;  /* Explicit alignment for consistent positioning */
}

/* Ensure merch-whats-included container is properly aligned */
merch-card[variant="plans-v2"] merch-whats-included {
    background-color: #FFFFFF;
    align-self: stretch;  /* Full width alignment */
}

merch-card[variant="plans-v2"] ul {
    padding: 0;
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="plans-v2"] ul li {
    font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
    color: #292929;
    line-height: 140%;
    display: inline-flex;
    list-style: none;
    padding: var(--consonant-merch-spacing-xxs) 0;
}

merch-card[variant="plans-v2"] ul li::before {
    display: inline-block;
    content: var(--list-checked-icon);
    margin-right: var(--consonant-merch-spacing-xxs);
    vertical-align: middle;
    flex-shrink: 0;
}

merch-card[variant="plans-v2"] .help-text {
    font-size: 12px;
    font-weight: 400;
    color: var(--spectrum-gray-600, #6E6E6E);
    line-height: 1.5;
    margin-top: var(--consonant-merch-spacing-xxs);
}

@media screen and ${MOBILE_LANDSCAPE}, ${TABLET_DOWN} {
    :root {
        --consonant-merch-card-plans-v2-width: 100%;
    }
    merch-card[variant="plans-v2"] {
        width: 100%;
        max-width: var(--consonant-merch-card-plans-v2-width);
        box-sizing: border-box;
    }
}

@media screen and ${TABLET_UP}, ${DESKTOP_UP}, ${LARGE_DESKTOP} {
    :root {
        --consonant-merch-card-plans-v2-width: 276px;
    }
}
collection-container.plans:has(merch-card[variant="plans-v2"]) {
    --merch-card-collection-card-min-height: 273px;
    --merch-card-collection-card-width: var(--consonant-merch-card-plans-v2-width);
    grid-template-columns: auto;
}

merch-card-collection-header.plans {
    --merch-card-collection-header-columns: 1fr fit-content(100%);
    --merch-card-collection-header-areas: "result filter";
}

merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
    --merch-card-collection-card-width: 100%;
    display: grid;
    grid-auto-rows: 1fr;
    align-items: stretch;
}

merch-card-collection.plans merch-card[variant="plans-v2"] {
    width: auto;
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
}

merch-card-collection.plans merch-card[variant="plans-v2"][has-short-description] {
    grid-template-rows: min-content min-content auto;
}

merch-card-collection.plans merch-card[variant="plans-v2"] {
    height: 100%;
    align-self: stretch;
}

merch-card-collection.plans merch-card[variant="plans-v2"] .heading-wrapper {
    align-items: center;
    gap: 12px;
    overflow: visible;
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="icons"] {
    align-items: center;
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="heading-xs"] {}

merch-card-collection.plans merch-card[variant="plans-v2"] aem-fragment + [slot^="heading-"] {
    margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
}

merch-card-collection.plans merch-card[variant="plans-v2"] [slot="short-description"] strong {
    font-weight: 800;
    font-size: 18px;
}

merch-card[variant="plans-v2"][size="wide"] {
    width: 100%;
    max-width: 635px;
}

merch-card[variant="plans-v2"] .price-divider {
    display: none;
}

merch-card[variant="plans-v2"][size="wide"] .price-divider {
    display: block;
    height: 1px;
    background-color: #E8E8E8;
    margin: 16px 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper [slot="icons"] {
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] .heading-wrapper [slot="heading-xs"] {
    margin: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="body-xs"] {
    margin-bottom: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] {
    margin-top: 0;
}

merch-card[variant="plans-v2"][size="wide"] [slot="heading-m"] span[data-template="planType"] {
    font-style: italic;
}

merch-card[variant="plans-v2"][size="wide"] footer {
    align-items: flex-start;
}

merch-card[variant="plans-v2"][size="wide"] footer [slot="heading-m"] {
    order: -1;
    margin-bottom: 16px;
    align-self: flex-start;
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }

    merch-card[variant="plans-v2"] .spacer {
        display: none;
    }

    merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-auto-rows: auto;
    }

    merch-card-collection.plans:is(.one-merch-cards, .two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        --merch-card-collection-card-width: unset;
    }
}

/* Tablet */
@media screen and ${TABLET_UP} {
    :root {
        --consonant-merch-card-plans-v2-width: 360px;
    }
    merch-card-collection.plans.four-merch-cards:has(merch-card[variant="plans-v2"]) .foreground {
        max-width: unset;
    }
    merch-card-collection.plans:is(.two-merch-cards, .three-merch-cards, .four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
    }
    merch-card[variant="plans-v2"][size="wide"], merch-card[variant="plans-v2"][size="super-wide"]{
      padding: 55px 47px;
    }
}

/* Desktop */
@media screen and ${DESKTOP_UP} {
    :root {
        --consonant-merch-card-plans-v2-width: 276px;
    }

    merch-card-collection.plans:is(.three-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(3, var(--consonant-merch-card-plans-v2-width));
    }

    merch-card-collection.plans:is(.four-merch-cards):has(merch-card[variant="plans-v2"]) {
        grid-template-columns: repeat(4 , var(--consonant-merch-card-plans-v2-width));
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: fit-content(100%);
        --merch-card-collection-header-areas: "custom";
    }
}

/* Large Desktop */
@media screen and ${LARGE_DESKTOP} {
.columns .four-merch-cards.plans:has(merch-card[variant="plans-v2"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-plans-v2-width));
  }

}
`;

// src/variants/plans-v2.js
var PLANS_V2_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "subtitle" },
  prices: { tag: "p", slot: "heading-m" },
  shortDescription: { tag: "p", slot: "short-description" },
  promoText: { tag: "p", slot: "promo-text" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  callout: { tag: "div", slot: "callout-content" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  addon: true,
  secureLabel: true,
  planType: true,
  badgeIcon: true,
  badge: { tag: "div", slot: "badge", default: "spectrum-red-700-plans" },
  allowedBadgeColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-gray-700-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-plans",
    "spectrum-gray-300-plans",
    "spectrum-green-900-plans",
    "spectrum-red-700-plans",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  size: ["wide", "super-wide"],
  whatsIncluded: { tag: "div", slot: "whats-included" },
  ctas: { slot: "footer", size: "m" },
  style: "consonant",
  perUnitLabel: { tag: "span", slot: "per-unit-label" }
};
var PlansV2 = class extends VariantLayout {
  constructor(card) {
    super(card);
    this.adaptForMedia = this.adaptForMedia.bind(this);
    this.toggleShortDescription = this.toggleShortDescription.bind(this);
    this.shortDescriptionExpanded = false;
    this.syncScheduled = false;
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
      options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
      return;
    }
    if (element.dataset.template === "strikethrough" || element.dataset.template === "price") {
      options.displayPerUnit = false;
    }
  }
  getGlobalCSS() {
    return CSS6;
  }
  adjustSlotPlacement(name, sizes, shouldBeInFooter) {
    const { shadowRoot } = this.card;
    const footer = shadowRoot.querySelector("footer");
    const body = shadowRoot.querySelector(".body");
    const size = this.card.getAttribute("size");
    if (!size) return;
    const slotInFooter = shadowRoot.querySelector(
      `footer slot[name="${name}"]`
    );
    const slotInBody = shadowRoot.querySelector(
      `.body slot[name="${name}"]`
    );
    if (!size.includes("wide")) {
      footer?.classList.remove("wide-footer");
      slotInFooter?.remove();
    }
    if (!sizes.includes(size)) return;
    footer?.classList.toggle("wide-footer", media_default.isDesktopOrUp);
    if (!shouldBeInFooter && slotInFooter) {
      if (slotInBody) {
        slotInFooter.remove();
      } else {
        const bodyPlaceholder = body.querySelector(
          `[data-placeholder-for="${name}"]`
        );
        if (bodyPlaceholder) {
          bodyPlaceholder.replaceWith(slotInFooter);
        } else {
          body.appendChild(slotInFooter);
        }
      }
      return;
    }
    if (shouldBeInFooter && slotInBody) {
      const bodyPlaceholder = document.createElement("div");
      bodyPlaceholder.setAttribute("data-placeholder-for", name);
      bodyPlaceholder.classList.add("slot-placeholder");
      if (!slotInFooter) {
        footer.prepend(slotInBody.cloneNode(true));
      }
      slotInBody.replaceWith(bodyPlaceholder);
    }
  }
  adaptForMedia() {
    const isInCollection = this.card.closest(
      "merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns"
    );
    if (!isInCollection) {
      if (!this.card.hasAttribute("size")) {
        return;
      }
      return;
    }
    this.adjustSlotPlacement("heading-m", ["wide"], true);
    this.adjustSlotPlacement("addon", ["super-wide"], media_default.isDesktopOrUp);
    this.adjustSlotPlacement(
      "callout-content",
      ["super-wide"],
      media_default.isDesktopOrUp
    );
  }
  adjustCallout() {
    const tooltipIcon = this.card.querySelector(
      '[slot="callout-content"] .icon-button'
    );
    if (!tooltipIcon?.title) return;
    tooltipIcon.dataset.tooltip = tooltipIcon.title;
    tooltipIcon.removeAttribute("title");
    tooltipIcon.classList.add("hide-tooltip");
    const hideTooltipExcept = (target) => {
      if (target === tooltipIcon) {
        tooltipIcon.classList.toggle("hide-tooltip");
      } else {
        tooltipIcon.classList.add("hide-tooltip");
      }
    };
    document.addEventListener("touchstart", (e) => {
      e.preventDefault();
      hideTooltipExcept(e.target);
    });
    document.addEventListener("mouseover", (e) => {
      e.preventDefault();
      if (e.target !== tooltipIcon) {
        tooltipIcon.classList.add("hide-tooltip");
      } else {
        tooltipIcon.classList.remove("hide-tooltip");
      }
    });
  }
  async postCardUpdateHook() {
    if (!this.card.isConnected) return;
    this.adaptForMedia();
    this.adjustAddon();
    this.adjustCallout();
    this.updateShortDescriptionVisibility();
    if (this.hasShortDescription) {
      this.card.setAttribute("has-short-description", "");
    } else {
      this.card.removeAttribute("has-short-description");
    }
    if (!this.legalAdjusted) {
      await this.adjustLegal();
    }
    await this.card.updateComplete;
    if (this.card.prices?.length > 0) {
      await Promise.all(
        this.card.prices.map(
          (price) => price.onceSettled?.() || Promise.resolve()
        )
      );
    }
    if (window.matchMedia("(min-width: 768px)").matches) {
      const container = this.getContainer();
      if (!container) return;
      const prefix = `--consonant-merch-card-${this.card.variant}`;
      const hasExistingVars = container.style.getPropertyValue(
        `${prefix}-body-height`
      );
      if (!hasExistingVars) {
        requestAnimationFrame(() => {
          const cards = container.querySelectorAll(
            `merch-card[variant="${this.card.variant}"]`
          );
          cards.forEach(
            (card) => card.variantLayout?.syncHeights?.()
          );
        });
      } else {
        requestAnimationFrame(() => {
          this.syncHeights();
        });
      }
    }
  }
  get mainPrice() {
    return this.card.querySelector(
      `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
  }
  syncHeights() {
    if (this.card.getBoundingClientRect().width <= 2) return;
    const body = this.card.shadowRoot?.querySelector(".body");
    if (body) this.updateCardElementMinHeight(body, "body");
    const footer = this.card.shadowRoot?.querySelector("footer");
    if (footer) this.updateCardElementMinHeight(footer, "footer");
    const shortDescription = this.card.querySelector(
      '[slot="short-description"]'
    );
    if (shortDescription)
      this.updateCardElementMinHeight(
        shortDescription,
        "short-description"
      );
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const headingPrice = this.mainPrice;
      if (!headingPrice) return;
      const legal = headingPrice.cloneNode(true);
      await headingPrice.onceSettled();
      if (!headingPrice?.options) return;
      if (headingPrice.options.displayPerUnit)
        headingPrice.dataset.displayPerUnit = "false";
      if (headingPrice.options.displayTax)
        headingPrice.dataset.displayTax = "false";
      if (headingPrice.options.displayPlanType)
        headingPrice.dataset.displayPlanType = "false";
      legal.setAttribute("data-template", "legal");
      headingPrice.parentNode.insertBefore(
        legal,
        headingPrice.nextSibling
      );
      await legal.onceSettled();
    } catch {
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    addon.setAttribute("custom-checkbox", "");
    const price = this.mainPrice;
    if (!price) return;
    await price.onceSettled();
    const planType = price.value?.[0]?.planType;
    if (planType) addon.planType = planType;
  }
  get stockCheckbox() {
    return this.card.checkboxLabel ? html7`<label id="stock-checkbox">
                <input type="checkbox" @change=${this.card.toggleStockOffer}></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>` : nothing3;
  }
  get hasShortDescription() {
    return !!this.card.querySelector('[slot="short-description"]');
  }
  get shortDescriptionLabel() {
    const shortDescElement = this.card.querySelector(
      '[slot="short-description"]'
    );
    const boldElement = shortDescElement.querySelector("strong, b");
    if (boldElement?.textContent?.trim()) {
      return boldElement.textContent.trim();
    }
    const headingOrPara = shortDescElement.querySelector(
      "h1, h2, h3, h4, h5, h6, p"
    );
    if (headingOrPara?.textContent?.trim()) {
      return headingOrPara.textContent.trim();
    }
    const firstLine = shortDescElement.textContent?.trim().split("\n")[0].trim();
    return firstLine;
  }
  updateShortDescriptionVisibility() {
    const shortDescElement = this.card.querySelector(
      '[slot="short-description"]'
    );
    if (!shortDescElement) return;
    const firstElement = shortDescElement.querySelector("strong, b, p");
    if (!firstElement) return;
    if (!media_default.isMobile) {
      firstElement.style.display = "";
    } else {
      firstElement.style.display = "none";
    }
  }
  toggleShortDescription() {
    this.shortDescriptionExpanded = !this.shortDescriptionExpanded;
    this.card.requestUpdate();
  }
  get shortDescriptionToggle() {
    if (!this.hasShortDescription) return nothing3;
    if (!media_default.isMobile) {
      return html7`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `;
    }
    return html7`
            <div class="short-description-divider"></div>
            <div
                class="short-description-toggle ${this.shortDescriptionExpanded ? "expanded" : ""}"
                @click=${this.toggleShortDescription}
            >
                <span class="toggle-label">${this.shortDescriptionLabel}</span>
                <span
                    class="toggle-icon ${this.shortDescriptionExpanded ? "expanded" : ""}"
                ></span>
            </div>
            <div
                class="short-description-content ${this.shortDescriptionExpanded ? "expanded" : ""}"
            >
                <slot name="short-description"></slot>
            </div>
        `;
  }
  get icons() {
    return this.card.querySelector('[slot="icons"]') || this.card.getAttribute("id") ? html7`<slot name="icons"></slot>` : nothing3;
  }
  get secureLabelFooter() {
    return html7`<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`;
  }
  connectedCallbackHook() {
    this.handleMediaChange = () => {
      this.adaptForMedia();
      this.updateShortDescriptionVisibility();
      this.card.requestUpdate();
      if (window.matchMedia("(min-width: 768px)").matches) {
        requestAnimationFrame(() => {
          this.syncHeights();
        });
      }
    };
    media_default.matchMobile.addEventListener("change", this.handleMediaChange);
    media_default.matchDesktopOrUp.addEventListener(
      "change",
      this.handleMediaChange
    );
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.boundingClientRect.height === 0) return;
      if (!entry.isIntersecting) return;
      if (window.matchMedia("(min-width: 768px)").matches) {
        requestAnimationFrame(() => {
          this.syncHeights();
        });
      }
      this.visibilityObserver.disconnect();
    });
    this.visibilityObserver.observe(this.card);
  }
  disconnectedCallbackHook() {
    media_default.matchMobile.removeEventListener("change", this.handleMediaChange);
    media_default.matchDesktopOrUp.removeEventListener(
      "change",
      this.handleMediaChange
    );
    this.visibilityObserver?.disconnect();
  }
  renderLayout() {
    const size = this.card.getAttribute("size");
    const isWide = size === "wide";
    return html7` ${this.badge}
            <div class="body">
                ${isWide ? html7`
                          <div class="heading-wrapper wide">
                              ${this.icons}
                              <slot name="heading-xs"></slot>
                          </div>
                          <slot name="subtitle"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                          <div class="price-divider"></div>
                          <slot name="heading-m"></slot>
                      ` : html7`
                          <div class="heading-wrapper">
                              ${this.icons}
                              <div class="heading-xs-wrapper">
                                  <slot name="heading-xs"></slot>
                                  <slot name="subtitle"></slot>
                              </div>
                          </div>
                          <slot name="heading-m"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                      `}
            </div>
            ${this.secureLabelFooter} ${this.shortDescriptionToggle}
            <slot></slot>`;
  }
};
__publicField(PlansV2, "variantStyle", css6`
        :host([variant='plans-v2']) {
            display: flex;
            flex-direction: column;
            min-height: 273px;
            position: relative;
            background-color: var(--spectrum-gray-50, #ffffff);
            border-radius: var(
                --consonant-merch-card-plans-v2-border-radius,
                8px
            );
            overflow: hidden;
            font-weight: 400;
            box-sizing: border-box;
            --consonant-merch-card-plans-v2-font-family: 'adobe-clean-display',
                'Adobe Clean', sans-serif;
            --merch-card-plans-v2-min-width: 220px;
            --merch-card-plans-v2-padding: 24px 24px;
            --merch-color-green-promo: #05834e;
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
            --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
        }

        :host([variant='plans-v2']) .slot-placeholder {
            display: none;
        }

        :host([variant='plans-v2']) .body {
            --merch-card-plans-v2-body-min-height: calc(
                var(--consonant-merch-card-plans-v2-body-height, 0px) - (24px)
            );
            display: flex;
            flex-direction: column;
            min-width: var(--merch-card-plans-v2-min-width);
            padding: var(--merch-card-plans-v2-padding);
            padding-bottom: 0;
            flex: 0 0 auto;
            gap: 12px;
            min-height: var(--merch-card-plans-v2-body-min-height, auto);
            width: 220px;
        }

        :host([variant='plans-v2'][size]) .body {
            width: auto;
        }

        :host([variant='plans-v2']) footer {
            padding: var(--merch-card-plans-v2-padding);
            min-height: var(
                --consonant-merch-card-plans-v2-footer-height,
                auto
            );
            flex-direction: column;
            align-items: flex-start;
        }

        :host([variant='plans-v2']) slot[name='subtitle'] {
            display: var(--merch-card-plans-v2-subtitle-display);
            min-height: 18px;
            margin-top: 4px;
            margin-bottom: -8px;
        }

        :host([variant='plans-v2']) ::slotted([slot='subtitle']) {
            font-size: 14px;
            font-weight: 400;
            color: var(--spectrum-gray-700, #505050);
            line-height: 1.4;
        }

        :host([variant='plans-v2']) ::slotted([slot='heading-xs']) {
            font-size: 32px;
            font-weight: 900;
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                sans-serif
            );
            line-height: 1.2;
            color: var(--spectrum-gray-800, #2c2c2c);
            margin: 0 0 16px 0;
            min-height: var(--merch-card-plans-v2-heading-min-height);
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='plans-v2']) slot[name='icons'] {
            gap: 3.5px;
            mask-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 1) 0%,
                rgba(0, 0, 0, 1) 12.5%,
                rgba(0, 0, 0, 0.8) 25%,
                rgba(0, 0, 0, 0.6) 37.5%,
                rgba(0, 0, 0, 0.4) 50%,
                rgba(0, 0, 0, 0.2) 62.5%,
                rgba(0, 0, 0, 0.05) 75%,
                rgba(0, 0, 0, 0.03) 87.5%,
                rgba(0, 0, 0, 0) 100%
            );
            -webkit-mask-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 1) 0%,
                rgba(0, 0, 0, 1) 12.5%,
                rgba(0, 0, 0, 0.8) 25%,
                rgba(0, 0, 0, 0.6) 37.5%,
                rgba(0, 0, 0, 0.4) 50%,
                rgba(0, 0, 0, 0.2) 62.5%,
                rgba(0, 0, 0, 0.05) 75%,
                rgba(0, 0, 0, 0.03) 87.5%,
                rgba(0, 0, 0, 0) 100%
            );
        }

        :host([variant='plans-v2']) ::slotted([slot='icons']) {
            display: flex;
        }

        :host([variant='plans-v2']) ::slotted([slot='heading-m']) {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 800;
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                sans-serif
            );
            line-height: 1.15;
            color: var(--spectrum-gray-800, #2c2c2c);
        }

        :host([variant='plans-v2'])
            ::slotted([slot='heading-m'])
            span[data-template='legal'] {
            font-size: 20px;
            color: var(--spectrum-gray-700, #6b6b6b);
        }

        :host([variant='plans-v2']) ::slotted([slot='promo-text']) {
            font-size: 16px;
            font-weight: 700;
            color: var(--merch-color-green-promo, #05834e);
            line-height: 1.5;
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) ::slotted([slot='body-xs']) {
            font-size: 18px;
            font-weight: 400;
            font-family: 'Adobe Clean', sans-serif;
            color: var(--spectrum-gray-700, #505050);
            line-height: 1.4;
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) ::slotted([slot='quantity-select']) {
            margin: 0 0 16px 0;
        }

        :host([variant='plans-v2']) .spacer {
            flex: 1 1 auto;
        }

        :host([variant='plans-v2']) ::slotted([slot='whats-included']) {
            padding-top: 24px;
            padding-bottom: 24px;
            border-top: 1px solid #e8e8e8;
        }

        :host([variant='plans-v2']) ::slotted([slot='addon']) {
            margin-top: auto;
            padding-top: 8px;
        }

        :host([variant='plans-v2']) footer ::slotted([slot='addon']) {
            margin: 0;
            padding: 0;
        }

        :host([variant='plans-v2']) .wide-footer #stock-checkbox {
            margin-top: 0;
        }

        :host([variant='plans-v2']) #stock-checkbox {
            margin-top: 8px;
            gap: 9px;
            color: rgb(34, 34, 34);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
            padding-top: 4px;
            padding-bottom: 5px;
        }

        :host([variant='plans-v2']) #stock-checkbox > span {
            border: 2px solid rgb(109, 109, 109);
            width: 12px;
            height: 12px;
        }

        :host([variant='plans-v2']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }

        :host([variant='plans-v2']) footer ::slotted(a) {
            display: block;
            width: 100%;
            text-align: center;
            margin-bottom: 12px;
        }

        :host([variant='plans-v2']) footer ::slotted(a:last-child) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2']) .short-description-divider {
            height: 1px;
            background-color: var(
                --consonant-merch-card-plans-v2-divider-color,
                #e8e8e8
            );
            margin: 0;
        }

        :host([variant='plans-v2']) .short-description-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 16px 32px;
            cursor: pointer;
            background-color: var(
                --consonant-merch-card-plans-v2-toggle-background-color,
                #f8f8f8
            );
            transition: background-color 0.2s ease;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
        }

        :host([variant='plans-v2']) .short-description-toggle .toggle-label {
            font-size: 18px;
            font-weight: 700;
            font-family: 'Adobe Clean', sans-serif;
            color: var(
                --consonant-merch-card-plans-v2-toggle-label-color,
                #292929
            );
            text-align: left;
            flex: 1;
            line-height: 22px;
        }

        :host([variant='plans-v2']) .short-description-toggle .toggle-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
            background-size: 28px 28px;
            background-position: center;
            background-repeat: no-repeat;
            transition: background-image 0.3s ease;
        }

        :host([variant='plans-v2'])
            .short-description-toggle
            .toggle-icon.expanded {
            background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
        }

        :host([variant='plans-v2']) .short-description-content {
            max-height: 0;
            overflow: hidden;
            transition:
                max-height 0.3s ease,
                padding 0.3s ease;
            padding: 0 32px;
            background-color: #ffffff;
        }

        :host([variant='plans-v2']) .short-description-content.expanded {
            max-height: 500px;
            padding: 24px 32px;
            border-bottom-right-radius: 16px;
            border-bottom-left-radius: 16px;
        }

        :host([variant='plans-v2']) .short-description-content.desktop {
            max-height: none;
            overflow: visible;
            padding: 26px 24px;
            transition: none;
            border-top: 1px solid #e9e9e9;
            min-height: var(
                --consonant-merch-card-plans-v2-short-description-height,
                auto
            );
            background-color: #ffffff;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            width: 226px;
        }

        :host([variant='plans-v2'])
            .short-description-content
            ::slotted([slot='short-description']) {
            font-size: 16px;
            font-weight: 400;
            font-family: 'Adobe Clean', sans-serif;
            color: #292929;
            line-height: 1.4;
            margin: 0;
        }

        :host([variant='plans-v2'][border-color='spectrum-yellow-300-plans']) {
            border-color: #ffd947;
        }

        :host([variant='plans-v2'][border-color='spectrum-gray-300-plans']) {
            border-color: #dadada;
        }

        :host([variant='plans-v2'][border-color='spectrum-green-900-plans']) {
            border-color: #05834e;
        }

        :host([variant='plans-v2'][border-color='spectrum-red-700-plans']) {
            border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-red-700-plans) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-yellow-300-plans),
        :host([variant='plans-v2']) #badge.spectrum-yellow-300-plans {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-gray-300-plans),
        :host([variant='plans-v2']) #badge.spectrum-gray-300-plans {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-gray-700-plans),
        :host([variant='plans-v2']) #badge.spectrum-gray-700-plans {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-green-900-plans),
        :host([variant='plans-v2']) #badge.spectrum-green-900-plans {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='plans-v2'])
            ::slotted([slot='badge'].spectrum-red-700-plans),
        :host([variant='plans-v2']) #badge.spectrum-red-700-plans {
            background-color: #eb1000;
            color: #ffffff;
        }

        :host([variant='plans-v2']) .price-divider {
            display: none;
        }

        :host([variant='plans-v2']) .heading-wrapper {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        :host([variant='plans-v2'][size='wide']) {
            width: 100%;
            max-width: 768px;
        }

        :host([variant='plans-v2'][size='wide']) .heading-wrapper.wide {
            flex-direction: row;
            align-items: center;
            gap: 8px;
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            slot[name='icons'] {
            margin-bottom: 0;
            mask-image: none;
            -webkit-mask-image: none;
            flex-shrink: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            ::slotted([slot='icons']) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            .heading-wrapper.wide
            ::slotted([slot='heading-xs']) {
            margin: 0;
            font-size: 27px;
            font-weight: 800;
            line-height: 1.25;
            white-space: nowrap;
        }

        :host([variant='plans-v2'][size='wide']) slot[name='subtitle'] {
            display: block;
            margin-top: 0;
            margin-bottom: 12px;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='subtitle']) {
            font-family: var(
                --consonant-merch-card-plans-v2-font-family,
                'Adobe Clean Display',
                'Adobe Clean',
                sans-serif
            );
            font-size: 52px;
            font-weight: 900;
            line-height: 1.1;
            color: var(--spectrum-gray-800, #2c2c2c);
        }

        :host([variant='plans-v2'][size='wide']) .price-divider {
            display: block;
            height: 4px;
            background-color: #e8e8e8;
            margin: 24px 0;
            width: 100%;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='body-xs']) {
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide']) ::slotted([slot='heading-m']) {
            margin-top: 0;
        }

        :host([variant='plans-v2'][size='wide']) footer {
            justify-content: flex-start;
            flex-direction: column;
            align-items: flex-start;
        }

        :host([variant='plans-v2'][size='wide'])
            footer
            ::slotted([slot='heading-m']) {
            order: -1;
            margin-bottom: 16px;
            align-self: flex-start;
        }

        :host([variant='plans-v2'][size='wide']) footer ::slotted(a) {
            width: auto;
            min-width: 150px;
            margin-right: 12px;
            margin-bottom: 0;
        }

        :host([variant='plans-v2'][size='wide'])
            footer
            ::slotted(a:last-child) {
            margin-right: 0;
        }

        @media ${unsafeCSS2(MOBILE_LANDSCAPE)}, ${unsafeCSS2(TABLET_DOWN)} {
            :host([variant='plans-v2']) {
                --merch-card-plans-v2-padding: 26px 16px;
            }

            :host([variant='plans-v2']) .short-description-toggle {
                padding: 16px;
            }

            :host([variant='plans-v2']) .short-description-toggle.expanded {
                background-color: var(
                    --consonant-merch-card-plans-v2-toggle-expanded-background-color,
                    #ffffff
                );
            }

            :host([variant='plans-v2']) .short-description-content {
                padding: 0 16px;
                width: auto !important;
            }

            :host([variant='plans-v2']) .short-description-content.expanded {
                padding: 24px 16px;
            }

            :host([variant='plans-v2'][size='wide']) .body {
                padding: 16px;
                width: auto;
            }

            :host([variant='plans-v2']) .body {
                width: auto;
            }
        }

        /* Keep short-description section white in dark mode */
        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-content {
            background-color: #ffffff;
            border-bottom-left-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
            border-bottom-right-radius: var(
                --consonant-merch-card-plans-v2-border-radius
            );
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-content
            ::slotted([slot='short-description']) {
            color: #292929;
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-toggle {
            background-color: #ffffff;
        }

        :host-context(.dark)
            :host([variant='plans-v2'])
            .short-description-toggle
            .toggle-label {
            color: #292929;
        }
    `);
__publicField(PlansV2, "collectionOptions", {
  customHeaderArea: (collection) => {
    if (!collection.sidenav) return nothing3;
    return html7`<slot name="resultsText"></slot>`;
  },
  headerVisibility: {
    search: false,
    sort: false,
    result: ["mobile", "tablet"],
    custom: ["desktop"]
  },
  onSidenavAttached: (collection) => {
    const minifyOverflowingWideCards = () => {
      const merchCards = collection.querySelectorAll("merch-card");
      merchCards.forEach((merchCard) => {
        if (merchCard.hasAttribute("data-size")) {
          merchCard.setAttribute(
            "size",
            merchCard.getAttribute("data-size")
          );
          merchCard.removeAttribute("data-size");
        }
      });
      if (!media_default.isDesktop) return;
      let columns = 0;
      merchCards.forEach((merchCard) => {
        if (merchCard.style.display === "none") return;
        const size = merchCard.getAttribute("size");
        let columnCount = size === "wide" ? 2 : size === "super-wide" ? 3 : 1;
        if (columnCount === 2 && columns % 3 === 2) {
          merchCard.setAttribute("data-size", size);
          merchCard.removeAttribute("size");
          columnCount = 1;
        }
        columns += columnCount;
      });
    };
    media_default.matchDesktop.addEventListener(
      "change",
      minifyOverflowingWideCards
    );
    collection.addEventListener(
      EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
      minifyOverflowingWideCards
    );
    collection.onUnmount.push(() => {
      media_default.matchDesktop.removeEventListener(
        "change",
        minifyOverflowingWideCards
      );
      collection.removeEventListener(
        EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
        minifyOverflowingWideCards
      );
    });
  }
});

// src/variants/product.js
import { html as html8, css as css7 } from "./lit-all.min.js";

// src/variants/product.css.js
var CSS7 = `
:root {
  --consonant-merch-card-product-width: 300px;
}

merch-card[variant="product"] {
    --consonant-merch-card-callout-icon-size: 18px;
    width: var(--consonant-merch-card-product-width);
}

merch-card[variant="product"][id] [slot='callout-content'] > div > div,
merch-card[variant="product"][id] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="product"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="product"] [slot="callout-content"] .icon-button {
  margin: 1.5px 0 1.5px 8px;
}

merch-card[variant="product"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="product"][id] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="product"][id] .price-unit-type:not(.disabled)::before {
    content: "";
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="product"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.product merch-card {
    width: auto;
    height: 100%;
}

  merch-card[variant="product"] merch-addon {
    padding-left: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 8px;
    border-radius: .5rem;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="product"] merch-addon [is="inline-price"] {
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="product"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="product"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

.one-merch-card.section merch-card[variant="product"],
.two-merch-cards.section merch-card[variant="product"],
.three-merch-cards.section merch-card[variant="product"],
.four-merch-cards.section merch-card[variant="product"] {
    width: auto;
}

/* grid style for product */
.one-merch-card.product,
.two-merch-cards.product,
.three-merch-cards.product,
.four-merch-cards.product {
    grid-template-columns: var(--consonant-merch-card-product-width);
}

/* Tablet */
@media screen and ${TABLET_UP} {
    .two-merch-cards.product,
    .three-merch-cards.product,
    .four-merch-cards.product {
        grid-template-columns: repeat(2, var(--consonant-merch-card-product-width));
    }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-product-width: 378px;
    --consonant-merch-card-product-width-4clm: 276px;
  }
    
  .three-merch-cards.product {
      grid-template-columns: repeat(3, var(--consonant-merch-card-product-width));
  }

  .four-merch-cards.product {
      grid-template-columns: repeat(4, var(--consonant-merch-card-product-width-4clm));
  }
}

merch-card[variant="product"] {
    merch-whats-included merch-mnemonic-list,
    merch-whats-included [slot="heading"] {
        width: 100%;
    }
}

`;

// src/variants/product.js
var PRODUCT_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  prices: { tag: "p", slot: "heading-xs" },
  promoText: { tag: "p", slot: "promo-text" },
  description: { tag: "div", slot: "body-xs" },
  mnemonics: { size: "l" },
  callout: { tag: "div", slot: "callout-content" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  secureLabel: true,
  planType: true,
  badgeIcon: true,
  badge: {
    tag: "div",
    slot: "badge",
    default: "color-yellow-300-variation"
  },
  allowedBadgeColors: [
    "color-yellow-300-variation",
    "color-gray-300-variation",
    "color-gray-700-variation",
    "color-green-900-variation",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "color-yellow-300-variation",
    "color-gray-300-variation",
    "color-green-900-variation",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  whatsIncluded: { tag: "div", slot: "whats-included" },
  ctas: { slot: "footer", size: "m" },
  style: "consonant",
  perUnitLabel: { tag: "span", slot: "per-unit-label" }
};
var Product = class extends VariantLayout {
  constructor(card) {
    super(card);
    this.postCardUpdateHook = this.postCardUpdateHook.bind(this);
    this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
  }
  getGlobalCSS() {
    return CSS7;
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
    options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
    if (element.dataset.template === "strikethrough" || element.dataset.template === "price") {
      options.displayPerUnit = false;
    }
  }
  adjustProductBodySlots() {
    if (this.card.getBoundingClientRect().width === 0) return;
    const slots = [
      "heading-xs",
      "body-xxs",
      "body-xs",
      "promo-text",
      "callout-content",
      "addon",
      "body-lower"
    ];
    slots.forEach(
      (slot) => this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
        slot
      )
    );
  }
  renderLayout() {
    return html8` ${this.badge}
            <div class="body" aria-live="polite">
                <slot name="icons"></slot>
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html8`<slot name="promo-text"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html8`<slot name="promo-text"></slot>` : ""}
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                <slot name="addon"></slot>
                <slot name="body-lower"></slot>
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}`;
  }
  connectedCallbackHook() {
    window.addEventListener("resize", this.postCardUpdateHook);
    this.card.addEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
  }
  disconnectedCallbackHook() {
    window.removeEventListener("resize", this.postCardUpdateHook);
    this.card.removeEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
  }
  async postCardUpdateHook() {
    if (!this.card.isConnected) return;
    this.adjustAddon();
    if (!media_default.isMobile) {
      this.adjustProductBodySlots();
    }
    if (!this.legalAdjusted) {
      await this.adjustLegal();
    }
  }
  async adjustLegal() {
    if (this.legalAdjusted || !this.card.id) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const headingPrice = this.mainPrice;
      if (!headingPrice) return;
      const legal = headingPrice.cloneNode(true);
      await headingPrice.onceSettled();
      if (!headingPrice?.options) return;
      if (headingPrice.options.displayPerUnit)
        headingPrice.dataset.displayPerUnit = "false";
      if (headingPrice.options.displayTax)
        headingPrice.dataset.displayTax = "false";
      if (headingPrice.options.displayPlanType)
        headingPrice.dataset.displayPlanType = "false";
      legal.setAttribute("data-template", "legal");
      headingPrice.parentNode.insertBefore(
        legal,
        headingPrice.nextSibling
      );
      await legal.onceSettled();
    } catch {
    }
  }
  get headingXSSlot() {
    return this.card.shadowRoot.querySelector('slot[name="heading-xs"]').assignedElements()[0];
  }
  get mainPrice() {
    const price = this.card.querySelector(
      `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price;
  }
  updatePriceQuantity({ detail }) {
    if (!this.mainPrice || !detail?.option) return;
    this.mainPrice.dataset.quantity = detail.option;
  }
  toggleAddon(merchAddon) {
    const mainPrice = this.mainPrice;
    const headingXSSlot = this.headingXSSlot;
    if (!mainPrice && headingXSSlot) {
      const planType = merchAddon?.getAttribute("plan-type");
      let visibleSpan = null;
      if (merchAddon && planType) {
        const matchingP = merchAddon.querySelector(
          `p[data-plan-type="${planType}"]`
        );
        visibleSpan = matchingP?.querySelector(
          'span[is="inline-price"]'
        );
      }
      this.card.querySelectorAll('p[slot="heading-xs"]').forEach((p) => p.remove());
      if (merchAddon.checked) {
        if (visibleSpan) {
          const replacementP = createTag(
            "p",
            {
              class: "addon-heading-xs-price-addon",
              slot: "heading-xs"
            },
            visibleSpan.innerHTML
          );
          this.card.appendChild(replacementP);
        }
      } else {
        const freeP = createTag(
          "p",
          { class: "card-heading", id: "free", slot: "heading-xs" },
          "Free"
        );
        this.card.appendChild(freeP);
      }
    }
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    const price = this.mainPrice;
    let planType = this.card.planType;
    if (price) {
      await price.onceSettled();
      planType = price.value?.[0]?.planType;
    }
    if (!planType) return;
    addon.planType = planType;
  }
};
__publicField(Product, "variantStyle", css7`
        :host([variant='product']) {
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }

        :host([variant='product']) > slot:not([name='icons']) {
            display: block;
        }
        :host([variant='product']) slot[name='body-xs'] {
            min-height: var(--consonant-merch-card-product-body-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='heading-xs'] {
            min-height: var(--consonant-merch-card-product-heading-xs-height);
            display: block;
        }
        :host([variant='product']) slot[name='body-xxs'] {
            min-height: var(--consonant-merch-card-product-body-xxs-height);
            display: block;
        }
        :host([variant='product']) slot[name='promo-text'] {
            min-height: var(--consonant-merch-card-product-promo-text-height);
            display: block;
        }
        :host([variant='product']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-product-callout-content-height
            );
            display: block;
        }
        :host([variant='product']) slot[name='addon'] {
            min-height: var(--consonant-merch-card-product-addon-height);
        }

        :host([variant='product']:not([id])) hr {
            display: none;
        }

        :host([variant='product']) ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }

        :host([variant='product']) .secure-transaction-label {
            color: rgb(80, 80, 80);
            line-height: var(--consonant-merch-card-detail-xs-line-height);
        }
    `);

// src/variants/segment.js
import { html as html9, css as css8 } from "./lit-all.min.js";

// src/variants/segment.css.js
var CSS8 = `
:root {
  --consonant-merch-card-segment-width: 378px;
}

merch-card[variant="segment"] {
  max-width: var(--consonant-merch-card-segment-width);
}

/* grid style for segment */
.one-merch-card.segment,
.two-merch-cards.segment,
.three-merch-cards.segment,
.four-merch-cards.segment {
  grid-template-columns: minmax(276px, var(--consonant-merch-card-segment-width));
}

.three-merch-cards.section merch-card[variant="segment"],
.four-merch-cards.section merch-card[variant="segment"] {
    max-width: 302px;
}

/* Mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
}

@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
    
  .two-merch-cards.segment,
  .three-merch-cards.segment,
  .four-merch-cards.segment {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-segment-width)));
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-segment-width: 276px;
  }
    
  .three-merch-cards.segment {
      grid-template-columns: repeat(3, minmax(276px, var(--consonant-merch-card-segment-width)));
  }

  .four-merch-cards.segment {
      grid-template-columns: repeat(4, minmax(276px, var(--consonant-merch-card-segment-width)));
  }
}

merch-card[variant="segment"] [slot='callout-content'] > div > div,
merch-card[variant="segment"] [slot="callout-content"] > p {
    position: relative;
    padding: 2px 10px 3px;
    background: #D9D9D9;
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="callout-content"] > p:has(> .icon-button) {
  padding-inline-end: 36px;
}

merch-card[variant="segment"] [slot="callout-content"] .icon-button {
  margin: 1.5px 0 1.5px 8px;
}

merch-card[variant="segment"] a.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="segment"][id] span[data-template="legal"] {
    display: block;
    color: var(----merch-color-grey-80);
    font-size: 14px;
    font-style: italic;
    font-weight: 400;
    line-height: 21px;
}

merch-card[variant="segment"][id] .price-unit-type:not(.disabled)::before {
    content: "";
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary {
    border: 2px solid var(--text-color);
    color: var(--text-color);
}

merch-card[variant="segment"] [slot="footer"] a.con-button.primary:hover {
    background-color: var(--color-black);
    border-color: var(--color-black);
    color: var(--color-white);
}

merch-card-collection.segment merch-card {
    width: auto;
    height: 100%;
}
`;

// src/variants/segment.js
var SEGMENT_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  prices: { tag: "p", slot: "heading-xs" },
  promoText: { tag: "p", slot: "promo-text" },
  description: { tag: "div", slot: "body-xs" },
  callout: { tag: "div", slot: "callout-content" },
  planType: true,
  secureLabel: true,
  badgeIcon: true,
  badge: { tag: "div", slot: "badge", default: "color-red-700-variation" },
  allowedBadgeColors: [
    "color-yellow-300-variation",
    "color-gray-300-variation",
    "color-gray-700-variation",
    "color-green-900-variation",
    "color-red-700-variation",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "color-yellow-300-variation",
    "color-gray-300-variation",
    "color-green-900-variation",
    "color-red-700-variation",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  ctas: { slot: "footer", size: "m" },
  style: "consonant",
  perUnitLabel: { tag: "span", slot: "per-unit-label" }
};
var Segment = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  priceOptionsProvider(element, options) {
    if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
    options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
    if (element.dataset.template === "strikethrough" || element.dataset.template === "price") {
      options.displayPerUnit = false;
    }
  }
  getGlobalCSS() {
    return CSS8;
  }
  get badgeElement() {
    return this.card.querySelector('[slot="badge"]');
  }
  get mainPrice() {
    return this.card.querySelector(
      `[slot="heading-xs"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
  }
  async postCardUpdateHook() {
    if (!this.legalAdjusted) {
      await this.adjustLegal();
    }
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const headingPrice = this.mainPrice;
      if (!headingPrice) return;
      const legal = headingPrice.cloneNode(true);
      await headingPrice.onceSettled();
      if (!headingPrice?.options) return;
      if (headingPrice.options.displayPerUnit)
        headingPrice.dataset.displayPerUnit = "false";
      if (headingPrice.options.displayTax)
        headingPrice.dataset.displayTax = "false";
      if (headingPrice.options.displayPlanType)
        headingPrice.dataset.displayPlanType = "false";
      legal.setAttribute("data-template", "legal");
      headingPrice.parentNode.insertBefore(
        legal,
        headingPrice.nextSibling
      );
      await legal.onceSettled();
    } catch {
    }
  }
  renderLayout() {
    return html9`
            ${this.badge}
            <div class="body">
                <slot name="heading-xs"></slot>
                <slot name="body-xxs"></slot>
                ${!this.promoBottom ? html9`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
                <slot name="body-xs"></slot>
                ${this.promoBottom ? html9`<slot name="promo-text"></slot
                          ><slot name="callout-content"></slot>` : ""}
                <slot name="badge"></slot>
            </div>
            <hr />
            ${this.secureLabelFooter}
        `;
  }
};
__publicField(Segment, "variantStyle", css8`
        :host([variant='segment']) {
            min-height: 214px;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #dadada) border-box;
            border: 1px solid transparent;
        }
        :host([variant='segment']) ::slotted(h3[slot='heading-xs']) {
            max-width: var(--consonant-merch-card-heading-xs-max-width, 100%);
        }
    `);

// src/variants/media.js
import { html as html10, css as css9 } from "./lit-all.min.js";

// src/variants/media.css.js
var CSS9 = `

    merch-card[variant='media'] {
        border: 0;
        padding: 24px 0;
    }

    merch-card[variant='media'] div[slot='bg-image'] img {
        border-radius: 0;
        max-height: unset;
    }

    merch-card[variant='media'] div[slot='footer'] .con-button {
        width: fit-content;
    }

    merch-card[variant='media'] p[slot='body-xxs'] {
        margin-bottom: 8px;
        font-weight: 700;
        text-transform: uppercase;
        line-height: 15px;
    }

    merch-card[variant='media'] h3[slot='heading-xs'] {
        margin-bottom: 16px;
        font-size: 28px;
        line-height: 35px;
    }

    merch-card[variant='media'] div[slot='body-xs'] {
        margin-bottom: 24px;
        font-size: 16px;
        line-height: 24px;
    }

    merch-card[variant='media'] div[slot='body-xs'] .spectrum-Link--secondary {
        color: inherit;
    }

    @media screen and (min-width: 600px) {
        merch-card[variant='media'] {
            max-width: 1000px;
        }

        merch-card[variant='media'] div[slot='bg-image'] {
            display: flex;
            align-items: center;
            height: 100%;
        }        
    }

    @media screen and (max-width: 430px) {
        div.dialog-modal .content merch-card[variant='media'] {
            width: 250px;
        }
    }

    @media screen and (max-width: 600px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 320px;
            margin-right: auto;
            margin-left: auto;
            padding: 70px 0;
        }

        .dialog-modal merch-card[variant='media'] div[slot='body-xs'] {
            font-size: 14px;
        }
    }

    @media screen and (min-width: 1200px) {
        merch-card[variant='media'] h3[slot='heading-xs'] {
            font-size: 36px;
            line-height: 45px;
        }
    }

    @media (min-width: 1366px) {
        div.dialog-modal merch-card[variant='media'] {
            margin: 0 100px;
        }
    }

    @media (min-width: 769px) and (max-width: 1000px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 500px;
        }
    }

    @media screen and (min-width: 600px) and (max-width: 680px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 320px;
        }
    }

    @media screen and (min-width: 681px) and (max-width: 768px) {
        div.dialog-modal merch-card[variant='media'] {
            width: 440px;
        }
    }

    @media screen and (min-width: 600px) and (max-width: 768px) {
        div.dialog-modal merch-card[variant='media'] div[slot='bg-image'] img {
            min-height: unset;
        }
    }

    .dialog-modal merch-card[variant='media'] {
        padding: 80px 0;
        margin: 0 50px;
        width: 700px;
    }

`;

// src/variants/media.js
var MEDIA_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "body-xxs" },
  description: { tag: "div", slot: "body-xs" },
  ctas: { slot: "footer", size: "m" },
  backgroundImage: { tag: "div", slot: "bg-image" },
  style: "consonant"
};
var Media2 = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS9;
  }
  removeFocusFromModalClose() {
    const modal = this.card.closest(".dialog-modal");
    if (modal) modal.querySelector(".dialog-close")?.blur();
  }
  async postCardUpdateHook() {
    this.removeFocusFromModalClose();
  }
  renderLayout() {
    return html10`
            <div class="media-row">
                <div class="text">
                    <slot name="body-xxs"></slot>
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                    <slot name="footer"></slot>
                </div>
                <div class="image">
                    <slot name="bg-image"></slot>
                </div>
            </div>
        `;
  }
};
__publicField(Media2, "variantStyle", css9`
        :host([variant='media']) .media-row {
            display: flex;
            gap: 24px;
        }

        :host([variant='media']) .text {
            display: flex;
            justify-content: center;
            flex-direction: column;
        }

        @media screen and (max-width: 600px) {
            :host([variant='media']) .media-row {
                flex-direction: column-reverse;
            }
        }

        @media screen and (min-width: 600px) {
            :host([variant='media']) .media-row {
                gap: 32px;
            }
        }

        @media screen and (min-width: 1200px) {
            :host([variant='media']) .media-row {
                gap: 40px;
            }
        }
    `);

// src/variants/special-offer.js
import { html as html11, css as css10 } from "./lit-all.min.js";

// src/variants/special-offer.css.js
var CSS10 = `
:root {
  --consonant-merch-card-special-offers-width: 302px;
	--merch-card-collection-card-width: var(--consonant-merch-card-special-offers-width);
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="promo-strikethrough"],
merch-card[variant="special-offers"] span[is="inline-price"][data-template="strikethrough"] {
  font-size: var(--consonant-merch-card-body-xs-font-size);
	font-weight: 400;
}

merch-card[variant="special-offers"] span[is="inline-price"][data-template="price"] {
  font-weight: 700;
}


/* grid style for special-offers */
.one-merch-card.special-offers,
.two-merch-cards.special-offers,
.three-merch-cards.special-offers,
.four-merch-cards.special-offers {
  grid-template-columns: minmax(302px, var(--consonant-merch-card-special-offers-width));
}

@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }
}

@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-special-offers-width: 302px;
  }

  .two-merch-cards.special-offers,
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
      grid-template-columns: repeat(2, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  .three-merch-cards.special-offers,
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(3, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.special-offers {
    grid-template-columns: repeat(4, minmax(302px, var(--consonant-merch-card-special-offers-width)));
  }
}
`;

// src/variants/special-offer.js
var SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  backgroundImage: { tag: "div", slot: "bg-image" },
  subtitle: { tag: "p", slot: "detail-m" },
  title: { tag: "h3", slot: "heading-xs" },
  prices: { tag: "p", slot: "heading-xs-price" },
  description: { tag: "div", slot: "body-xs" },
  ctas: { slot: "footer", size: "l" },
  badgeIcon: true,
  badge: {
    tag: "div",
    slot: "badge",
    default: "spectrum-yellow-300-special-offers"
  },
  allowedBadgeColors: [
    "spectrum-yellow-300-special-offers",
    "spectrum-gray-300-special-offers",
    "spectrum-green-900-special-offers"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300-special-offers",
    "spectrum-gray-300-special-offers",
    "spectrum-green-900-special-offers"
  ],
  borderColor: { attribute: "border-color" }
};
var SpecialOffer = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  get headingSelector() {
    return '[slot="detail-m"]';
  }
  getGlobalCSS() {
    return CSS10;
  }
  renderLayout() {
    return html11`${this.cardImage}
            <div class="body">
                <slot name="detail-m"></slot>
                <slot name="heading-xs"></slot>
                <slot name="heading-xs-price"></slot>
                <slot name="body-xs"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.evergreen ? html11`
                      <div
                          class="detail-bg-container"
                          style="background: ${this.card["detailBg"]}"
                      >
                          <slot name="detail-bg"></slot>
                      </div>
                  ` : html11`
                      <hr />
                      ${this.secureLabelFooter}
                  `}
            <slot></slot>`;
  }
};
__publicField(SpecialOffer, "variantStyle", css10`
        :host([variant='special-offers']) {
            min-height: 439px;
            background:
                linear-gradient(white, white) padding-box,
                var(--consonant-merch-card-border-color, #eaeaea) border-box;
            border: 1px solid transparent;
        }

        :host([variant='special-offers']) {
            width: var(--consonant-merch-card-special-offers-width);
        }

        :host([variant='special-offers'].center) {
            text-align: center;
        }

        :host(
            [variant='special-offers'][border-color='spectrum-yellow-300-special-offers']
        ) {
            border-color: var(--spectrum-yellow-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-gray-300-special-offers']
        ) {
            border-color: var(--spectrum-gray-300-special-offers);
        }

        :host(
            [variant='special-offers'][border-color='spectrum-green-900-special-offers']
        ) {
            border-color: var(--spectrum-green-900-special-offers);
        }
    `);

// src/variants/simplified-pricing-express.js
import { html as html12, css as css11 } from "./lit-all.min.js";

// src/variants/simplified-pricing-express.css.js
var CSS11 = `
:root {
    --merch-card-simplified-pricing-express-width: 311px;
}

merch-card[variant="simplified-pricing-express"] merch-badge {
    white-space: nowrap;
    color: var(--spectrum-white);
    font-size: var(--consonant-merch-card-detail-m-font-size);
    line-height: var(--consonant-merch-card-detail-m-line-height);
}

/* Grid layout for simplified-pricing-express cards */
merch-card-collection.simplified-pricing-express {
    display: grid;
    justify-content: center;
    justify-items: center;
    align-items: stretch;
    gap: 16px;
    /* Default to 1 column on mobile */
    grid-template-columns: 1fr;
}

/* Also support direct merch-card children and wrapped in p tags */
merch-card-collection.simplified-pricing-express p {
    margin: 0;
    font-size: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:has(mas-mnemonic) {
    padding-top: 16px;
}

@supports not selector(:has(*)) {
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:last-child {
        padding-top: 16px;
    }
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:nth-child(2) {
    padding-top: 16px;
}

/* Desktop - 3 columns */
@media screen and ${DESKTOP_UP} {
    merch-card-collection.simplified-pricing-express {
        grid-template-columns: repeat(3, 1fr);
        max-width: calc(3 * var(--merch-card-simplified-pricing-express-width) + 32px);
        margin: 0 auto;
    }

    /* Apply synchronized heights to slots using CSS variables */
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] {
        min-height: var(--consonant-merch-card-simplified-pricing-express-description-height);
        display: flex;
        flex-direction: column;
    }

    /* Push paragraph with mnemonics to the bottom using :has() */
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:has(mas-mnemonic) {
        margin-top: auto;
        min-height: var(--consonant-merch-card-simplified-pricing-express-icons-height);
    }

    /* Fallback for browsers without :has() support - target last paragraph */
    @supports not selector(:has(*)) {
        merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:last-child {
            margin-top: auto;
        }
    }

    /* Additional fallback - if second paragraph exists, assume it has mnemonics */
    merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:nth-child(2) {
        margin-top: auto;
    }

    merch-card[variant="simplified-pricing-express"] [slot="price"] {
        min-height: var(--consonant-merch-card-simplified-pricing-express-price-height);
    }

    merch-card[variant="simplified-pricing-express"] [slot="callout-content"] {
        min-height: var(--consonant-merch-card-simplified-pricing-express-callout-height);
    }
}

merch-card[variant="simplified-pricing-express"] p {
    margin: 0 !important; /* needed to override express-milo default margin to all <p> */
    font-size: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="heading-xs"] {
    font-size: 18px;
    font-weight: 700;
    line-height: 23.4px;
    color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="body-xs"] {
    font-size: var(--merch-card-simplified-pricing-express-body-xs-font-size, 14px);
    line-height: var(--merch-card-simplified-pricing-express-body-xs-line-height, 18.2px);
    color: var(--spectrum-gray-700);
    margin-bottom: 24px;
    justify-content: space-between;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] {
    display: block;
    width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.con-button {
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-weight: var(--merch-card-simplified-pricing-express-cta-font-weight);
    line-height: var(--merch-card-simplified-pricing-express-cta-line-height);
    font-size: var(--merch-card-simplified-pricing-express-cta-font-size);
    margin: 0;
    padding: 10px 24px 13px 24px;
    border-radius: 26px;
    height: 48px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] {
  display: flex;
  flex-direction: column;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"]:first-child {
  margin-inline-end: 8px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child {
  display: flex;
  align-items: baseline;
  margin: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] .price-recurrence {
  font-size: 12px;
  font-weight: 700;
  line-height: 15.6px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
  font-weight: bold;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"][data-template="optical"] {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  color: var(--spectrum-gray-800);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p:empty {
  min-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

/* Callout content styling */
merch-card[variant="simplified-pricing-express"] [slot="callout-content"] {
    color: var(--spectrum-gray-800);
    width: 100%;
    gap: 0;
    margin-bottom: var(--merch-card-simplified-pricing-express-padding);
    margin-top: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] span[is='inline-price'] {
    font-weight: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] > p {
    background: transparent;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    padding: 0;
}

merch-card[variant="simplified-pricing-express"] [slot="callout-content"] a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: inherit;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-line-height);
  width: 100%;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] .price-currency-symbol {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] span[is="inline-price"] .price-unit-type {
  font-size: var(--merch-card-simplified-pricing-express-price-recurrence-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-recurrence-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-recurrence-line-height);
}

/* Strikethrough price styling */
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-strikethrough,
merch-card[variant="simplified-pricing-express"] span.placeholder-resolved[data-template='strikethrough'],
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
  text-decoration: none;
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough,
merch-card[variant="simplified-pricing-express"] span[is="inline-price"][data-template='legal']  {
  color: var(--spectrum-gray-500);
}

merch-card[variant="simplified-pricing-express"] [slot="price"] p a {
  color: var(--spectrum-indigo-900);
  font-weight: 500;
  text-decoration: underline;
  white-space: nowrap;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"] .price-decimals {
  font-size: 22px;
  font-weight: 700;
  line-height: 28.6px;
  text-decoration-thickness: 2px;
}

merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='strikethrough'] .price-decimals,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:first-child span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals {
  text-decoration: line-through;
}

/* Ensure non-first paragraph prices have normal font weight */
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-integer,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-decimals,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-recurrence,
merch-card[variant="simplified-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] .price-unit-type {
  font-size: var(--merch-card-simplified-pricing-express-price-p-font-size);
  font-weight: var(--merch-card-simplified-pricing-express-price-p-font-weight);
  line-height: var(--merch-card-simplified-pricing-express-price-p-line-height);
}

/* Hide screen reader only text */
merch-card[variant="simplified-pricing-express"] sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* mas-mnemonic inline styles for simplified-pricing-express */
merch-card[variant="simplified-pricing-express"] mas-mnemonic {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-inline-end: 8px;
    overflow: visible;
    padding-top: 0;
    --mas-mnemonic-tooltip-padding: 4px 8px;
}

/* Fix leftmost tooltip cutoff on mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  merch-card[variant="simplified-pricing-express"] [slot="body-xs"] p:first-child mas-mnemonic:first-child {
    --tooltip-left-offset: 0;
  }
}

/* Tooltip containers - overflow handled by Shadow DOM */

/* Mobile styles */
@media screen and ${MOBILE_LANDSCAPE} {
  .collection-container.simplified-pricing-express {
    grid-template-columns: 1fr;
    width: 100%;
  }

  merch-card-collection.simplified-pricing-express {
    gap: 8px;
    width: 100%;
    max-width: 100%;
  }

  merch-card[variant="simplified-pricing-express"] {
    width: 100%;
    max-width: none;
    margin: 0 auto;
  }

  /* Badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="badge"] {
    font-size: 16px;
  }

  /* Trial badge alignment on mobile */
  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] {
    margin-left: 0;
    align-self: flex-start;
  }

  merch-card[variant="simplified-pricing-express"] [slot="trial-badge"] merch-badge {
    font-size: 12px;
    line-height: 20.8px;
  }

  /* Fix spacing between cards on mobile */
  main merch-card-collection.simplified-pricing-express p:has(merch-card[variant="simplified-pricing-express"]),
  main .section p:has(merch-card[variant="simplified-pricing-express"]) {
    margin: 0;
  }
}

/* Collapse/expand styles for mobile only */
@media screen and ${MOBILE_LANDSCAPE} {
  /* Base transition for smooth animation */
  merch-card[variant="simplified-pricing-express"] {
    transition: max-height 0.5s ease-out;
  }

  merch-card[variant="simplified-pricing-express"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"] [slot="price"],
  merch-card[variant="simplified-pricing-express"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"] [slot="cta"] {
    transition: opacity 0.5s ease-out, max-height 0.5s ease-out;
  }

  /* Collapsed state - hide content sections with animation */
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="price"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="cta"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"][data-expanded="false"] [slot="cta"] {
    opacity: 0;
    max-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /* Expanded state - show content with animation */
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="body-xs"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="price"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="callout-content"],
  merch-card[variant="simplified-pricing-express"][data-expanded="true"] [slot="cta"] {
    opacity: 1;
    pointer-events: auto;
  }

  /* Collapsed card should have fixed height and padding */
  merch-card[variant="simplified-pricing-express"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) {
    max-height: 57px;
    padding: 0;
    border-radius: 8px;
  }

  merch-card[variant="simplified-pricing-express"][gradient-border="true"][data-expanded="false"],
  merch-card[variant="simplified-pricing-express"][gradient-border="true"]:not([data-expanded="true"]) {
    max-height: 85px;
  }
}

/* Tablet styles - responsive full width with padding */
@media screen and ${TABLET_UP} and ${TABLET_DOWN} {
  .collection-container.simplified-pricing-express {
    display: block;
    width: 100%;
    padding: 0 32px;
    box-sizing: border-box;
  }

  merch-card-collection.simplified-pricing-express {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  merch-card[variant="simplified-pricing-express"] {
      width: 100%;
      min-width: unset;
      max-width: 100%;
  }
}

merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"],
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent {
    background-color: var(--spectrum-indigo-900);
    color: var(--spectrum-white, #ffffff);
    width: 100%;
}

/* Ensure text color is applied to the label span element for accessibility */
merch-card[variant="simplified-pricing-express"] [slot="cta"] sp-button[variant="accent"] .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] button.spectrum-Button--accent .spectrum-Button-label,
merch-card[variant="simplified-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent .spectrum-Button-label {
    color: var(--spectrum-white, #ffffff);
}
`;

// src/variants/simplified-pricing-express.js
var SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
  title: {
    tag: "h3",
    slot: "heading-xs",
    maxCount: 250,
    withSuffix: true
  },
  badge: {
    tag: "div",
    slot: "badge",
    default: "spectrum-blue-400"
  },
  allowedBadgeColors: [
    "spectrum-blue-400",
    "spectrum-gray-300",
    "spectrum-yellow-300",
    "gradient-purple-blue",
    "gradient-firefly-spectrum"
  ],
  description: {
    tag: "div",
    slot: "body-xs",
    maxCount: 2e3,
    withSuffix: false
  },
  prices: {
    tag: "div",
    slot: "price"
  },
  callout: {
    tag: "div",
    slot: "callout-content",
    editorLabel: "Price description"
  },
  ctas: {
    slot: "cta",
    size: "XL"
  },
  borderColor: {
    attribute: "border-color",
    specialValues: {
      gray: "var(--spectrum-gray-300)",
      blue: "var(--spectrum-blue-400)",
      "gradient-purple-blue": "linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)",
      "gradient-firefly-spectrum": "linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"
    }
  },
  disabledAttributes: [
    "badgeColor",
    "badgeBorderColor",
    "trialBadgeColor",
    "trialBadgeBorderColor"
  ],
  supportsDefaultChild: true
};
var SimplifiedPricingExpress = class extends VariantLayout {
  getGlobalCSS() {
    return CSS11;
  }
  get aemFragmentMapping() {
    return SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
  }
  get headingSelector() {
    return '[slot="heading-xs"]';
  }
  get badge() {
    return this.card.querySelector('[slot="badge"]');
  }
  syncHeights() {
    if (this.card.getBoundingClientRect().width === 0) {
      return;
    }
    const descriptionSlot = this.card.querySelector('[slot="body-xs"]');
    if (descriptionSlot) {
      this.updateCardElementMinHeight(descriptionSlot, "description");
    }
    const priceSlot = this.card.querySelector('[slot="price"]');
    if (priceSlot) {
      this.updateCardElementMinHeight(priceSlot, "price");
    }
    const calloutSlot = this.card.querySelector('[slot="callout-content"]');
    if (calloutSlot) {
      this.updateCardElementMinHeight(calloutSlot, "callout");
    }
    const iconRow = this.card.querySelector(
      '[slot="body-xs"] p:has(mas-mnemonic)'
    );
    if (iconRow) {
      this.updateCardElementMinHeight(iconRow, "icons");
    }
  }
  async postCardUpdateHook() {
    if (!this.card.isConnected) return;
    await this.card.updateComplete;
    if (this.card.prices?.length) {
      await Promise.all(
        this.card.prices.map((price) => price.onceSettled?.())
      );
    }
    if (media_default.isDesktopOrUp) {
      const container = this.getContainer();
      if (!container) return;
      requestAnimationFrame(() => {
        const cards = container.querySelectorAll(
          `merch-card[variant="${this.card.variant}"]`
        );
        cards.forEach((card) => card.variantLayout?.syncHeights?.());
      });
    }
  }
  connectedCallbackHook() {
    if (!this.card || this.card.failed) {
      return;
    }
    this.setupAccordion();
    if (this.card?.hasAttribute("data-default-card") && !isDesktop()) {
      this.card.setAttribute("data-expanded", "true");
    }
  }
  setupAccordion() {
    const merchCard = this.card;
    if (!merchCard) {
      return;
    }
    const updateExpandedState = () => {
      if (!isDesktop()) {
        const isDefaultCard = merchCard.hasAttribute("data-default-card");
        merchCard.setAttribute(
          "data-expanded",
          isDefaultCard ? "true" : "false"
        );
      } else {
        merchCard.removeAttribute("data-expanded");
      }
    };
    updateExpandedState();
    const mediaQuery = window.matchMedia(MOBILE_LANDSCAPE);
    this.mediaQueryListener = () => {
      updateExpandedState();
    };
    mediaQuery.addEventListener("change", this.mediaQueryListener);
  }
  disconnectedCallbackHook() {
    if (this.mediaQueryListener) {
      const mediaQuery = window.matchMedia(MOBILE_LANDSCAPE);
      mediaQuery.removeEventListener("change", this.mediaQueryListener);
    }
  }
  handleChevronClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.toggleExpanded();
  }
  handleCardClick(e) {
    if (e.target.closest(
      '.chevron-button, mas-mnemonic, button, a, [role="button"]'
    )) {
      return;
    }
    e.preventDefault();
    this.toggleExpanded();
  }
  toggleExpanded() {
    const merchCard = this.card;
    if (!merchCard || isDesktop()) {
      return;
    }
    const currentExpanded = merchCard.getAttribute("data-expanded");
    const isExpanded = currentExpanded === "true";
    const newExpanded = !isExpanded ? "true" : "false";
    merchCard.setAttribute("data-expanded", newExpanded);
  }
  renderLayout() {
    return html12`
            <div
                class="badge-wrapper"
                style="${this.badge ? "" : "visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
            <div class="card-content" @click=${(e) => this.handleCardClick(e)}>
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <slot name="trial-badge"></slot>
                    <button
                        class="chevron-button"
                        @click=${(e) => this.handleChevronClick(e)}
                    >
                        <svg
                            class="chevron-icon"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 15.5L5 8.5L6.4 7.1L12 12.7L17.6 7.1L19 8.5L12 15.5Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="description">
                    <slot name="body-xs"></slot>
                </div>
                <div class="price-container">
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot></slot>
        `;
  }
};
__publicField(SimplifiedPricingExpress, "variantStyle", css11`
        :host([variant='simplified-pricing-express']) {
            --merch-card-simplified-pricing-express-width: 365px;
            --merch-card-simplified-pricing-express-padding: 24px;
            --merch-card-simplified-pricing-express-padding-mobile: 16px;
            --merch-card-simplified-pricing-express-price-font-size: 22px;
            --merch-card-simplified-pricing-express-price-font-weight: 700;
            --merch-card-simplified-pricing-express-price-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-currency-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-size: 22px;
            --merch-card-simplified-pricing-express-price-currency-symbol-font-weight: 700;
            --merch-card-simplified-pricing-express-price-currency-symbol-line-height: 28.6px;
            --merch-card-simplified-pricing-express-price-recurrence-font-size: 12px;
            --merch-card-simplified-pricing-express-price-recurrence-font-weight: 700;
            --merch-card-simplified-pricing-express-price-recurrence-line-height: 15.6px;
            --merch-card-simplified-pricing-express-body-xs-font-size: 14px;
            --merch-card-simplified-pricing-express-body-xs-line-height: 18.2px;
            --merch-card-simplified-pricing-express-price-p-font-size: 12px;
            --merch-card-simplified-pricing-express-price-p-font-weight: 400;
            --merch-card-simplified-pricing-express-price-p-line-height: 15.6px;
            --merch-card-simplified-pricing-express-cta-font-size: 18px;
            --merch-card-simplified-pricing-express-cta-font-weight: 700;
            --merch-card-simplified-pricing-express-cta-line-height: 23.4px;

            /* Gradient definitions */
            --gradient-purple-blue: linear-gradient(
                96deg,
                #b539c8 0%,
                #7155fa 66%,
                #3b63fb 100%
            );
            --gradient-firefly-spectrum: linear-gradient(
                96deg,
                #d73220 0%,
                #d92361 33%,
                #7155fa 100%
            );
            width: var(--merch-card-simplified-pricing-express-width);
            max-width: var(--merch-card-simplified-pricing-express-width);
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
            position: relative;
        }

        :host([variant='simplified-pricing-express']) .badge-wrapper {
            padding: 4px 24px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            line-height: 15.6px;
            color: var(--spectrum-gray-800);
            position: relative;
            min-height: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        :host([variant='simplified-pricing-express']) .card-content {
            border-radius: 8px;
            padding: var(--merch-card-simplified-pricing-express-padding);
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--consonant-merch-spacing-xxs);
            position: relative;
        }

        :host([variant='simplified-pricing-express']) .card-content > * {
            position: relative;
        }

        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    )
            )
            .card-content {
            background: var(--spectrum-gray-50);
            border: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        :host(
                [variant='simplified-pricing-express']:not(
                        [gradient-border='true']
                    ):has([slot='badge']:not(:empty))
            )
            .card-content {
            border-top: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        :host(
                [variant='simplified-pricing-express']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .badge-wrapper {
            margin-bottom: -2px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper {
            border: none;
            margin-bottom: -6px;
            padding-bottom: 10px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .badge-wrapper
            ::slotted(*) {
            color: white !important;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content {
            border: none;
            padding: calc(
                var(--merch-card-simplified-pricing-express-padding) + 2px
            );
            border-radius: 8px;
        }

        :host([variant='simplified-pricing-express'][gradient-border='true'])
            .card-content::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            background: var(--spectrum-gray-50);
            border-radius: 7px;
            z-index: 0;
            pointer-events: none;
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background: var(--gradient-purple-blue);
        }

        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper,
        :host(
                [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background: var(--gradient-firefly-spectrum);
        }

        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }

        :host(
                [variant='simplified-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content::before {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }

        :host([variant='simplified-pricing-express']) .header {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
        }

        :host([variant='simplified-pricing-express']) [slot='heading-xs'] {
            font-size: 18px;
            font-weight: 700;
            line-height: 23.4px;
            color: var(--spectrum-gray-800);
        }

        :host([variant='simplified-pricing-express']) .description {
            gap: 16px;
            display: flex;
            flex-direction: column;
        }

        :host([variant='simplified-pricing-express']) .price-container {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            margin-top: auto;
        }

        :host([variant='simplified-pricing-express']) [slot='callout-content'] {
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 18px;
            color: var(--spectrum-gray-800);
            background: transparent;
            margin-top: 2px;
        }

        /* Desktop only - Fixed heights for alignment */
        @media (min-width: 1200px) {
            :host([variant='simplified-pricing-express']) .card-content {
                height: 100%;
            }

            :host([variant='simplified-pricing-express']) .description {
                flex: 1;
            }

            :host([variant='simplified-pricing-express']) .cta {
                flex-shrink: 0;
            }
        }

        :host([variant='simplified-pricing-express']) .cta,
        :host([variant='simplified-pricing-express']) .cta ::slotted(*) {
            width: 100%;
            display: block;
        }

        /* Mobile accordion styles */
        :host([variant='simplified-pricing-express']) .chevron-button {
            display: none;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: transform 0.5s ease;
        }

        :host([variant='simplified-pricing-express']) .chevron-icon {
            width: 24px;
            height: 24px;
            color: var(--spectrum-gray-800);
            transition: transform 0.5s ease;
        }

        /* Chevron rotation based on parent card's data-expanded attribute */
        :host-context(merch-card[data-expanded='false']) .chevron-icon {
            transform: rotate(0deg);
        }
        :host-context(merch-card[data-expanded='true']) .chevron-icon {
            transform: rotate(180deg);
        }

        /* Tablet styles - full width, no accordion */
        @media (min-width: 768px) and (max-width: 1199px) {
            :host([variant='simplified-pricing-express']) {
                width: 100%;
                max-width: 100%;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content,
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                padding: var(
                    --merch-card-simplified-pricing-express-padding-mobile
                );
            }

            /* Hide badge-wrapper on tablet except for gradient borders */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .badge-wrapper {
                display: none;
            }
        }

        /* Mobile only styles - accordion behavior */
        @media (max-width: 767px) {
            :host([variant='simplified-pricing-express']) {
                width: 100%;
                max-width: 100%;
                min-height: auto;
                cursor: pointer;
                transition: all 0.5s ease;
            }

            :host([variant='simplified-pricing-express']) .header {
                position: relative;
                justify-content: space-between;
                gap: 8px;
            }

            :host([variant='simplified-pricing-express']) .chevron-button {
                display: block;
                flex-shrink: 0;
                margin-left: auto;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content,
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                padding: calc(
                    var(
                            --merch-card-simplified-pricing-express-padding-mobile
                        ) +
                        2px
                );
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Hide badge-wrapper on mobile except for gradient borders */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .badge-wrapper {
                display: none;
            }

            /* Non-gradient border collapsed state - limit card-content height */
            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )[data-expanded='false']
                )
                .card-content {
                max-height: 50px;
                overflow: hidden;
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Gradient border collapsed state - limit badge-wrapper height */
            :host(
                    [variant='simplified-pricing-express'][gradient-border='true'][data-expanded='false']
                )
                .card-content {
                max-height: 50px;
                overflow: hidden;
                padding: 16px 16px 35px 16px;
                transition:
                    max-height 0.5s ease-out,
                    padding 0.5s ease-out;
            }

            /* Expanded state - explicit max-height for animation (CSS can't animate to 'auto') */
            :host([variant='simplified-pricing-express'][data-expanded='true'])
                .card-content {
                max-height: 1000px;
            }
        }
    `);

// src/variants/full-pricing-express.js
import { html as html13, css as css12 } from "./lit-all.min.js";

// src/variants/full-pricing-express.css.js
var CSS12 = `
:root {
    --merch-card-full-pricing-express-width: 378px;
    --merch-card-full-pricing-express-mobile-width: 365px;
}

/* Collection grid layout */
merch-card-collection.full-pricing-express {
    display: grid;
    justify-content: center;
    justify-items: center;
    align-items: stretch;
    gap: 16px;
}

/* Mobile - 1 column */
merch-card-collection.full-pricing-express {
    grid-template-columns: 1fr;
    max-width: 100%;
    margin: 0 auto;
    padding: 0 16px;
    box-sizing: border-box;
}

/* Mobile - override Milo .content max-width for full-width cards */
@media screen and (max-width: 767px) {
    .section:has(.collection-container.full-pricing-express) .content {
        max-width: 100%;
        margin: 0 auto;
    }

    .collection-container.full-pricing-express {
        display: block;
        width: 100%;
        max-width: 100%;
    }
}

/* Tablet - 2 columns (768px-1199px) */
@media screen and (min-width: 768px) and (max-width: 1199px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(2, 1fr);
        justify-items: stretch;
        max-width: 100%;
        padding: 0 16px;
    }

    /* Override Milo .content max-width for full-width cards */
    .section:has(.collection-container.full-pricing-express) .content {
        max-width: 100%;
        margin: 0 auto;
    }

    .collection-container.full-pricing-express {
        display: block;
        width: 100%;
        max-width: 100%;
    }
}

/* Desktop small - 2 columns */
@media screen and ${DESKTOP_UP} and (max-width: 1399px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(2, 1fr);
        max-width: calc(2 * var(--merch-card-full-pricing-express-width) + 16px);
    }
}

/* Desktop large - 3 columns */
@media screen and (min-width: 1400px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(3, 1fr);
        max-width: calc(3 * var(--merch-card-full-pricing-express-width) + 32px);
    }
}

/* Remove default paragraph margins */
merch-card[variant="full-pricing-express"] p {
    margin: 0 !important;
    font-size: inherit;
}

/* Slot-specific styles */
merch-card[variant="full-pricing-express"] [slot="heading-xs"] {
    font-size: 20px;
    font-weight: 700;
    line-height: 26px;
    color: var(--spectrum-gray-800);
    margin-bottom: 8px;
}

/* Title font size on mobile and tablet */
@media (max-width: 1199px) {
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] {
        font-size: 18px;
        line-height: 23.4px;
    }
}

/* Inline mnemonics inside heading */
merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic {
    display: inline-flex;
    --mod-img-width: 20px;
    --mod-img-height: 20px;
    margin-right: 8px;
    align-items: center;
    vertical-align: middle;
    padding-bottom: 3px;
}

merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

/* Icons slot styling */
merch-card[variant="full-pricing-express"] [slot="icons"] {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
}

/* Premium/crown icon sizing on mobile and tablet (14x14px) */
@media (max-width: 1199px) {
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] merch-icon,
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic merch-icon,
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic {
        --mod-img-width: 14px;
        --mod-img-height: 14px;
        vertical-align: baseline;
    }

    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic img {
        width: 14px;
        height: 14px;
    }
}


merch-card[variant="full-pricing-express"] [slot="trial-badge"] {
    position: absolute;
    top: -8px;
    right: 16px;
    font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
    font-weight: var(--merch-card-full-pricing-express-trial-badge-font-weight);
    line-height: var(--merch-card-full-pricing-express-trial-badge-line-height);
    white-space: nowrap;
    z-index: 0;
    max-width: calc(100% - 24px);
    text-align: right;
}

merch-card[variant="full-pricing-express"] [slot="trial-badge"] merch-badge {
    font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
    font-weight: var(--merch-card-full-pricing-express-trial-badge-font-weight);
    line-height: var(--merch-card-full-pricing-express-trial-badge-line-height);
    color: var(--spectrum-express-accent);
    border-radius: 4px;
}

merch-card[variant="full-pricing-express"] [slot="trial-badge"]:empty {
    display: none;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] {
    font-size: 16px;
    line-height: 20.8px;
    color: var(--spectrum-gray-900);
}

merch-card[variant="full-pricing-express"] [slot="body-s"] hr {
    margin-top: 16px;
    margin-bottom: 24px;
    background-color: #E9E9E9;
}

merch-card[variant="full-pricing-express"] [slot="shortDescription"] {
    font-size: 16px;
    line-height: 20.8px;
    color: var(--spectrum-gray-700);
    margin-bottom: var(--merch-card-full-pricing-express-section-gap);
}

merch-card[variant="full-pricing-express"] [slot="body-s"] ul {
    margin: 0;
    padding-left: 20px;
    list-style: disc;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] li {
    margin-bottom: 8px;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] li:last-child {
    margin-bottom: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p {
    padding: 8px;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: underline;
}

/* Feature list hyperlinks should be underlined */
merch-card[variant="full-pricing-express"] [slot="body-s"] ul a,
merch-card[variant="full-pricing-express"] [slot="body-s"] li a,
merch-card[variant="full-pricing-express"] [slot="body-xs"] a {
    color: var(--spectrum-indigo-900);
    text-decoration: underline;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] .button-container {
    margin: 0;
    padding: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p:last-child a {
    text-decoration: none;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column;
    color: var(--spectrum-indigo-900);
    background: transparent;
    border: none;
    margin: 0;
    font-size: 16px;
    padding-top: 0;
}

merch-card[variant="full-pricing-express"] [slot="body-s"] p:last-child a:hover {
    background-color: initial;
    border: none;
}

/* Price styling */
merch-card[variant="full-pricing-express"] [slot="price"] {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
}

merch-card[variant="full-pricing-express"] [slot="price"] p strong {
    display: inline-flex;
    justify-content: center;
    width: 100%;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p:first-child {
    display: flex;
    align-items: baseline;
    margin: 0;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p span[is="inline-price"]:first-child {
    margin-right: 8px;
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template="optical"] {
    font-size: var(--merch-card-full-pricing-express-price-font-size);
    color: var(--spectrum-gray-800);
}

merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough .price-decimals {
    font-size: 28px;
    font-weight: 700;
    line-height: 36.4px;
}

merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-symbol,
merch-card[variant="full-pricing-express"] [slot="price"] .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-space,
merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals {
    font-size: var(--merch-card-full-pricing-express-price-font-size);
    font-weight: var(--merch-card-full-pricing-express-price-font-weight);
    line-height: var(--merch-card-full-pricing-express-price-line-height);
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"] .price-recurrence,
merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"] .price-unit-type {
    font-size: 12px;
    font-weight: bold;
    line-height: 15.6px;
    color: #222;
}

merch-card[variant="full-pricing-express"] [slot="price"] p {
    font-size: 12px;
    font-weight: 400;
    line-height: 15.6px;
    color: var(--spectrum-gray-700);
}

merch-card[variant="full-pricing-express"] [slot="price"] > p span[is="inline-price"]:only-child {
    color: rgb(34,34,34);
}

/* Target inline prices in paragraphs that are not the first paragraph */
merch-card[variant="full-pricing-express"] [slot="price"] > p:not(:first-child) span[is="inline-price"] {
    font-size: 12px;
    font-weight: 500;
    line-height: 15.6px;
    margin-right: 0;
}

merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-currency-symbol,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-integer,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-decimals,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-recurrence,
merch-card[variant="full-pricing-express"] [slot="price"] > p:nth-child(3) span[is="inline-price"] .price-unit-type {
    font-size: 12px;
    font-weight: normal;
    line-height: 15.6px;
}

merch-card[variant="full-pricing-express"] [slot="price"] p a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: none;
}

/* Callout content styling - inside price container */
merch-card[variant="full-pricing-express"] [slot="callout-content"] {
    color: var(--spectrum-gray-800);
    width: 100%;
    gap: 12px;
    margin: 0;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] span[is='inline-price'] {
    font-weight: inherit;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] > p {
    background: transparent;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    padding: 0;
}

merch-card[variant="full-pricing-express"] [slot="callout-content"] a {
    color: var(--spectrum-indigo-900);
    font-weight: 700;
    text-decoration: inherit;
}

/* Strikethrough price styling */
merch-card[variant="full-pricing-express"] span[is="inline-price"] .price-unit-type,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-strikethrough,
merch-card[variant="full-pricing-express"] span.placeholder-resolved[data-template='strikethrough'],
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
    text-decoration: none;
    font-size: 12px;
    line-height: 15.6px;
}

merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough {
    color: #8F8F8F;
}

merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template='strikethrough'] + span[is="inline-price"],
merch-card[variant="full-pricing-express"] [slot="price"] span[is="inline-price"][data-template='strikethrough'] ~ strong {
    color: #222222;
}

merch-card[variant="full-pricing-express"] [slot="price"] p .heading-xs,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-s,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-m,
merch-card[variant="full-pricing-express"] [slot="price"] p .heading-l {
    font-size: 22px;
    line-height: 28.6px;
    text-align: center;
    width: 100%;
}

merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-integer,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='strikethrough'] .price-decimals,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-integer,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals-delimiter,
merch-card[variant="full-pricing-express"] span[is="inline-price"][data-template='price'] .price-strikethrough .price-decimals {
    text-decoration: line-through;
    text-decoration-thickness: 2px;
}

/* CTA button styling */
merch-card[variant="full-pricing-express"] [slot="cta"] {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

merch-card[variant="full-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="full-pricing-express"] [slot="cta"] button,
merch-card[variant="full-pricing-express"] [slot="cta"] a.con-button,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button {
    --mod-button-height: 40px;
    --mod-button-top-to-text: 9px;
    --mod-button-bottom-to-text: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    font-weight: 700;
    font-size: 16px;
    line-height: 20.8px;
    margin: 0;
    padding: 0 24px;
    border-radius: 26px;
    height: 40px;
}

merch-card[variant="full-pricing-express"] [slot="cta"] sp-button[variant="accent"],
merch-card[variant="full-pricing-express"] [slot="cta"] button.spectrum-Button--accent,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent {
    background-color: var(--spectrum-indigo-900);
    color: var(--spectrum-white, #ffffff);
    width: 100%;
}

/* Ensure text color is applied to the label span element for accessibility */
merch-card[variant="full-pricing-express"] [slot="cta"] sp-button[variant="accent"] .spectrum-Button-label,
merch-card[variant="full-pricing-express"] [slot="cta"] button.spectrum-Button--accent .spectrum-Button-label,
merch-card[variant="full-pricing-express"] [slot="cta"] a.spectrum-Button.spectrum-Button--accent .spectrum-Button-label {
    color: var(--spectrum-white, #ffffff);
}

/* Badge styling */
merch-card[variant="full-pricing-express"] merch-badge {
    white-space: nowrap;
    color: var(--spectrum-white);
    font-size: 16px;
    font-weight: bold;
    line-height: 20.8px;
}

/* Mobile-specific selective display of body-s (under 768px) */
@media (max-width: 767px) {
    /* Show body-s container */
    merch-card[variant="full-pricing-express"] [slot="body-s"] {
        display: block;
    }

    /* Hide all direct children by default */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > * {
        display: none;
    }

    /* Show only the last hr (2nd one) */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > hr:last-of-type {
        display: block;
        margin: 24px 0;
    }

    /* Show only the button container (last p tag) */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p:last-child {
        display: block;
    }

    merch-card[variant="full-pricing-express"] {
        width: 100%;
        max-width: 100%;
    }

    /* Price font size on mobile */
    merch-card[variant="full-pricing-express"] [slot="price"] .price-currency-symbol,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-integer,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals-delimiter,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-decimals,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-recurrence,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-strikethrough,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-unit-type,
    merch-card[variant="full-pricing-express"] [slot="price"] .price-tax-inclusivity {
        font-size: 22px;
    }

    /* Badge alignment on mobile */
    merch-card[variant="full-pricing-express"] [slot="badge"] {
        font-size: 16px;
        font-weight: 400;
    }

    /* Trial badge alignment on mobile */
    merch-card[variant="full-pricing-express"] [slot="trial-badge"] {
        margin-left: 0;
        align-self: flex-start;
    }

    merch-card[variant="full-pricing-express"] [slot="trial-badge"] merch-badge {
        font-size: 12px;
        line-height: 20.8px;
    }
}

/* Hide screen reader only text */
merch-card[variant="full-pricing-express"] sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* mas-tooltip inline styles for full-pricing-express */
merch-card[variant="full-pricing-express"] mas-tooltip {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-right: 8px;
    overflow: visible;
    padding-top: 16px;
}

/* mas-mnemonic inline styles for full-pricing-express */
merch-card[variant="full-pricing-express"] mas-mnemonic {
    display: inline-block;
    align-items: center;
    vertical-align: baseline;
    margin-right: 8px;
    overflow: visible;
    --mas-mnemonic-tooltip-padding: 4px 8px;
}

/* Desktop - fixed heights for alignment */
@media (min-width: 1025px) {
    merch-card[variant="full-pricing-express"] [slot="short-description"] {
        min-height: var(--consonant-merch-card-full-pricing-express-short-description-height);
    }

    merch-card[variant="full-pricing-express"] [slot="cta"] {
        min-height: var(--consonant-merch-card-full-pricing-express-cta-height);
    }
}

/* Responsive rules for tablet and desktop (768px+) */
@media (min-width: 768px) {
    merch-card[variant="full-pricing-express"] [slot="body-s"] {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    merch-card[variant="full-pricing-express"] [slot="body-s"] p:first-child {
        padding: 16px 8px;
    }

    /* Ensure the second divider wrapper stays at bottom with proper spacing */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > hr:last-of-type {
        margin-top: auto;
        padding-top: 24px;
        margin-bottom: 16px;
        border: none;
        border-bottom: 1px solid #E9E9E9;
        height: 0;
        background: transparent;
    }

    /* Ensure the button container stays at the bottom */
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p.button-container,
    merch-card[variant="full-pricing-express"] [slot="body-s"] > p:last-child {
        margin-top: 0;
        margin-bottom: 0;
    }
}
`;

// src/variants/full-pricing-express.js
var FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
  title: {
    tag: "h3",
    slot: "heading-xs",
    maxCount: 250,
    withSuffix: true
  },
  badge: {
    tag: "div",
    slot: "badge",
    default: "spectrum-blue-400"
  },
  allowedBadgeColors: [
    "spectrum-blue-400",
    "spectrum-gray-300",
    "spectrum-yellow-300",
    "gradient-purple-blue",
    "gradient-firefly-spectrum"
  ],
  description: {
    tag: "div",
    slot: "body-s",
    maxCount: 2e3,
    withSuffix: false
  },
  shortDescription: {
    tag: "div",
    slot: "short-description",
    maxCount: 3e3,
    withSuffix: false
  },
  callout: {
    tag: "div",
    slot: "callout-content",
    editorLabel: "Price description"
  },
  prices: {
    tag: "div",
    slot: "price"
  },
  trialBadge: {
    tag: "div",
    slot: "trial-badge"
  },
  ctas: {
    slot: "cta",
    size: "XL"
  },
  mnemonics: {
    size: "xs"
  },
  borderColor: {
    attribute: "border-color",
    specialValues: {
      gray: "var(--spectrum-gray-300)",
      blue: "var(--spectrum-blue-400)",
      "gradient-purple-blue": "linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)",
      "gradient-firefly-spectrum": "linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)"
    }
  },
  showAllSpectrumColors: true,
  multiWhatsIncluded: "true",
  disabledAttributes: []
};
var FullPricingExpress = class extends VariantLayout {
  getGlobalCSS() {
    return CSS12;
  }
  get aemFragmentMapping() {
    return FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
  }
  get headingSelector() {
    return '[slot="heading-xs"]';
  }
  get badgeElement() {
    return this.card.querySelector('[slot="badge"]');
  }
  get badge() {
    return html13`
            <div
                class="badge-wrapper"
                style="${this.badgeElement ? "" : "visibility: hidden"}"
            >
                <slot name="badge"></slot>
            </div>
        `;
  }
  syncHeights() {
    if (this.card.getBoundingClientRect().width <= 2) return;
    ["short-description", "cta"].forEach(
      (slot) => this.updateCardElementMinHeight(
        this.card.querySelector(`[slot="${slot}"]`),
        slot
      )
    );
    this.updateCardElementMinHeight(
      this.card.shadowRoot?.querySelector(".price-container"),
      "price"
    );
  }
  async postCardUpdateHook() {
    if (!this.card.isConnected) return;
    await this.card.updateComplete;
    await Promise.all(this.card.prices.map((price) => price.onceSettled()));
    if (window.matchMedia("(min-width: 1025px)").matches) {
      const container = this.getContainer();
      if (!container) return;
      const prefix = `--consonant-merch-card-${this.card.variant}`;
      const hasExistingVars = container.style.getPropertyValue(
        `${prefix}-price-height`
      );
      if (!hasExistingVars) {
        requestAnimationFrame(() => {
          const cards = container.querySelectorAll(
            `merch-card[variant="${this.card.variant}"]`
          );
          cards.forEach(
            (card) => card.variantLayout?.syncHeights?.()
          );
        });
      } else {
        requestAnimationFrame(() => {
          this.syncHeights();
        });
      }
    }
  }
  renderLayout() {
    return html13`
            ${this.badge}
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <div class="icons">
                        <slot name="icons"></slot>
                    </div>
                </div>
                <div class="short-description">
                    <slot name="short-description"></slot>
                </div>
                <div class="price-container">
                    <slot name="trial-badge"></slot>
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
                <div class="description">
                    <slot name="body-s"></slot>
                </div>
            </div>
            <slot></slot>
        `;
  }
};
__publicField(FullPricingExpress, "variantStyle", css12`
        :host([variant='full-pricing-express']) {
            /* CSS Variables */
            --merch-card-full-pricing-express-width: 437px;
            --merch-card-full-pricing-express-mobile-width: 303px;
            --merch-card-full-pricing-express-padding: 24px;
            --merch-card-full-pricing-express-padding-mobile: 20px;
            --merch-card-full-pricing-express-section-gap: 24px;
            --express-custom-gray-500: #8f8f8f;
            --express-custom-gray-400: #d5d5d5;
            --express-custom-price-border: #e0e2ff;

            /* Price container specific */
            --merch-card-full-pricing-express-price-bg: #f8f8f8;
            --merch-card-full-pricing-express-price-radius: 8px;

            /* Typography - matching simplified-pricing-express */
            --merch-card-full-pricing-express-trial-badge-font-size: 12px;
            --merch-card-full-pricing-express-trial-badge-font-weight: 700;
            --merch-card-full-pricing-express-trial-badge-line-height: 15.6px;
            --merch-card-full-pricing-express-price-font-size: 28px;
            --merch-card-full-pricing-express-price-line-height: 36.4px;
            --merch-card-full-pricing-express-price-font-weight: 700;
            --merch-card-full-pricing-express-cta-font-size: 18px;
            --merch-card-full-pricing-express-cta-font-weight: 700;
            --merch-card-full-pricing-express-cta-line-height: 23.4px;

            /* Accent color */
            --spectrum-express-accent: #5258e4;
            --spectrum-express-indigo-300: #d3d5ff;
            --spectrum-express-white: #ffffff;

            /* Gradient definitions (reused) */
            --gradient-purple-blue: linear-gradient(
                96deg,
                #b539c8 0%,
                #7155fa 66%,
                #3b63fb 100%
            );
            --gradient-firefly-spectrum: linear-gradient(
                96deg,
                #d73220 0%,
                #d92361 33%,
                #7155fa 100%
            );

            width: var(--merch-card-full-pricing-express-width);
            max-width: var(--merch-card-full-pricing-express-width);
            background: transparent;
            border: none;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
            position: relative;
        }

        /* Badge wrapper styling (same as simplified) */
        :host([variant='full-pricing-express']) .badge-wrapper {
            padding: 4px 12px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            line-height: 20.8px;
            color: var(--spectrum-gray-800);
            position: relative;
            min-height: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        :host([variant='full-pricing-express']) .icons {
            display: flex;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--spectrum-black);
        }

        /* Card content styling */
        :host([variant='full-pricing-express']) .card-content {
            border-radius: 8px;
            padding: var(--merch-card-full-pricing-express-padding);
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        :host([variant='full-pricing-express']) .card-content > * {
            position: relative;
        }

        /* Regular border styling */
        :host([variant='full-pricing-express']:not([gradient-border='true']))
            .card-content {
            background: var(--spectrum-gray-50);
            border: 1px solid #d5d5d5;
        }

        /* When badge exists, adjust card content border radius */
        :host([variant='full-pricing-express']:has([slot='badge']:not(:empty)))
            .card-content {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        /* When badge exists with regular border, ensure top border */
        :host(
                [variant='full-pricing-express']:not(
                        [gradient-border='true']
                    ):has([slot='badge']:not(:empty))
            )
            .card-content {
            border-top: 1px solid
                var(
                    --consonant-merch-card-border-color,
                    var(--spectrum-gray-100)
                );
        }

        /* When badge has content, ensure seamless connection */
        :host([variant='full-pricing-express']:has([slot='badge']:not(:empty)))
            .badge-wrapper {
            margin-bottom: -2px;
        }

        /* Gradient border styling (reused from simplified) */
        :host([variant='full-pricing-express'][gradient-border='true'])
            .badge-wrapper {
            border: none;
            margin-bottom: -6px;
            padding-bottom: 6px;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .badge-wrapper
            ::slotted(*) {
            color: white;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .card-content {
            border: none;
            padding: calc(var(--merch-card-full-pricing-express-padding) + 2px);
            border-radius: 8px;
        }

        :host([variant='full-pricing-express'][gradient-border='true'])
            .card-content::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            right: 1px;
            bottom: 1px;
            background: var(--spectrum-express-white, #ffffff);
            border-radius: 7px;
            z-index: 0;
            pointer-events: none;
        }

        /* Gradient backgrounds */
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .badge-wrapper,
        :host(
                [variant='full-pricing-express'][border-color='gradient-purple-blue']
            )
            .card-content {
            background: var(--gradient-purple-blue);
        }

        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .badge-wrapper,
        :host(
                [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
            )
            .card-content {
            background: var(--gradient-firefly-spectrum);
        }

        :host(
                [variant='full-pricing-express'][gradient-border='true']:has(
                        [slot='badge']:not(:empty)
                    )
            )
            .card-content::before {
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
        }

        /* Header styling */
        :host([variant='full-pricing-express']) .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        :host([variant='full-pricing-express']) [slot='heading-xs'] {
            font-size: 18px;
            font-weight: 700;
            line-height: 23.4px;
            color: var(--spectrum-gray-800);
        }

        /* Icons/Mnemonics styling */
        :host([variant='full-pricing-express']) [slot='icons'] {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }

        :host([variant='full-pricing-express']) .icons ::slotted(merch-icon) {
            --mod-img-width: auto;
            --mod-img-height: 18px;
            align-self: flex-end;
        }

        :host([variant='full-pricing-express'])
            .icons
            ::slotted(merch-icon:nth-of-type(2)) {
            --mod-img-height: 14px;
            height: 14px;
        }

        /* Description sections */
        :host([variant='full-pricing-express']) .description {
            display: flex;
            flex-direction: column;
        }

        /* Price container with background */
        :host([variant='full-pricing-express']) .price-container {
            background: var(--merch-card-full-pricing-express-price-bg);
            padding: 24px 16px;
            border-radius: var(--merch-card-full-pricing-express-price-radius);
            border: 1px solid var(--express-custom-price-border);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: visible;
            margin-bottom: var(--merch-card-full-pricing-express-section-gap);
            justify-content: center;
            align-items: center;
            min-height: var(
                --consonant-merch-card-full-pricing-express-price-height
            );
        }

        :host([variant='full-pricing-express']) [slot='callout-content'] {
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 18px;
            color: var(--spectrum-gray-800);
            text-align: center;
            background: transparent;
        }

        /* CTA styling */
        :host([variant='full-pricing-express']) .cta,
        :host([variant='full-pricing-express']) .cta ::slotted(*) {
            width: 100%;
            display: block;
        }

        /* Mobile and tablet styles */
        @media (max-width: 1199px) {
            :host([variant='full-pricing-express']) {
                width: 100%;
                max-width: 100%;
            }

            :host([variant='full-pricing-express']) .card-content {
                padding: 24px 16px;
            }

            :host([variant='full-pricing-express'][gradient-border='true'])
                .card-content {
                padding: 26px 18px;
            }

            :host([variant='full-pricing-express']) .short-description {
                padding: 24px 0;
            }
        }

        /* Desktop - fixed heights for alignment */
        @media (min-width: 1025px) {
            :host([variant='full-pricing-express']) .card-content {
                height: 100%;
            }

            :host([variant='full-pricing-express']) .description {
                flex: 1;
            }

            :host([variant='full-pricing-express']) .cta {
                margin-bottom: 24px;
            }

            :host([variant='full-pricing-express']) .short-description {
                margin-bottom: 24px;
            }
        }
    `);

// src/variants/headless.js
import { html as html14, css as css13, nothing as nothing4 } from "./lit-all.min.js";

// src/variants/headless.css.js
var CSS13 = `
/* Headless variant: minimal container for label/value rows */
.headless {
    display: flex;
    flex-direction: column;
    padding: var(--consonant-merch-spacing-xs, 8px);
}
`;

// src/variants/headless.js
var HEADLESS_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "p", slot: "heading-xs" },
  cardTitle: { tag: "p", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "body-xxs" },
  description: { tag: "div", slot: "body-xs" },
  promoText: { tag: "p", slot: "promo-text" },
  shortDescription: { tag: "p", slot: "short-description" },
  callout: { tag: "div", slot: "callout-content" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  whatsIncluded: { tag: "div", slot: "whats-included" },
  addonConfirmation: { tag: "div", slot: "addon-confirmation" },
  badge: { tag: "div", slot: "badge" },
  trialBadge: { tag: "div", slot: "trial-badge" },
  prices: { tag: "p", slot: "prices" },
  backgroundImage: { tag: "div", slot: "bg-image" },
  ctas: { slot: "footer", size: "m" },
  addon: true,
  secureLabel: true,
  borderColor: { attribute: "border-color" },
  backgroundColor: { attribute: "background-color" },
  size: [],
  mnemonics: { size: "m" }
};
var HEADLESS_FIELDS = [
  { slot: "bg-image", label: "Background Image" },
  { slot: "badge", label: "Badge" },
  { slot: "icons", label: "Mnemonic icon" },
  { slot: "heading-xs", label: "Title" },
  { slot: "body-xxs", label: "Subtitle" },
  { slot: "body-xs", label: "Product description" },
  { slot: "promo-text", label: "Promo Text" },
  { slot: "callout-content", label: "Callout text" },
  { slot: "short-description", label: "Short Description" },
  { slot: "trial-badge", label: "Trial Badge" },
  { slot: "prices", label: "Product price" },
  { slot: "quantity-select", label: "Quantity select" },
  { slot: "addon", label: "Addon" },
  { slot: "whats-included", label: "What's included" },
  { slot: "addon-confirmation", label: "Addon confirmation" },
  { slot: "footer", label: "CTAs" }
];
var Headless = class extends VariantLayout {
  constructor(card) {
    super(card);
  }
  getGlobalCSS() {
    return CSS13;
  }
  renderLayout() {
    return html14`
            <div class="headless">
                ${HEADLESS_FIELDS.map(
      ({ slot, label }) => html14`
                        <div class="headless-row">
                            <span class="headless-label">${label}</span>
                            <span class="headless-value">
                                <slot name="${slot}"></slot>
                            </span>
                        </div>
                    `
    )}
                ${this.card.secureLabel ? html14`
                          <div class="headless-row">
                              <span class="headless-label">Secure label</span>
                              <span class="headless-value">
                                  ${this.secureLabel}
                              </span>
                          </div>
                      ` : nothing4}
            </div>
        `;
  }
};
__publicField(Headless, "variantStyle", css13`
        :host([variant='headless']) {
            border: none;
            background: transparent;
            box-shadow: none;
        }
        :host([variant='headless']) .headless {
            display: flex;
            flex-direction: column;
            padding: var(--consonant-merch-spacing-xs, 8px);
        }
        :host([variant='headless']) .headless-row {
            display: flex;
            gap: var(--consonant-merch-spacing-xs, 8px);
            padding: var(--consonant-merch-spacing-xxs, 4px) 0;
        }
        :host([variant='headless']) .headless-label {
            flex-shrink: 0;
            font-weight: 600;
            min-width: 8em;
        }
        :host([variant='headless']) .headless-value {
            flex: 1;
        }
        :host([variant='headless']) .headless-value::slotted(*) {
            display: inline;
        }
    `);

// src/variants/mini.js
import { css as css14, html as html15 } from "./lit-all.min.js";

// src/variants/mini.css.js
var CSS14 = `
merch-card[variant="mini"] {
  color: var(--spectrum-body-color);
  width: 400px;
  height: 250px;
}

merch-card[variant="mini"] .price-tax-inclusivity::before {
  content: initial;
}

merch-card[variant="mini"] [slot="title"] {
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
}

merch-card[variant="mini"] [slot="legal"] {
    min-height: 17px;
}

merch-card[variant="mini"] [slot="ctas"] {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: end;
  justify-content: end;
}

merch-card[variant="mini"] span.promo-duration-text,
merch-card[variant="mini"] span.renewal-text {
    display: block;
}
`;

// src/variants/mini.js
var MINI_AEM_FRAGMENT_MAPPING = {
  title: { tag: "p", slot: "title" },
  prices: { tag: "p", slot: "prices" },
  description: {
    tag: "p",
    slot: "description"
  },
  planType: true,
  ctas: { slot: "ctas", size: "S" }
};
var Mini = class extends VariantLayout {
  constructor() {
    super(...arguments);
    __publicField(this, "legal");
  }
  async postCardUpdateHook() {
    await this.card.updateComplete;
    this.adjustLegal();
  }
  getGlobalCSS() {
    return CSS14;
  }
  get headingSelector() {
    return '[slot="title"]';
  }
  priceOptionsProvider(element, options) {
    options.literals = {
      ...options.literals,
      strikethroughAriaLabel: "",
      alternativePriceAriaLabel: ""
    };
    options.space = true;
    options.displayAnnual = this.card.settings?.displayAnnual ?? false;
  }
  adjustLegal() {
    if (this.legal !== void 0) return;
    const price = this.card.querySelector(
      `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    if (!price) return;
    const legal = price.cloneNode(true);
    this.legal = legal;
    price.dataset.displayTax = "false";
    price.dataset.displayPerUnit = "false";
    legal.dataset.template = "legal";
    legal.dataset.displayPlanType = this.card?.settings?.displayPlanType ?? true;
    legal.setAttribute("slot", "legal");
    this.card.appendChild(legal);
  }
  renderLayout() {
    return html15`
            ${this.badge}
            <div class="body">
                <slot name="title"></slot>
                <slot name="prices"></slot>
                <slot name="legal"></slot>
                <slot name="description"></slot>
                <slot name="ctas"></slot>
            </div>
        `;
  }
};
__publicField(Mini, "variantStyle", css14`
        :host([variant='mini']) {
            min-width: 209px;
            min-height: 103px;
            background-color: var(--spectrum-background-base-color);
            border: 1px solid var(--consonant-merch-card-border-color, #dadada);
        }
    `);

// src/variants/variants.js
var variantRegistry = /* @__PURE__ */ new Map();
var registerVariant = (name, variantClass, fragmentMapping = null, style = null, collectionOptions) => {
  variantRegistry.set(name, {
    class: variantClass,
    fragmentMapping,
    style,
    collectionOptions
  });
};
registerVariant(
  "catalog",
  Catalog,
  CATALOG_AEM_FRAGMENT_MAPPING,
  Catalog.variantStyle
);
registerVariant("image", Image);
registerVariant("inline-heading", InlineHeading);
registerVariant(
  "mini-compare-chart",
  MiniCompareChart,
  MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING,
  MiniCompareChart.variantStyle
);
registerVariant(
  "mini-compare-chart-mweb",
  MiniCompareChartMweb,
  MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING,
  MiniCompareChartMweb.variantStyle
);
registerVariant(
  "plans",
  Plans,
  PLANS_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant(
  "plans-students",
  Plans,
  PLANS_STUDENTS_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant(
  "plans-education",
  Plans,
  PLANS_EDUCATION_AEM_FRAGMENT_MAPPING,
  Plans.variantStyle,
  Plans.collectionOptions
);
registerVariant(
  "plans-v2",
  PlansV2,
  PLANS_V2_AEM_FRAGMENT_MAPPING,
  PlansV2.variantStyle,
  PlansV2.collectionOptions
);
registerVariant(
  "product",
  Product,
  PRODUCT_AEM_FRAGMENT_MAPPING,
  Product.variantStyle
);
registerVariant(
  "segment",
  Segment,
  SEGMENT_AEM_FRAGMENT_MAPPING,
  Segment.variantStyle
);
registerVariant("media", Media2, MEDIA_AEM_FRAGMENT_MAPPING, Media2.variantStyle);
registerVariant(
  "headless",
  Headless,
  HEADLESS_AEM_FRAGMENT_MAPPING,
  Headless.variantStyle
);
registerVariant(
  "special-offers",
  SpecialOffer,
  SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING,
  SpecialOffer.variantStyle
);
registerVariant(
  "simplified-pricing-express",
  SimplifiedPricingExpress,
  SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
  SimplifiedPricingExpress.variantStyle
);
registerVariant(
  "full-pricing-express",
  FullPricingExpress,
  FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
  FullPricingExpress.variantStyle
);
registerVariant("mini", Mini, MINI_AEM_FRAGMENT_MAPPING, Mini.variantStyle);
registerVariant("image", Image, IMAGE_AEM_FRAGMENT_MAPPING, Image.variantStyle);
function getFragmentMapping(variant) {
  return variantRegistry.get(variant)?.fragmentMapping;
}

// src/variants/variant-layout.js
var _container;
var _VariantLayout = class _VariantLayout {
  constructor(card) {
    __publicField(this, "card");
    __privateAdd(this, _container);
    this.card = card;
    this.insertVariantStyle();
  }
  getContainer() {
    __privateSet(this, _container, __privateGet(this, _container) ?? this.card.closest(
      'merch-card-collection, [class*="-merch-cards"]'
    ) ?? this.card.parentElement);
    return __privateGet(this, _container);
  }
  insertVariantStyle() {
    const styleKey = this.constructor.name;
    if (!_VariantLayout.styleMap[styleKey]) {
      _VariantLayout.styleMap[styleKey] = true;
      const styles = document.createElement("style");
      styles.innerHTML = this.getGlobalCSS();
      document.head.appendChild(styles);
    }
  }
  updateCardElementMinHeight(el, name) {
    if (!el || this.card.heightSync === false) return;
    const elMinHeightPropertyName = `--consonant-merch-card-${this.card.variant}-${name}-height`;
    const height = Math.max(
      0,
      parseInt(window.getComputedStyle(el).height) || 0
    );
    const container = this.getContainer();
    const maxMinHeight = parseInt(
      container.style.getPropertyValue(elMinHeightPropertyName)
    ) || 0;
    if (height > maxMinHeight) {
      container.style.setProperty(elMinHeightPropertyName, `${height}px`);
    }
  }
  get badge() {
    let additionalStyles;
    if (!this.card.badgeBackgroundColor || !this.card.badgeColor || !this.card.badgeText) {
      return;
    }
    if (this.evergreen) {
      additionalStyles = `border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`;
    }
    return html16`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${additionalStyles}"
            >
                ${this.card.badgeText}
            </div>
        `;
  }
  get cardImage() {
    return html16` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`;
  }
  /* c8 ignore next 3 */
  getGlobalCSS() {
    return "";
  }
  /* c8 ignore next 3 */
  get theme() {
    return document.querySelector("sp-theme");
  }
  get evergreen() {
    return this.card.classList.contains("intro-pricing");
  }
  get promoBottom() {
    return this.card.classList.contains("promo-bottom");
  }
  get headingSelector() {
    return '[slot="heading-xs"]';
  }
  get secureLabel() {
    return this.card.secureLabel ? html16`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >` : nothing5;
  }
  get secureLabelFooter() {
    return html16`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`;
  }
  async postCardUpdateHook() {
  }
  connectedCallbackHook() {
  }
  disconnectedCallbackHook() {
  }
  syncHeights() {
  }
  /* c8 ignore next 3 */
  renderLayout() {
  }
  get aemFragmentMapping() {
    return getFragmentMapping(this.card.variant);
  }
};
_container = new WeakMap();
__publicField(_VariantLayout, "styleMap", {});
var VariantLayout = _VariantLayout;

// src/variants/mini-compare-chart.css.js
var CSS15 = `
  :root {
    --consonant-merch-card-mini-compare-chart-icon-size: 32px;
    --consonant-merch-card-mini-compare-border-color: #E9E9E9;
    --consonant-merch-card-mini-compare-mobile-cta-font-size: 16px;
    --consonant-merch-card-mini-compare-mobile-cta-width: 75px;
    --consonant-merch-card-mini-compare-badge-mobile-max-width: 50px;
    --consonant-merch-card-mini-compare-mobile-price-font-size: 32px;
    --consonant-merch-card-card-mini-compare-mobile-background-color: #F8F8F8;
    --consonant-merch-card-card-mini-compare-mobile-spacing-xs: 12px;
    --consonant-merch-card-mini-compare-chart-heading-m-price-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] {
    background: linear-gradient(#FFFFFF, #FFFFFF) padding-box, var(--consonant-merch-card-border-color, #E9E9E9) border-box;
    border: 1px solid transparent;
  }

  merch-card[variant="mini-compare-chart"] merch-badge {
    position: absolute;
    top: 16px;
    inset-inline-start: auto;
    inset-inline-end: 0;
  }
   merch-card[variant="mini-compare-chart"] div[class$='-badge'] {
     font-size: 14px;
   }

  merch-card[variant="mini-compare-chart"] div[class$='-badge']:dir(rtl) {
    left: 0;
    right: initial;
    padding: 8px 11px;
    border-radius: 0 5px 5px 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    padding: 0 var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-xs"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    font-size: var(--consonant-merch-card-heading-m-font-size);
    line-height: var(--consonant-merch-card-heading-m-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    padding-inline-start: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-inline-end: 8px;
    border-radius: 10px;
    font-family: var(--merch-body-font-family, 'Adobe Clean');
    margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) .5rem;
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    background: linear-gradient(211deg, rgb(245, 246, 253) 33.52%, rgb(248, 241, 248) 67.33%, rgb(249, 233, 237) 110.37%);
  }

  merch-card[variant="mini-compare-chart"] merch-addon [is="inline-price"] {
    min-height: unset;
    font-weight: bold;
    pointer-events: none;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(checkbox) {
      height: 18px;
      width: 18px;
      margin: 14px 12px 0 8px;
  }

  merch-card[variant="mini-compare-chart"] merch-addon::part(label) {
    display: flex;
    flex-direction: column;
    padding: 8px 4px 8px 0;
    width: 100%;
  }

  merch-card[variant="mini-compare-chart"] [is="inline-price"] {
    display: inline-block;
    min-height: 30px;
    line-height: 30px;
    min-width: 1px;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"]  {
    min-height: 30px;
    line-height: 30px;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] [is="inline-price"][data-template="legal"] {
    display: inline;
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] .price-plan-type {
    display: block;
    font-size: var(--consonant-merch-card-body-xs-font-size);
		font-style: italic;
		font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row {
    flex-direction: row;
    align-items: flex-start;
    padding: 2px 10px 3px;
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] .callout-row .icon-button {
    position: relative;
    top: 2px;
    left: auto;
    flex-shrink: 0;
    align-self: flex-start;
    margin-inline-start: var(--consonant-merch-spacing-xxs);
  }

  merch-card[variant="mini-compare-chart"] [slot="quantity-select"] {
    padding: 0 var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    padding: 0 var(--consonant-merch-spacing-s);
    font-weight: 500;
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
  }

  merch-card[variant="mini-compare-chart"] [slot="callout-content"] [is="inline-price"] {
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    padding: 0 var(--consonant-merch-spacing-s);
    font-style: italic;
  }

  merch-card[variant="mini-compare-chart"] [slot="price-commitment"] a {
    display: inline-block;
    height: 27px;
  }

  merch-card[variant="mini-compare-chart"] [slot="offers"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-xxs"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
  }

  merch-card[variant="mini-compare-chart"] .price-plan-type [slot="body-xxs"] {
    font-style: italic;
    font-weight: normal;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-m-font-size);
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] p {
    margin: 0;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] [is="inline-price"] {
    line-height: var(--consonant-merch-card-body-xs-line-height);
    min-height: unset;
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] a {
    color: var(--color-accent);
    text-decoration: underline;
  }

  merch-card[variant="mini-compare-chart"] a.upt-link {
    color: var(--link-color);
  }


  merch-card[variant="mini-compare-chart"] [slot="body-m"] p {
    margin: 0;
  }

  merch-card[variant="mini-compare-chart"] .action-area {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-wrap: wrap;
    width: 100%;
    gap: var(--consonant-merch-spacing-xxs);
  }

  /* Override merch-whats-included host layout for footer-row display */
  merch-card[variant="mini-compare-chart"] merch-whats-included {
    display: flex;
    flex-direction: column;
    width: 100%;
    row-gap: 0;
  }

  /* Hide heading in footer context */
  merch-card[variant="mini-compare-chart"] merch-whats-included [slot="heading"] {
    display: none;
  }

  /* Icon sizing */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="icon"] merch-icon {
    --mod-img-width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    --mod-img-height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-rows-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-color: var(--merch-color-grey-60);
    font-weight: 700;
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-size: var(--consonant-merch-card-body-s-font-size);
  }

  /* Footer-row-cell layout (legacy footer-rows structure used by DC pages) */
  merch-card[variant="mini-compare-chart"] [slot="footer-rows"] ul {
    margin-block: 0px;
    padding-inline-start: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell {
    border-top: 1px solid var(--consonant-merch-card-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    place-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    margin-block: 0px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon {
    display: flex;
    place-items: center;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon img {
    max-width: initial;
    width: var(--consonant-merch-card-mini-compare-chart-icon-size);
    height: var(--consonant-merch-card-mini-compare-chart-icon-size);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description a {
    color: var(--color-accent);
  }

  /* Style each mnemonic-list as a footer row */
  merch-card[variant="mini-compare-chart"] merch-mnemonic-list {
    width: 100%;
    margin-inline: 0;
    border-top: 1px solid var(--consonant-merch-card-mini-compare-border-color);
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: center;
    padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s);
    box-sizing: border-box;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark img {
    max-width: initial;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-icon-checkmark {
    display: flex;
    align-items: center;
    height: 20px;
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-checkmark {
    display: flex;
    gap: var(--consonant-merch-spacing-xs);
    justify-content: start;
    align-items: flex-start;
    margin-block: var(--consonant-merch-spacing-xxxs);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description-checkmark {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    font-weight: 400;
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] p {
    color: var(--merch-color-grey-80);
    vertical-align: bottom;
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] a {
    color: var(--color-accent);
  }

  merch-card[variant="mini-compare-chart"] .toggle-icon {
    display: flex;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: inherit;
    font: inherit;
    border-radius: 0;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container {
    display: none;
  }

  merch-card[variant="mini-compare-chart"] .checkmark-copy-container.open {
    display: block;
    padding-block-start: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs);
    padding-block-end: 4px;
  }

.one-merch-card.mini-compare-chart {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards.mini-compare-chart,
.three-merch-cards.mini-compare-chart,
.four-merch-cards.mini-compare-chart {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Sections inside tabs/fragments that don't receive the .mini-compare-chart class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
.one-merch-card:has(merch-card[variant="mini-compare-chart"]) .content,
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .content {
  display: contents;
}

.one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  gap: var(--consonant-merch-spacing-xs);
}

.two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
  grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-width));
  gap: var(--consonant-merch-spacing-xs);
}

/* Place compare-plans text-block below all cards in multi-card layouts */
.two-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.three-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block,
.four-merch-cards:has(merch-card[variant="mini-compare-chart"]) .text-block {
  grid-column: 1 / -1;
}

/* bullet list */
merch-card[variant="mini-compare-chart"].bullet-list {
  border-radius: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list:not(.badge-card):not(.mini-compare-chart-badge) {
  border-color: var(--consonant-merch-card-mini-compare-border-color);
}

merch-card[variant="mini-compare-chart"].badge-card {
  border: var(--consonant-merch-card-border);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m"] {
  padding: var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-heading-xxs-font-size);
  line-height: var(--consonant-merch-card-heading-xxs-line-height);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: 0 var(--consonant-merch-spacing-xs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .starting-at {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price {
  font-size: var(--consonant-merch-card-heading-l-font-size);
  line-height: 35px;
  font-weight: 800;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-alternative:has(+ .price-annual-prefix) {
  margin-bottom: 4px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"] {
  min-height: 24px;
  margin-bottom: 2px;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] [data-template="strikethrough"],
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"] .price-strikethrough {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] > .price-annual-prefix::after,
merch-card[variant="mini-compare-chart"].bullet-list [slot="heading-m-price"].annual-price-new-line > span[is="inline-price"] >.price-annual-suffix {
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
  letter-spacing: normal;
  font-style: italic;
}

merch-card[variant="mini-compare-chart"]:not(.bullet-list) p.card-heading[slot="body-xxs"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-s) 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 700;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="promo-text"] a {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] {
  padding: var(--consonant-merch-card-card-mini-compare-mobile-spacing-xs) var(--consonant-merch-spacing-xs) 0;
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="body-m"] p:has(+ p) {
  margin-bottom: 8px;
}

merch-card[variant="mini-compare-chart"] [slot="body-m"] a.spectrum-Link.spectrum-Link--secondary {
  color: inherit;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] {
  padding: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) 0px;
  margin: 0;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="callout-content"] > div > div {
  background-color: #D9D9D9;
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon {
  margin: var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list merch-addon [is="inline-price"] {
  font-weight: 400;
}

merch-card[variant="mini-compare-chart"].bullet-list footer {
  gap: var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list .action-area {
  justify-content: flex-start;
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
  background-color: var(--consonant-merch-card-card-mini-compare-mobile-background-color);
  border-radius: 0 0 var(--consonant-merch-spacing-xxs) var(--consonant-merch-spacing-xxs);
}

merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
  padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
  font-size: var(--consonant-merch-card-body-s-font-size);
  line-height: var(--consonant-merch-card-body-s-line-height);
}

/* mini compare mobile */
@media screen and ${MOBILE_LANDSCAPE} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-width);
    gap: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"] merch-addon {
    box-sizing: border-box;
  }
}

@media screen and ${TABLET_DOWN} {
  merch-card[variant="mini-compare-chart"] [slot="heading-m"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="subtitle"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="heading-m-price"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="body-m"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="promo-text"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
  }

  merch-card[variant="mini-compare-chart"] .footer-row-cell-description {
    font-size: var(--consonant-merch-card-body-xs-font-size);
    line-height: var(--consonant-merch-card-body-xs-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list merch-mnemonic-list [slot="description"] {
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"] [slot="footer"] a.con-button {
    min-width: 66px;
    padding: 4px 18px 5px 21px;
    font-size: var(--consonant-merch-card-mini-compare-mobile-cta-font-size);
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer"] a.con-button {
    padding: 6px 18px 4px;
  }
}
@media screen and ${TABLET_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 302px;
    --consonant-merch-card-mini-compare-chart-wide-width: 302px;
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(2, minmax(var(--consonant-merch-card-mini-compare-chart-width), var(--consonant-merch-card-mini-compare-chart-wide-width)));
  }

   merch-card[variant="mini-compare-chart"].bullet-list [slot="price-commitment"] {
    padding: var(--consonant-merch-spacing-xxxs) var(--consonant-merch-spacing-xs) 0 var(--consonant-merch-spacing-xs);
    font-size: var(--consonant-merch-card-body-s-font-size);
    line-height: var(--consonant-merch-card-body-s-line-height);
    font-weight: 400;
  }

  merch-card[variant="mini-compare-chart"].bullet-list [slot="footer-rows"] {
    padding: var(--consonant-merch-spacing-xs);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-rows-title {
    line-height: var(--consonant-merch-card-body-s-line-height);
  }

  merch-card[variant="mini-compare-chart"].bullet-list .checkmark-copy-container.open {
    padding-block-start: var(--consonant-merch-spacing-xs);
    padding-block-end: 0;
    padding-inline: 0;
  }

  merch-card[variant="mini-compare-chart"].bullet-list .footer-row-cell-checkmark {
    gap: var(--consonant-merch-spacing-xxs);
  }
}

/* desktop */
@media screen and ${DESKTOP_UP} {
  :root {
    --consonant-merch-card-mini-compare-chart-width: 378px;
    --consonant-merch-card-mini-compare-chart-wide-width: 484px;
  }
  .one-merch-card.mini-compare-chart,
  .one-merch-card:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: var(--consonant-merch-card-mini-compare-chart-wide-width);
  }

  .two-merch-cards.mini-compare-chart,
  .two-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(2, var(--consonant-merch-card-mini-compare-chart-wide-width));
    gap: var(--consonant-merch-spacing-m);
  }

  .three-merch-cards.mini-compare-chart,
  .four-merch-cards.mini-compare-chart,
  .three-merch-cards:has(merch-card[variant="mini-compare-chart"]),
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
    grid-template-columns: repeat(3, var(--consonant-merch-card-mini-compare-chart-width));
    gap: var(--consonant-merch-spacing-m);
  }
}

@media screen and ${LARGE_DESKTOP} {
  .four-merch-cards.mini-compare-chart,
  .four-merch-cards:has(merch-card[variant="mini-compare-chart"]) {
      grid-template-columns: repeat(4, var(--consonant-merch-card-mini-compare-chart-width));
  }
}

merch-card[variant="mini-compare-chart"].bullet-list div[slot="footer-rows"]  {
  height: 100%;
}

/* Height sync for legacy footer-row-cell structure (DC pages without mini-compare-chart-mweb variant) */
merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] .footer-row-cell:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(1) {
  min-height: var(--consonant-merch-card-footer-row-1-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(2) {
  min-height: var(--consonant-merch-card-footer-row-2-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(3) {
  min-height: var(--consonant-merch-card-footer-row-3-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(4) {
  min-height: var(--consonant-merch-card-footer-row-4-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(5) {
  min-height: var(--consonant-merch-card-footer-row-5-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(6) {
  min-height: var(--consonant-merch-card-footer-row-6-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(7) {
  min-height: var(--consonant-merch-card-footer-row-7-min-height);
}

merch-card[variant="mini-compare-chart"] merch-mnemonic-list:nth-child(8) {
  min-height: var(--consonant-merch-card-footer-row-8-min-height);
}
`;

// src/variants/mini-compare-chart.js
var FOOTER_ROW_MIN_HEIGHT2 = 32;
var MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING = {
  cardName: { attribute: "name" },
  title: { tag: "h3", slot: "heading-xs" },
  subtitle: { tag: "p", slot: "subtitle" },
  prices: { tag: "p", slot: "heading-m-price" },
  promoText: { tag: "div", slot: "promo-text" },
  shortDescription: { tag: "div", slot: "body-xxs" },
  description: { tag: "div", slot: "body-m" },
  mnemonics: { size: "l" },
  quantitySelect: { tag: "div", slot: "quantity-select" },
  callout: { tag: "div", slot: "callout-content" },
  addon: true,
  secureLabel: true,
  planType: true,
  badgeIcon: true,
  badge: { tag: "div", slot: "badge", default: "spectrum-yellow-300" },
  allowedBadgeColors: [
    "spectrum-yellow-300",
    "spectrum-gray-300",
    "spectrum-gray-700",
    "spectrum-green-900",
    "spectrum-red-700",
    "gradient-purple-blue"
  ],
  allowedBorderColors: [
    "spectrum-yellow-300",
    "spectrum-gray-300",
    "spectrum-green-900",
    "spectrum-red-700",
    "gradient-purple-blue"
  ],
  borderColor: { attribute: "border-color" },
  size: ["wide", "super-wide"],
  whatsIncluded: { tag: "div", slot: "footer-rows" },
  ctas: { slot: "footer", size: "l" },
  style: "consonant"
};
var MiniCompareChart = class extends VariantLayout {
  constructor(card) {
    super(card);
    __publicField(this, "getRowMinHeightPropertyName", (index) => `--consonant-merch-card-footer-row-${index}-min-height`);
    __publicField(this, "getMiniCompareFooter", () => {
      const secureLabel = this.card.secureLabel ? html17`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >` : html17`<slot name="secure-transaction-label"></slot>`;
      if (this.isNewVariant) {
        return html17`<footer>
                ${secureLabel}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`;
      }
      return html17`<footer>${secureLabel}<slot name="footer"></slot></footer>`;
    });
    this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
  }
  connectedCallbackHook() {
    this.card.addEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.boundingClientRect.height === 0) return;
      if (!entry.isIntersecting) return;
      if (!media_default.isMobile) {
        requestAnimationFrame(() => {
          const container = this.getContainer();
          if (!container) return;
          const cards = container.querySelectorAll(
            'merch-card[variant="mini-compare-chart"]'
          );
          cards.forEach(
            (card) => card.variantLayout?.syncHeights?.()
          );
        });
      }
      this.visibilityObserver.disconnect();
    });
    this.visibilityObserver.observe(this.card);
  }
  disconnectedCallbackHook() {
    this.card.removeEventListener(
      EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
      this.updatePriceQuantity
    );
    this.visibilityObserver?.disconnect();
    if (this.calloutListenersAdded) {
      document.removeEventListener("touchstart", this.handleCalloutTouch);
      document.removeEventListener("mouseover", this.handleCalloutMouse);
      const tooltipIcon = this.card.querySelector(
        '[slot="callout-content"] .icon-button'
      );
      tooltipIcon?.removeEventListener(
        "focusin",
        this.handleCalloutFocusin
      );
      tooltipIcon?.removeEventListener(
        "focusout",
        this.handleCalloutFocusout
      );
      tooltipIcon?.removeEventListener(
        "keydown",
        this.handleCalloutKeydown
      );
      this.calloutListenersAdded = false;
    }
  }
  updatePriceQuantity({ detail }) {
    if (!this.mainPrice || !detail?.option) return;
    this.mainPrice.dataset.quantity = detail.option;
  }
  priceOptionsProvider(element, options) {
    if (!this.isNewVariant) return;
    if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
      options.displayPlanType = this.card?.settings?.displayPlanType ?? true;
      return;
    }
    if (element.dataset.template === "strikethrough" || element.dataset.template === "price") {
      options.displayPerUnit = false;
    }
  }
  getGlobalCSS() {
    return CSS15;
  }
  adjustMiniCompareBodySlots() {
    if (this.card.getBoundingClientRect().width <= 2) return;
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector(".top-section"),
      "top-section"
    );
    let slots = [
      "heading-m",
      "subtitle",
      "body-m",
      "heading-m-price",
      "body-xxs",
      "price-commitment",
      "quantity-select",
      "offers",
      "promo-text",
      "callout-content",
      "addon"
    ];
    if (this.card.classList.contains("bullet-list")) {
      slots.push("footer-rows");
    }
    slots.forEach(
      (slot) => this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
        slot
      )
    );
    this.updateCardElementMinHeight(
      this.card.shadowRoot.querySelector("footer"),
      "footer"
    );
    const badge = this.card.shadowRoot.querySelector(
      ".mini-compare-chart-badge"
    );
    if (badge?.textContent !== "") {
      this.getContainer().style.setProperty(
        "--consonant-merch-card-mini-compare-chart-top-section-mobile-height",
        "32px"
      );
    }
  }
  adjustMiniCompareFooterRows() {
    if (this.card.getBoundingClientRect().width === 0) return;
    let rows;
    if (this.isNewVariant) {
      const whatsIncluded = this.card.querySelector(
        "merch-whats-included"
      );
      if (!whatsIncluded) return;
      rows = [
        ...whatsIncluded.querySelectorAll(
          '[slot="content"] merch-mnemonic-list'
        )
      ];
    } else {
      const footerRows = this.card.querySelector(
        '[slot="footer-rows"] ul'
      );
      if (!footerRows || !footerRows.children) return;
      rows = [...footerRows.children];
    }
    if (!rows.length) return;
    rows.forEach((el, index) => {
      const height = Math.max(
        FOOTER_ROW_MIN_HEIGHT2,
        parseFloat(window.getComputedStyle(el).height) || 0
      );
      const maxMinHeight = parseFloat(
        this.getContainer().style.getPropertyValue(
          this.getRowMinHeightPropertyName(index + 1)
        )
      ) || 0;
      if (height > maxMinHeight) {
        this.getContainer().style.setProperty(
          this.getRowMinHeightPropertyName(index + 1),
          `${height}px`
        );
      }
    });
  }
  removeEmptyRows() {
    if (this.isNewVariant) {
      const rows = this.card.querySelectorAll(
        "merch-whats-included merch-mnemonic-list"
      );
      rows.forEach((row) => {
        const description = row.querySelector('[slot="description"]');
        if (description) {
          const isEmpty = !description.textContent.trim();
          if (isEmpty) {
            row.remove();
          }
        }
      });
    } else {
      const footerRows = this.card.querySelectorAll(".footer-row-cell");
      footerRows.forEach((row) => {
        const rowDescription = row.querySelector(
          ".footer-row-cell-description"
        );
        if (rowDescription) {
          const isEmpty = !rowDescription.textContent.trim();
          if (isEmpty) {
            row.remove();
          }
        }
      });
    }
  }
  padFooterRows() {
    const container = this.getContainer();
    if (!container) return;
    const allCards = container.querySelectorAll(
      'merch-card[variant="mini-compare-chart"]'
    );
    if (this.isNewVariant) {
      let maxRows = 0;
      allCards.forEach((card) => {
        const whatsIncluded2 = card.querySelector(
          "merch-whats-included"
        );
        if (!whatsIncluded2) return;
        const realRows = whatsIncluded2.querySelectorAll(
          '[slot="content"] merch-mnemonic-list:not([data-placeholder])'
        );
        maxRows = Math.max(maxRows, realRows.length);
      });
      if (maxRows === 0) return;
      const whatsIncluded = this.card.querySelector(
        "merch-whats-included"
      );
      if (!whatsIncluded) return;
      const contentSlot = whatsIncluded.querySelector('[slot="content"]');
      if (!contentSlot) return;
      contentSlot.querySelectorAll("merch-mnemonic-list[data-placeholder]").forEach((el) => el.remove());
      const currentRows = contentSlot.querySelectorAll(
        "merch-mnemonic-list"
      ).length;
      const needed = maxRows - currentRows;
      for (let i = 0; i < needed; i++) {
        const empty = document.createElement("merch-mnemonic-list");
        empty.setAttribute("data-placeholder", "");
        const desc = document.createElement("div");
        desc.setAttribute("slot", "description");
        empty.appendChild(desc);
        contentSlot.appendChild(empty);
      }
    } else {
      let maxRows = 0;
      allCards.forEach((card) => {
        const ul2 = card.querySelector('[slot="footer-rows"] ul');
        if (!ul2) return;
        const realRows = ul2.querySelectorAll(
          "li.footer-row-cell:not([data-placeholder])"
        );
        maxRows = Math.max(maxRows, realRows.length);
      });
      if (maxRows === 0) return;
      const ul = this.card.querySelector('[slot="footer-rows"] ul');
      if (!ul) return;
      ul.querySelectorAll("li.footer-row-cell[data-placeholder]").forEach(
        (el) => el.remove()
      );
      const currentRows = ul.querySelectorAll("li.footer-row-cell").length;
      const needed = maxRows - currentRows;
      for (let i = 0; i < needed; i++) {
        const empty = document.createElement("li");
        empty.className = "footer-row-cell";
        empty.setAttribute("data-placeholder", "");
        ul.appendChild(empty);
      }
    }
  }
  get mainPrice() {
    const price = this.card.querySelector(
      `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`
    );
    return price;
  }
  get headingMPriceSlot() {
    return this.card.shadowRoot.querySelector('slot[name="heading-m-price"]')?.assignedElements()[0];
  }
  get isNewVariant() {
    return !!this.card.querySelector("merch-whats-included");
  }
  toggleAddon(merchAddon) {
    const mainPrice = this.mainPrice;
    const headingMPriceSlot = this.headingMPriceSlot;
    if (!mainPrice && headingMPriceSlot) {
      const planType = merchAddon?.getAttribute("plan-type");
      let visibleSpan = null;
      if (merchAddon && planType) {
        const matchingP = merchAddon.querySelector(
          `p[data-plan-type="${planType}"]`
        );
        visibleSpan = matchingP?.querySelector(
          'span[is="inline-price"]'
        );
      }
      this.card.querySelectorAll('p[slot="heading-m-price"]').forEach((p) => p.remove());
      if (merchAddon.checked) {
        if (visibleSpan) {
          const replacementP = createTag(
            "p",
            {
              class: "addon-heading-m-price-addon",
              slot: "heading-m-price"
            },
            visibleSpan.innerHTML
          );
          this.card.appendChild(replacementP);
        }
      } else {
        const freeP = createTag(
          "p",
          {
            class: "card-heading",
            id: "free",
            slot: "heading-m-price"
          },
          "Free"
        );
        this.card.appendChild(freeP);
      }
    }
  }
  showTooltip(tooltipIcon) {
    tooltipIcon.classList.remove("hide-tooltip");
    tooltipIcon.setAttribute("aria-expanded", "true");
  }
  hideTooltip(tooltipIcon) {
    tooltipIcon.classList.add("hide-tooltip");
    tooltipIcon.setAttribute("aria-expanded", "false");
  }
  adjustCallout() {
    const tooltipIcon = this.card.querySelector(
      '[slot="callout-content"] .icon-button'
    );
    if (!tooltipIcon) return;
    if (this.calloutListenersAdded) return;
    const tooltipText = tooltipIcon.title || tooltipIcon.dataset.tooltip;
    if (!tooltipText) return;
    if (tooltipIcon.title) {
      tooltipIcon.dataset.tooltip = tooltipIcon.title;
      tooltipIcon.removeAttribute("title");
    }
    const pElement = tooltipIcon.parentElement;
    if (pElement && pElement.tagName === "P") {
      const outerDiv = document.createElement("div");
      const calloutRow = document.createElement("div");
      calloutRow.className = "callout-row";
      const textWrapper = document.createElement("div");
      textWrapper.className = "callout-text";
      while (pElement.firstChild && pElement.firstChild !== tooltipIcon) {
        textWrapper.appendChild(pElement.firstChild);
      }
      calloutRow.appendChild(textWrapper);
      calloutRow.appendChild(tooltipIcon);
      outerDiv.appendChild(calloutRow);
      pElement.replaceWith(outerDiv);
    }
    tooltipIcon.setAttribute("role", "button");
    tooltipIcon.setAttribute("tabindex", "0");
    tooltipIcon.setAttribute("aria-label", tooltipText);
    tooltipIcon.setAttribute("aria-expanded", "false");
    this.hideTooltip(tooltipIcon);
    this.handleCalloutTouch = (event) => {
      if (event.target !== tooltipIcon) {
        this.hideTooltip(tooltipIcon);
      } else {
        const isHidden = tooltipIcon.classList.contains("hide-tooltip");
        if (isHidden) {
          this.showTooltip(tooltipIcon);
        } else {
          this.hideTooltip(tooltipIcon);
        }
      }
    };
    this.handleCalloutMouse = (event) => {
      if (event.target !== tooltipIcon) {
        this.hideTooltip(tooltipIcon);
      } else {
        this.showTooltip(tooltipIcon);
      }
    };
    this.handleCalloutFocusin = () => {
      this.showTooltip(tooltipIcon);
    };
    this.handleCalloutFocusout = () => {
      this.hideTooltip(tooltipIcon);
    };
    this.handleCalloutKeydown = (event) => {
      if (event.key === "Escape") {
        this.hideTooltip(tooltipIcon);
        tooltipIcon.blur();
      }
    };
    document.addEventListener("touchstart", this.handleCalloutTouch);
    document.addEventListener("mouseover", this.handleCalloutMouse);
    tooltipIcon.addEventListener("focusin", this.handleCalloutFocusin);
    tooltipIcon.addEventListener("focusout", this.handleCalloutFocusout);
    tooltipIcon.addEventListener("keydown", this.handleCalloutKeydown);
    this.calloutListenersAdded = true;
  }
  async adjustAddon() {
    await this.card.updateComplete;
    const addon = this.card.addon;
    if (!addon) return;
    const price = this.mainPrice;
    let planType = this.card.planType;
    if (price) {
      await price.onceSettled();
      planType = price.value?.[0]?.planType;
    }
    if (!planType) return;
    addon.planType = planType;
    const addonWithPlanType = this.card.querySelector(
      "merch-addon[plan-type]"
    );
    addonWithPlanType?.updateComplete.then(() => {
      this.updateCardElementMinHeight(
        this.card.shadowRoot.querySelector(`slot[name="addon"]`),
        "addon"
      );
    });
  }
  async adjustLegal() {
    if (this.legalAdjusted) return;
    try {
      this.legalAdjusted = true;
      await this.card.updateComplete;
      await customElements.whenDefined("inline-price");
      const headingPrice = this.mainPrice;
      if (!headingPrice) return;
      const legal = headingPrice.cloneNode(true);
      await headingPrice.onceSettled();
      if (!headingPrice?.options) return;
      if (headingPrice.options.displayPerUnit)
        headingPrice.dataset.displayPerUnit = "false";
      if (headingPrice.options.displayTax)
        headingPrice.dataset.displayTax = "false";
      if (headingPrice.options.displayPlanType)
        headingPrice.dataset.displayPlanType = "false";
      legal.setAttribute("data-template", "legal");
      headingPrice.parentNode.insertBefore(
        legal,
        headingPrice.nextSibling
      );
      await legal.onceSettled();
    } catch {
    }
  }
  adjustShortDescription() {
    const bodyXxs = this.card.querySelector('[slot="body-xxs"]');
    const text = bodyXxs?.textContent?.trim();
    if (!text) return;
    const legalPrice = this.card.querySelector(
      '[slot="heading-m-price"] [data-template="legal"]'
    );
    const planType = legalPrice?.querySelector(".price-plan-type");
    if (!planType) return;
    const em = document.createElement("em");
    em.setAttribute("slot", "body-xxs");
    em.textContent = ` ${text}`;
    planType.appendChild(em);
    bodyXxs.remove();
  }
  renderLayout() {
    if (!this.isNewVariant) {
      return html17` <div class="top-section${this.badge ? " badge" : ""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list") ? html17`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>` : html17`<slot name="body-m"></slot>
                          <slot name="heading-m-price"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="offers"></slot>
                          <slot name="promo-text"></slot> `}
                <slot name="callout-content"></slot>
                <slot name="addon"></slot>
                ${this.getMiniCompareFooter()}
                <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
    }
    return html17` <div class="top-section${this.badge ? " badge" : ""}">
                <slot name="icons"></slot> ${this.badge}
                <slot name="badge"></slot>
            </div>
            <slot name="heading-m"></slot>
            <slot name="heading-xs"></slot>
            <slot name="body-m"></slot>
            <slot name="subtitle"></slot>
            <slot name="heading-m-price"></slot>
            <slot name="body-xxs"></slot>
            <slot name="price-commitment"></slot>
            <slot name="offers"></slot>
            <slot name="quantity-select"></slot>
            <slot name="promo-text"></slot>
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
  }
  syncHeights() {
    if (this.card.getBoundingClientRect().width <= 2) return;
    this.adjustMiniCompareBodySlots();
    this.adjustMiniCompareFooterRows();
  }
  async postCardUpdateHook() {
    await Promise.all(this.card.prices.map((price) => price.onceSettled()));
    if (this.isNewVariant) {
      if (!this.legalAdjusted) {
        await this.adjustLegal();
      }
      this.adjustShortDescription();
      this.adjustCallout();
    }
    await this.adjustAddon();
    if (media_default.isMobile) {
      this.removeEmptyRows();
    } else {
      this.padFooterRows();
      const container = this.getContainer();
      if (!container) return;
      const hasExistingVars = container.style.getPropertyValue(
        "--consonant-merch-card-footer-row-1-min-height"
      );
      if (!hasExistingVars) {
        requestAnimationFrame(() => {
          const cards = container.querySelectorAll(
            'merch-card[variant="mini-compare-chart"]'
          );
          cards.forEach(
            (card) => card.variantLayout?.syncHeights?.()
          );
        });
      } else {
        requestAnimationFrame(() => {
          this.syncHeights();
        });
      }
    }
  }
};
__publicField(MiniCompareChart, "variantStyle", css15`
        :host([variant='mini-compare-chart']) {
            max-width: var(
                --consonant-merch-card-mini-compare-chart-wide-width,
                484px
            );
        }

        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            > slot[name='heading-m-price'] {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        :host([variant='mini-compare-chart']) .mini-compare-chart-badge {
            font-size: 14px;
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .mini-compare-chart-badge {
            padding: 2px 10px 3px 10px;
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
            border-radius: 7.11px 0 0 7.11px;
            font-weight: 700;
        }

        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart']) footer:has(.action-area) {
            align-items: start;
            flex-flow: column nowrap;
        }

        :host([variant='mini-compare-chart'])
            footer:has(.action-area)
            .secure-transaction-label {
            align-self: flex-end;
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart']) .action-area {
            display: flex;
            justify-content: end;
            align-items: flex-end;
            flex-wrap: wrap;
            width: 100%;
            gap: var(--consonant-merch-spacing-xxs);
            margin: unset;
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            font-weight: 400;
            color: #505050;
        }

        @media screen and ${unsafeCSS3(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS3(DESKTOP_UP)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='subtitle'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-subtitle-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
            line-height: 30px;
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='quantity-select'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-quantity-select-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']:not(.bullet-list))
            slot[name='footer-rows'] {
            justify-content: flex-start;
        }

        /* Border color styles */
        :host(
            [variant='mini-compare-chart'][border-color='spectrum-yellow-300']
        ) {
            --consonant-merch-card-border-color: #ffd947;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-gray-300']
        ) {
            --consonant-merch-card-border-color: #dadada;
        }

        :host(
            [variant='mini-compare-chart'][border-color='spectrum-green-900']
        ) {
            --consonant-merch-card-border-color: #05834e;
        }

        :host([variant='mini-compare-chart'][border-color='spectrum-red-700']) {
            --consonant-merch-card-border-color: #eb1000;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host(
            [variant='mini-compare-chart'][border-color='gradient-purple-blue']
        ) {
            --consonant-merch-card-border-color: linear-gradient(
                135deg,
                #9256dc,
                #1473e6
            );
        }

        /* Badge color styles */
        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700) {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-yellow-300),
        :host([variant='mini-compare-chart']) #badge.spectrum-yellow-300 {
            background-color: #ffd947;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-300),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-300 {
            background-color: #dadada;
            color: #2c2c2c;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-gray-700),
        :host([variant='mini-compare-chart']) #badge.spectrum-gray-700 {
            background-color: #4b4b4b;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-green-900),
        :host([variant='mini-compare-chart']) #badge.spectrum-green-900 {
            background-color: #05834e;
            color: #ffffff;
        }

        :host([variant='mini-compare-chart'])
            ::slotted([slot='badge'].spectrum-red-700),
        :host([variant='mini-compare-chart']) #badge.spectrum-red-700 {
            background-color: #eb1000;
            color: #ffffff;
        }
    `);

// src/mas-table.js
var TAG_NAME = "mas-table";
var MARK_PREFIX = "mas-table:";
var LOAD_TIMEOUT = 2e4;
var TAB_CHANGE_EVENT = "milo:tab:changed";
var TABLE_HIGHLIGHT_LOADED_EVENT = "milo:table:highlight:loaded";
var DESKTOP_SIZE = 900;
var MOBILE_SIZE = 768;
var DEFAULT_LABELS = {
  "toggle-row": "Toggle row",
  "choose-table-column": "Choose table column"
};
var CHEVRON_ICON = new URL("./img/chevron-wide-black.svg", import.meta.url).href;
var MINI_COMPARE_CHART_VARIANT = "mini-compare-chart";
var MINI_COMPARE_CHART_SLOTS = {
  title: "heading-xs",
  prices: "heading-m-price",
  description: "body-m",
  ctas: "footer"
};
var tableIndex = 0;
var styleText;
function getStyleText() {
  if (styleText) return styleText;
  styleText = [
    `
            :host {
                display: block;
            }

            :host([hidden]) {
                display: none;
            }

            :host([dir="rtl"]) .table .row-heading .col-heading.col.no-rounded,
            :host([dir="rtl"]) .table.merch .col-heading:not(.no-rounded) {
                border-radius: inherit;
            }

            :host([dir="rtl"]) .table:not(.merch) .row .col span.milo-tooltip {
                margin-right: 0;
                margin-left: -4px;
            }

            :host([dir="rtl"]) .table .icon.expand {
                rotate: 90deg;
            }

            :host([dir="rtl"]) .table .col,
            :host([dir="rtl"]) .table.merch .col,
            :host([dir="rtl"]) .table .col:first-child,
            :host([dir="rtl"]) .table .col:last-child:not(.hover),
            :host([dir="rtl"]) .table.merch .col-merch .col-merch-content picture,
            :host([dir="rtl"]) .table .col-heading:not(.left-round):last-child,
            :host([dir="rtl"]) .table .col-heading:nth-child(2):last-child,
            :host([dir="rtl"]) .table .col-heading:nth-child(2),
            :host([dir="rtl"]) .table .col-heading.force-last,
            :host([dir="rtl"]) .table .col-heading.force-last + .col-heading,
            :host([dir="rtl"]) .table .left-round,
            :host([dir="rtl"]) .table .right-round {
                direction: rtl;
            }

            .con-button {
                box-sizing: border-box;
                min-height: 40px;
                padding: 10px 16px;
                border-radius: 999px;
                border: 2px solid transparent;
                font-size: 14px;
                font-weight: 700;
                line-height: 1.2;
                text-decoration: none;
                transition:
                    background-color 140ms ease,
                    border-color 140ms ease,
                    color 140ms ease,
                    transform 140ms ease;
            }

            .con-button:hover {
                transform: translateY(-1px);
            }

            .con-button.blue {
                background: #1473e6;
                color: #fff;
            }

            .con-button.outline {
                border-color: #1473e6;
                color: #1473e6;
                background: transparent;
            }

            .con-button.primary,
            .con-button.secondary {
                background: #2c2c2c;
                color: #fff;
            }

            .filter {
                background-color: transparent;
                background-image: url("${CHEVRON_ICON}");
                color: inherit;
            }

            .filter:focus-visible,
            .point-cursor:focus-visible {
                outline: 2px solid #1473e6;
                outline-offset: 2px;
            }

            .mas-table-empty {
                padding: 20px 0;
            }

            .mas-table-scratch {
                display: none;
            }

            .table .row-highlight .badge-icon {
                width: 18px;
                height: 18px;
                margin-inline-end: 6px;
                vertical-align: text-bottom;
            }
        `,
    TABLE_CSS.replaceAll(
      "../../ui/img/chevron-wide-black.svg",
      CHEVRON_ICON
    )
  ].join("\n");
  return styleText;
}
function createElement(tag, attributes = {}, content = null) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    element.setAttribute(key, value);
  });
  appendContent(element, content);
  return element;
}
function appendContent(element, content) {
  if (content == null) return;
  if (Array.isArray(content)) {
    content.forEach((item) => appendContent(element, item));
    return;
  }
  if (content instanceof Node) {
    element.append(content);
    return;
  }
  element.append(document.createTextNode(String(content)));
}
function appendHtml(target, html18) {
  if (!html18) return;
  const template = document.createElement("template");
  template.innerHTML = html18;
  target.append(template.content.cloneNode(true));
}
function normalizeFields(fragment) {
  if (!fragment?.fields) return {};
  if (Array.isArray(fragment.fields)) {
    return fragment.fields.reduce((acc, field) => {
      if (!field?.name) return acc;
      acc[field.name] = field.multiple ? field.values || [] : field.values?.[0];
      return acc;
    }, {});
  }
  return fragment.fields;
}
function getStringField(fields, name) {
  const value = fields?.[name];
  if (value == null) return "";
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (typeof value === "object" && "value" in value)
    return String(value.value ?? "");
  return String(value);
}
function getArrayField(fields, name) {
  const value = fields?.[name];
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
function normalizeHydrateFieldValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeHydrateFieldValue(item));
  }
  if (value && typeof value === "object" && "value" in value) {
    return normalizeHydrateFieldValue(value.value);
  }
  return value;
}
function normalizeFieldsForHydrate(fragment) {
  const fields = normalizeFields(fragment);
  return Object.fromEntries(
    Object.entries(fields).map(([name, value]) => [
      name,
      normalizeHydrateFieldValue(value)
    ])
  );
}
function normalizeFragmentMap(references = {}) {
  const map = /* @__PURE__ */ new Map();
  Object.values(references).forEach((reference) => {
    if (reference?.type !== "content-fragment" || !reference.value) return;
    const fragment = reference.value;
    const normalized = {
      ...fragment,
      fields: normalizeFields(fragment)
    };
    if (normalized.id) map.set(normalized.id, normalized);
    if (normalized.fields.originalId) {
      map.set(normalized.fields.originalId, normalized);
    }
  });
  return map;
}
function getFragmentValue(fragment, key) {
  const value = fragment?.dictionary?.[key];
  if (typeof value === "object" && value && "value" in value)
    return value.value;
  return value;
}
function getLabels(fragment) {
  return {
    "toggle-row": getFragmentValue(fragment, "toggle-row") || DEFAULT_LABELS["toggle-row"],
    "choose-table-column": getFragmentValue(fragment, "choose-table-column") || DEFAULT_LABELS["choose-table-column"]
  };
}
function isMobileLandscape() {
  return window.matchMedia("(orientation: landscape)").matches && window.innerHeight <= MOBILE_SIZE;
}
function defineDeviceByScreenSize() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= DESKTOP_SIZE) {
    return "DESKTOP";
  }
  if (screenWidth <= MOBILE_SIZE) {
    return "MOBILE";
  }
  return "TABLET";
}
function isStickyHeader(el) {
  return el.classList.contains("sticky") || el.classList.contains("sticky-desktop-up") && defineDeviceByScreenSize() === "DESKTOP" || el.classList.contains("sticky-tablet-up") && defineDeviceByScreenSize() !== "MOBILE" && !isMobileLandscape();
}
function decorateButtons(el, size) {
  const buttons = el.querySelectorAll("em a, strong a, p > a strong");
  if (!buttons.length) return;
  const buttonTypeMap = { STRONG: "blue", EM: "outline", A: "blue" };
  buttons.forEach((button) => {
    const parent = button.parentElement;
    let target = button;
    const buttonType = buttonTypeMap[parent.nodeName] || "outline";
    if (button.nodeName === "STRONG") {
      target = parent;
    } else {
      parent.insertAdjacentElement("afterend", button);
      parent.remove();
    }
    target.classList.add("con-button", buttonType);
    if (size) target.classList.add(size);
    const customClasses = target.href && [
      ...target.href.matchAll(/#_button-([a-zA-Z-]+)/g)
    ];
    customClasses?.forEach((match) => {
      target.href = target.href.replace(match[0], "");
      if (target.dataset.modalHash) {
        target.setAttribute(
          "data-modal-hash",
          target.dataset.modalHash.replace(match[0], "")
        );
      }
      target.classList.add(match[1]);
    });
    const actionArea = button.closest("p, div");
    if (actionArea) {
      actionArea.classList.add("action-area");
      actionArea.nextElementSibling?.classList.add(
        "supplemental-text",
        "body-xl"
      );
    }
  });
}
function handleHeading(table, headingCols) {
  const isPriceBottom = table.classList.contains("pricing-bottom");
  headingCols.forEach((col, i) => {
    col.classList.add("col-heading");
    if (!col.innerHTML) return;
    const elements = col.children;
    if (!elements.length) {
      col.innerHTML = `<div class="heading-content"><p class="tracking-header">${col.innerHTML}</p></div>`;
    } else {
      let textStartIndex = col.querySelector(".highlight-text") ? 1 : 0;
      let isTrackingSet = false;
      const iconRow = elements[textStartIndex];
      const hasIconTile = iconRow?.classList?.contains("header-product-tile") || iconRow?.querySelector(
        "img, picture, mas-mnemonic, merch-icon"
      );
      if (hasIconTile) {
        textStartIndex += 1;
        if (!table.classList.contains("merch")) {
          iconRow?.classList.add("header-product-tile");
        }
      }
      if (elements[textStartIndex]) {
        elements[textStartIndex].classList.add("tracking-header");
        isTrackingSet = true;
      }
      const contentElements = [...elements].slice(textStartIndex + 1);
      const buttonPatterns = "em a, strong a, p > a strong, a.con-button";
      const buttonSource = contentElements.find(
        (element) => element.querySelector(buttonPatterns)
      );
      const isPricingElement = (element) => {
        if (!element) return false;
        if (element.querySelector(
          '[is="inline-price"], .price, [data-template], .price-integer, .price-strikethrough, .price-alternative'
        )) {
          return true;
        }
        const text = element.textContent?.trim() || "";
        return /(?:US?\$|CA\$|A\$|€|£|¥|\/(?:mo|month|Monat))/i.test(
          text
        );
      };
      const nonActionElements = contentElements.filter(
        (element) => element !== buttonSource
      );
      let pricingElem = nonActionElements.find(isPricingElement);
      if (!pricingElem && nonActionElements.length > 1) {
        pricingElem = nonActionElements[nonActionElements.length - 1];
      }
      const bodyElem = nonActionElements.find(
        (element) => element !== pricingElem
      );
      if (pricingElem) {
        pricingElem.classList.add("pricing");
      }
      if (bodyElem) {
        bodyElem.classList.add("body");
      }
      decorateButtons(col, "button-xl");
      const buttonsWrapper = createElement("div", {
        class: "buttons-wrapper"
      });
      col.append(buttonsWrapper);
      const buttons = col.querySelectorAll(".con-button");
      buttons.forEach((button) => {
        const buttonWrapper = button.closest("p");
        if (buttonWrapper) buttonsWrapper.append(buttonWrapper);
      });
      const headingContent = createElement("div", {
        class: "heading-content"
      });
      const headingButton = createElement("div", {
        class: "heading-button"
      });
      [...elements].forEach((element) => {
        if (element.classList.contains("pricing") && isPriceBottom) {
          headingButton.appendChild(element);
        } else {
          headingContent.appendChild(element);
        }
      });
      headingButton.appendChild(buttonsWrapper);
      col.append(headingContent, headingButton);
      if (!isTrackingSet) {
        const textNode = Array.from(col.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE
        );
        if (textNode?.textContent?.trim()) {
          headingContent.append(
            createElement(
              "p",
              { class: "tracking-header" },
              textNode.textContent
            )
          );
        }
        textNode?.remove();
      }
    }
    const trackingHeader = col.querySelector(".tracking-header");
    if (trackingHeader) {
      const trackingHeaderID = `t${tableIndex + 1}-c${i + 1}-header`;
      trackingHeader.setAttribute("id", trackingHeaderID);
      const headerBody = col.querySelector(".body:not(.action-area)");
      headerBody?.setAttribute("id", `${trackingHeaderID}-body`);
      const headerPricing = col.querySelector(".pricing");
      headerPricing?.setAttribute("id", `${trackingHeaderID}-pricing`);
      const describedBy = `${headerBody?.id ?? ""} ${headerPricing?.id ?? ""}`.trim();
      trackingHeader.setAttribute("aria-describedby", describedBy);
      col.setAttribute("role", "columnheader");
    }
    col.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      heading.setAttribute("role", "paragraph");
    });
  });
}
function handleEqualHeight(table, tag) {
  const element = table.querySelector(tag);
  if (!element) return;
  const height = [];
  const columns = [...element.children];
  columns.forEach(({ children }) => {
    [...children].forEach((row, i) => {
      row.style.height = "auto";
      const style = window.getComputedStyle(row);
      const actualHeight = row.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (!height[i] || actualHeight > height[i])
        height[i] = actualHeight;
    });
  });
  columns.forEach(({ children }) => {
    [...children].forEach((row, i) => {
      if (row.clientHeight > 0) {
        row.style.minHeight = height[i] > 0 ? `${height[i]}px` : "unset";
      }
    });
  });
}
function handleAddOnContent(table) {
  const addOns = [...table.querySelectorAll(".section-row-title")].filter(
    (row) => row.innerText.toUpperCase().includes("ADDON")
  );
  if (!addOns.length) return;
  table.classList.add("has-addon");
  addOns.forEach((addOn) => {
    const addOnRow = addOn.parentElement;
    addOnRow.remove();
    const [position, order, style] = addOn.innerText.split("-").filter((key) => key.toUpperCase() !== "ADDON").map((key) => key.toLowerCase());
    if (!position || !order) return;
    const dataIndex = "data-col-index";
    [...table.querySelector(".row-heading").children].forEach((headCol) => {
      headCol.querySelector(".heading-content")?.classList.add("content");
      const colIndex = headCol.getAttribute(dataIndex);
      if (Number(colIndex) <= 1) return;
      const tagName = `${position}-${order}`;
      const column = [...addOnRow.children].find(
        (element) => element.getAttribute(dataIndex) === colIndex
      );
      if (!column) return;
      let content = [...column.childNodes];
      const icon = column.querySelector(".icon");
      if (style === "label" && icon) {
        const text = content.filter(
          (node) => !node.classList?.contains("icon")
        );
        content = [createElement("span", {}, text), icon];
      }
      const tag = createElement(
        "div",
        { class: style ? `${tagName} addon-${style}` : tagName },
        content.map((node) => node.cloneNode(true))
      );
      const anchor = headCol.querySelector(`.${position}`);
      anchor?.classList.add(`has-${tagName}`);
      anchor?.insertAdjacentElement(
        order === "before" ? "beforebegin" : "afterend",
        tag
      );
    });
  });
  setTimeout(() => handleEqualHeight(table, ".row-heading"), 0);
  table.addEventListener(
    "mas:resolved",
    debounce(() => {
      handleEqualHeight(table, ".row-heading");
    }, 100)
  );
}
function setAriaLabelForIcons(el, labels) {
  const expandableIcons = el.querySelectorAll('.icon.expand[role="button"]');
  const selectFilters = el.parentElement.querySelectorAll(".filters .filter");
  const ariaLabelElements = [...selectFilters, ...expandableIcons];
  ariaLabelElements.forEach((element) => {
    const labelIndex = element.classList.contains("filter") ? "choose-table-column" : "toggle-row";
    element.setAttribute("aria-label", labels[labelIndex]);
  });
}
function dispatchTableHighlightLoaded(table) {
  table.dispatchEvent(new Event(TABLE_HIGHLIGHT_LOADED_EVENT));
}
function handleHighlight(table) {
  const isHighlightTable = table.classList.contains("highlight");
  const firstRow = table.querySelector(".row-1");
  const firstRowCols = firstRow.querySelectorAll(".col");
  const secondRow = table.querySelector(".row-2");
  const secondRowCols = secondRow?.querySelectorAll(".col") || [];
  let headingCols;
  if (isHighlightTable && secondRow) {
    firstRow.classList.add("row-highlight");
    firstRow.setAttribute("aria-hidden", "true");
    secondRow.classList.add("row-heading");
    secondRowCols.forEach((col) => col.classList.add("col-heading"));
    headingCols = secondRowCols;
    firstRowCols.forEach((col, i) => {
      col.classList.add("col-highlight");
      if (col.innerText) {
        headingCols[i]?.classList.add("no-rounded");
        const highlightText = createElement(
          "div",
          { class: "highlight-text" },
          col.innerText
        );
        headingCols[i]?.insertBefore(
          highlightText,
          headingCols[i].firstChild
        );
      } else {
        col.classList.add("hidden");
      }
    });
  } else {
    headingCols = firstRowCols;
    firstRow.classList.add("row-heading");
  }
  handleHeading(table, headingCols);
  handleAddOnContent(table);
  dispatchTableHighlightLoaded(table);
}
function handleExpand(icon) {
  const sectionHead = icon.closest(".row");
  let nextElement = sectionHead.nextElementSibling;
  const expanded = icon.getAttribute("aria-expanded") === "false";
  icon.setAttribute("aria-expanded", expanded.toString());
  while (nextElement && !nextElement.classList.contains("divider")) {
    if (expanded) {
      sectionHead.classList.remove("section-head-collaped");
      nextElement.classList.remove("hidden");
    } else {
      sectionHead.classList.add("section-head-collaped");
      nextElement.classList.add("hidden");
    }
    nextElement = nextElement.nextElementSibling;
  }
}
function setExpandEvents(el) {
  el.querySelectorAll(".icon.expand").forEach((icon) => {
    const parent = icon.parentElement;
    const onClick = () => handleExpand(icon);
    const onKeyDown = (event) => {
      if (event.key === " ") event.preventDefault();
      if (event.key === "Enter" || event.key === " ") handleExpand(icon);
    };
    parent.classList.add("point-cursor");
    parent.setAttribute("tabindex", 0);
    parent.addEventListener("click", onClick);
    parent.addEventListener("keydown", onKeyDown);
  });
}
function handleTitleText(cell) {
  if (!cell || cell.querySelector(".table-title-text")) return;
  const textSpan = createElement("span", { class: "table-title-text" });
  while (cell.firstChild) textSpan.append(cell.firstChild);
  const iconTooltip = textSpan.querySelector(
    ".icon-info, .icon-tooltip, .milo-tooltip"
  );
  if (iconTooltip) cell.append(iconTooltip.closest("em") || iconTooltip);
  const firstIcon = textSpan.querySelector(".icon:first-child");
  let nodeToInsert = textSpan;
  if (firstIcon) {
    const titleRowSpan = createElement("span", {
      class: "table-title-row"
    });
    titleRowSpan.append(firstIcon, textSpan);
    nodeToInsert = titleRowSpan;
  }
  const blockquote = nodeToInsert.querySelector("blockquote");
  if (blockquote) {
    const quoteReplacement = createElement("div", { class: "blockquote" });
    while (blockquote.firstChild) {
      quoteReplacement.appendChild(blockquote.firstChild);
    }
    blockquote.replaceWith(quoteReplacement);
  }
  cell.insertBefore(nodeToInsert, cell.firstChild);
}
function handleSection(sectionParams) {
  const {
    row,
    index,
    allRows,
    rowCols,
    isMerch,
    isCollapseTable,
    isHighlightTable
  } = sectionParams;
  let { expandSection } = sectionParams;
  const previousRow = allRows[index - 1];
  const nextRow = allRows[index + 1];
  const nextRowCols = Array.from(nextRow?.children || []);
  if (row.querySelector("hr") && nextRow) {
    row.classList.add("divider");
    row.removeAttribute("role");
    nextRow.classList.add("section-head");
    const sectionHeadTitle = nextRowCols[0];
    if (isMerch && nextRowCols.length) {
      nextRowCols.forEach((merchCol) => {
        merchCol.classList.add("section-head-title");
        merchCol.setAttribute("role", "rowheader");
      });
    } else {
      handleTitleText(sectionHeadTitle);
      sectionHeadTitle.classList.add("section-head-title");
      sectionHeadTitle.setAttribute("role", "rowheader");
    }
    if (isCollapseTable && sectionHeadTitle) {
      const iconTag = createElement("span", {
        class: "icon expand",
        role: "button"
      });
      if (!sectionHeadTitle.querySelector(".icon.expand")) {
        sectionHeadTitle.prepend(iconTag);
      }
      if (expandSection) {
        iconTag.setAttribute("aria-expanded", "true");
        expandSection = false;
      } else {
        iconTag.setAttribute("aria-expanded", "false");
        nextRow.classList.add("section-head-collaped");
        let nextElement = row.nextElementSibling;
        while (nextElement && !nextElement.classList.contains("divider")) {
          nextElement.classList.add("hidden");
          nextElement = nextElement.nextElementSibling;
        }
      }
    }
  } else if (previousRow?.querySelector("hr") && nextRow) {
    nextRow.classList.add("section-row");
    if (!isMerch) {
      const sectionRowTitle = nextRowCols[0];
      sectionRowTitle?.classList.add("section-row-title");
      sectionRowTitle?.setAttribute("role", "rowheader");
      sectionRowTitle?.setAttribute("scope", "row");
    }
  } else if (!row.classList.contains("row-1") && (!isHighlightTable || !row.classList.contains("row-2"))) {
    row.classList.add("section-row");
    rowCols.forEach((col) => {
      if (col.querySelector("a") && !col.querySelector("span")) {
        const textSpan = createElement("span", { class: "col-text" }, [
          ...col.childNodes
        ]);
        col.appendChild(textSpan);
      }
    });
    if (isMerch && !row.classList.contains("divider")) {
      rowCols.forEach((merchCol) => {
        merchCol.classList.add("col-merch");
        const children = Array.from(merchCol.children);
        const merchContent = createElement("div", {
          class: "col-merch-content"
        });
        if (children.length) {
          children.forEach((child) => {
            if (!child.querySelector(".icon")) {
              merchContent.append(child);
            }
          });
          merchCol.insertBefore(merchContent, merchCol.firstChild);
        } else if (merchCol.innerText) {
          const pTag = createElement(
            "p",
            { class: "merch-col-text" },
            merchCol.innerText
          );
          merchCol.innerText = "";
          merchContent.append(pTag);
          merchCol.append(merchContent);
        }
      });
    } else {
      const sectionRowTitle = rowCols[0];
      handleTitleText(sectionRowTitle);
      sectionRowTitle.classList.add("section-row-title");
      sectionRowTitle.setAttribute("role", "rowheader");
      sectionRowTitle.setAttribute("scope", "row");
    }
  }
  rowCols.forEach((col) => {
    if (col.querySelector(
      ":scope > :is(strong, em, del, code, sub, sup)"
    ) && col.childNodes.length > 1 && !col.querySelector("picture")) {
      col.replaceChildren(createElement("p", {}, [...col.childNodes]));
    }
  });
  return expandSection;
}
function formatMerchTable(table) {
  const rows = table.querySelectorAll(".row");
  const rowsNum = rows.length;
  const firstRow = rows[0];
  const colsInRow = firstRow.querySelectorAll(".col");
  const colsInRowNum = colsInRow.length;
  for (let i = colsInRowNum; i > 0; i -= 1) {
    const cols = table.querySelectorAll(`.col-${i}`);
    for (let j = rowsNum - 1; j >= 0; j -= 1) {
      const currentCol = cols[j];
      if (!currentCol?.innerText && currentCol?.children.length === 0) {
        currentCol.classList.add("no-borders");
      } else {
        currentCol.classList.add("border-bottom");
        break;
      }
    }
  }
}
function removeHover(cols) {
  cols.forEach(
    (col) => col.classList.remove("hover", "no-top-border", "hover-border-bottom")
  );
}
function handleHovering(table) {
  const row1 = table.querySelector(".row-1");
  if (!row1) return;
  const colsInRowNum = row1.childElementCount;
  const isMerch = table.classList.contains("merch");
  const startValue = isMerch ? 1 : 2;
  const isCollapseTable = table.classList.contains("collapse");
  const sectionHeads = table.querySelectorAll(".section-head");
  const lastSectionHead = sectionHeads[sectionHeads.length - 1];
  const lastExpandIcon = lastSectionHead?.querySelector(".icon.expand");
  for (let i = startValue; i <= colsInRowNum; i += 1) {
    const cols = table.querySelectorAll(`.col-${i}`);
    cols.forEach((element) => {
      element.addEventListener("mouseover", () => {
        removeHover(cols);
        const headingRow = table.querySelector(".row-heading");
        const colClass = `col-${i}`;
        const isLastRowCollapsed = lastExpandIcon?.getAttribute("aria-expanded") === "false";
        cols.forEach((col) => {
          if (col.classList.contains("col-highlight") && col.innerText) {
            const matchingColsClass = Array.from(
              col.classList
            ).find((className) => className.startsWith(colClass));
            const noTopBorderCol = headingRow?.querySelector(
              `.${matchingColsClass}`
            );
            noTopBorderCol?.classList.add("no-top-border");
          }
          if (isCollapseTable && isLastRowCollapsed) {
            const lastSectionHeadCol = lastSectionHead?.querySelector(`.col-${i}`);
            lastSectionHeadCol?.classList.add(
              "hover-border-bottom"
            );
          }
          col.classList.add("hover");
        });
      });
      element.addEventListener("mouseout", () => removeHover(cols));
    });
  }
}
function handleScrollEffect(table, getStickyTop) {
  table._stickyObserver?.disconnect();
  const stickyTop = getStickyTop();
  const highlightRow = table.querySelector(".row-highlight");
  const headingRow = table.querySelector(".row-heading");
  if (!headingRow) return;
  if (highlightRow) {
    highlightRow.style.top = `${stickyTop}px`;
    highlightRow.classList.add("top-border-transparent");
  } else {
    headingRow.classList.add("top-border-transparent");
  }
  const topOffset = stickyTop + (highlightRow ? highlightRow.offsetHeight : 0);
  headingRow.style.top = `${topOffset}px`;
  const intercept = table.querySelector(".intercept") || createElement("div", { class: "intercept" });
  intercept.setAttribute("data-observer-intercept", "");
  headingRow.insertAdjacentElement("beforebegin", intercept);
  const observer = new IntersectionObserver(
    ([entry]) => {
      headingRow.classList.toggle("active", !entry.isIntersecting);
    },
    { rootMargin: `-${topOffset}px` }
  );
  observer.observe(intercept);
  table._stickyObserver = observer;
}
function applyStylesBasedOnScreenSize(table, originTable, labels, getStickyTop) {
  const isMerch = table.classList.contains("merch");
  const deviceBySize = defineDeviceByScreenSize();
  const setRowStyle = () => {
    if (isMerch) return;
    const sectionRow = Array.from(
      table.getElementsByClassName("section-row")
    );
    if (sectionRow.length) {
      const colsForTablet = sectionRow[0].children.length - 1;
      const percentage = 100 / colsForTablet;
      const templateColumnsValue = `repeat(auto-fit, ${percentage}%)`;
      sectionRow.forEach((row) => {
        if (deviceBySize === "TABLET" || deviceBySize === "MOBILE" && !row.querySelector(".col-3")) {
          row.style.gridTemplateColumns = templateColumnsValue;
        } else {
          row.style.gridTemplateColumns = "";
        }
      });
    }
  };
  const mobileRenderer = () => {
    dispatchTableHighlightLoaded(table);
    const headings = table.querySelectorAll(".row-heading .col");
    const headingsLength = Array.from(headings).filter(
      (heading) => heading.textContent.trim()
    ).length;
    table.querySelectorAll(".hide-mobile").forEach((col) => {
      col.classList.remove("hide-mobile");
    });
    if (isMerch && headingsLength >= 2) {
      table.querySelectorAll(".col:not(.col-1, .col-2)").forEach((col) => {
        col.classList.add("hide-mobile");
      });
    } else if (headingsLength >= 3) {
      table.querySelectorAll(
        ".col:not(.col-1, .col-2, .col-3), .col.no-borders"
      ).forEach((col) => {
        col.classList.add("hide-mobile");
      });
    }
    if (!isMerch && !table.querySelector(".col-3") || isMerch && !table.querySelector(".col-2")) {
      return;
    }
    const filterChangeEvent = (event) => {
      const filters2 = Array.from(
        table.parentElement.querySelectorAll(".filter")
      ).map((filter) => parseInt(filter.value, 10));
      const rows = table.querySelectorAll(".row");
      table.querySelectorAll(".hide-mobile, .force-last").forEach((col) => {
        col.classList.remove("hide-mobile", "force-last");
      });
      rows.forEach((row) => {
        row.querySelectorAll(".col[data-cloned]").forEach(
          (col) => col.remove()
        );
      });
      if (isMerch) {
        table.querySelectorAll(
          `.col:not(.col-${filters2[0] + 1}, .col-${filters2[1] + 1})`
        ).forEach((col) => {
          col.classList.add("hide-mobile");
        });
      } else {
        table.querySelectorAll(
          `.col:not(.col-1, .col-${filters2[0] + 1}, .col-${filters2[1] + 1}), .col.no-borders`
        ).forEach((col) => {
          col.classList.add("hide-mobile");
        });
      }
      rows.forEach((row) => {
        const firstFilterCol = row.querySelector(
          `.col-${filters2[0] + 1}`
        );
        const secondFilterCol = row.querySelector(
          `.col-${filters2[1] + 1}`
        );
        if (firstFilterCol?.classList.contains("col-heading")) {
          firstFilterCol.classList.remove("right-round");
          firstFilterCol.classList.add("left-round");
        }
        if (secondFilterCol?.classList.contains("col-heading")) {
          secondFilterCol.classList.remove("left-round");
          secondFilterCol.classList.add("right-round");
        }
        if (secondFilterCol)
          secondFilterCol.classList.add("force-last");
      });
      if (filters2[0] === filters2[1]) {
        const selectedCol = filters2[0] + 1;
        rows.forEach((row) => {
          const selectedColumn = row.querySelector(
            `.col-${selectedCol}`
          );
          if (!selectedColumn) return;
          const clone = selectedColumn.cloneNode(true);
          clone.setAttribute("data-cloned", "true");
          selectedColumn.classList.remove("force-last");
          if (selectedColumn.classList.contains("col-heading")) {
            selectedColumn.classList.remove("right-round");
            selectedColumn.classList.add("left-round");
            clone.classList.remove("left-round");
            clone.classList.add("right-round");
          }
          row.appendChild(clone);
        });
      }
      setRowStyle();
      if (isStickyHeader(table)) {
        handleScrollEffect(table, getStickyTop);
      }
      if (event) handleEqualHeight(table, ".row-heading");
      setAriaLabelForIcons(table, labels);
    };
    const shouldShowFilter = headingsLength > 2;
    if (!table.parentElement.querySelector(".filters") && shouldShowFilter) {
      const filters2 = createElement("div", { class: "filters" });
      const filter1 = createElement("div", { class: "filter-wrapper" });
      const filter2 = createElement("div", { class: "filter-wrapper" });
      const colSelect0 = createElement("select", { class: "filter" });
      const headingsFromOrigin = originTable.querySelectorAll(".col-heading");
      headingsFromOrigin.forEach((heading, index) => {
        const title = heading.querySelector(".tracking-header");
        if (!title || !isMerch && title.closest(".col-1")) return;
        const option = createElement(
          "option",
          { value: index },
          title.innerText
        );
        colSelect0.append(option);
      });
      const colSelect1 = colSelect0.cloneNode(true);
      colSelect0.dataset.filterIndex = 0;
      colSelect1.dataset.filterIndex = 1;
      const visibleCols = table.querySelectorAll(
        `.col-heading:not([style*="display: none"], .hidden${isMerch ? "" : ", .col-1"})`
      );
      const offset = isMerch ? 1 : 2;
      const option0 = colSelect0.querySelectorAll("option").item(visibleCols.item(0).dataset.colIndex - offset);
      const option1 = colSelect1.querySelectorAll("option").item(visibleCols.item(1).dataset.colIndex - offset);
      if (option0) option0.selected = true;
      if (option1) option1.selected = true;
      filter1.append(colSelect0);
      filter2.append(colSelect1);
      filters2.append(filter1, filter2);
      filter1.addEventListener("change", filterChangeEvent);
      filter2.addEventListener("change", filterChangeEvent);
      table.parentElement.insertBefore(filters2, table);
      table.parentElement.classList.add(
        `table-${table.classList.contains("merch") ? "merch-" : ""}section`
      );
      if (!isMerch && headingsLength < 3) {
        filters2.style.display = "none";
      }
      filterChangeEvent();
    }
  };
  const removeClones = () => {
    table.querySelectorAll(".row .col[data-cloned]").forEach((clonedCol) => {
      clonedCol.remove();
    });
  };
  if (!isMerch && !table.querySelector(".row-heading .col-2")) {
    table.querySelector(".row-heading").style.display = "block";
    table.querySelector(".row-heading .col-1").style.display = "flex";
  }
  removeClones();
  if (deviceBySize === "MOBILE" || isMerch && deviceBySize === "TABLET") {
    mobileRenderer();
  } else {
    table.querySelectorAll(".hide-mobile, .left-round, .right-round").forEach((col) => {
      col.classList.remove(
        "hide-mobile",
        "left-round",
        "right-round"
      );
    });
    [...table.querySelector(".row-heading")?.children || []].forEach(
      (column) => [...column.children].forEach(
        (row) => row.style.removeProperty("height")
      )
    );
    table.parentElement.querySelectorAll(".filters select").forEach((select, index) => {
      select.querySelectorAll("option").item(index).selected = true;
    });
  }
  dispatchTableHighlightLoaded(table);
  handleHovering(table);
  setRowStyle();
}
function handleStickyHeader(el) {
  if (!el.classList.value.includes("sticky")) return;
  setTimeout(() => {
    const headingHeight = el.querySelector(".row-heading")?.offsetHeight || 0;
    el.classList.toggle(
      "cancel-sticky",
      !(headingHeight / window.innerHeight < 0.45)
    );
  });
}
function decorateTable(el, options) {
  el.setAttribute("role", "table");
  if (el.parentElement.classList.contains("section")) {
    el.parentElement.classList.add(
      `table-${el.classList.contains("merch") ? "merch-" : ""}section`
    );
  }
  const rows = Array.from(el.children);
  const isMerch = el.classList.contains("merch");
  const isCollapseTable = el.classList.contains("collapse") && !isMerch;
  const isHighlightTable = el.classList.contains("highlight");
  let expandSection = true;
  rows.forEach((row, rowIndex) => {
    row.classList.add("row", `row-${rowIndex + 1}`);
    row.setAttribute("role", "row");
    const cols = Array.from(row.children);
    const sectionParams = {
      row,
      index: rowIndex,
      allRows: rows,
      rowCols: cols,
      isMerch,
      isCollapseTable,
      expandSection,
      isHighlightTable
    };
    cols.forEach((col, colIndex) => {
      col.dataset.colIndex = colIndex + 1;
      col.classList.add("col", `col-${colIndex + 1}`);
      col.setAttribute(
        "role",
        col.matches(".section-head-title") ? "columnheader" : "cell"
      );
    });
    expandSection = handleSection(sectionParams);
  });
  handleHighlight(el);
  handleStickyHeader(el);
  if (isMerch) formatMerchTable(el);
  let isDecorated = false;
  let currentDevice = defineDeviceByScreenSize();
  const handleResize = () => {
    applyStylesBasedOnScreenSize(
      el,
      el._originTable,
      options.labels,
      options.getStickyTop
    );
    if (isStickyHeader(el)) {
      handleScrollEffect(el, options.getStickyTop);
    }
  };
  if (el.querySelectorAll(
    isMerch ? ".col-heading:not(.hidden)" : ".col-heading:not(.hidden, .col-1)"
  ).length > 2) {
    el._originTable = el.cloneNode(true);
  } else {
    el._originTable = el;
  }
  const onResize = debounce(() => {
    handleEqualHeight(el, ".row-heading");
    handleStickyHeader(el);
    const nextDevice = defineDeviceByScreenSize();
    if (currentDevice === nextDevice) return;
    currentDevice = nextDevice;
    handleResize();
  }, 100);
  const onTabChange = () => handleStickyHeader(el);
  const intersectionObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      intersectionObserver.disconnect();
      if (!isDecorated) {
        handleResize();
        setExpandEvents(el);
        setAriaLabelForIcons(el, options.labels);
        isDecorated = true;
      }
    }
  });
  const resizeObserver = new ResizeObserver(
    debounce(() => handleStickyHeader(el), 100)
  );
  resizeObserver.observe(el);
  window.addEventListener("resize", onResize);
  window.addEventListener(TAB_CHANGE_EVENT, onTabChange);
  intersectionObserver.observe(el);
  if (!isDecorated) {
    setTimeout(() => {
      if (isDecorated) return;
      handleResize();
      setExpandEvents(el);
      setAriaLabelForIcons(el, options.labels);
      isDecorated = true;
    }, 0);
  }
  tableIndex += 1;
  return () => {
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    el._stickyObserver?.disconnect();
    delete el._stickyObserver;
    delete el._originTable;
    window.removeEventListener("resize", onResize);
    window.removeEventListener(TAB_CHANGE_EVENT, onTabChange);
  };
}
function resolveColorValue(value) {
  if (!value) return "";
  if (value.startsWith("color-") || value.startsWith("spectrum-") || value.startsWith("--")) {
    return value.startsWith("--") ? `var(${value})` : `var(--${value})`;
  }
  return value;
}
function createMnemonicIcon(src, alt = "") {
  const mnemonic = createElement("mas-mnemonic", {
    slot: "icons",
    src,
    size: "l"
  });
  if (alt) {
    mnemonic.setAttribute("role", "img");
    mnemonic.setAttribute("aria-label", alt);
  }
  return mnemonic;
}
function cloneSlotNodes(card, slotName) {
  if (!card) return [];
  return Array.from(card.querySelectorAll(`[slot="${slotName}"]`)).map(
    (node) => node.cloneNode(true)
  );
}
function normalizeFooterSlotNode(node) {
  if (!node) return node;
  node.removeAttribute?.("slot");
  const buttons = node.matches?.(".con-button, button, a.con-button") ? [node] : Array.from(
    node.querySelectorAll(".con-button, button, a.con-button")
  );
  if (!buttons.length) return node;
  const actionArea = createElement("p", { class: "action-area" });
  buttons.forEach((button) => {
    actionArea.append(button);
    const spacer = button.nextSibling;
    if (spacer?.nodeType === Node.TEXT_NODE && !spacer.textContent.trim()) {
      spacer.remove();
    }
  });
  return actionArea;
}
function buildMerchHeadingContent(card) {
  const fragment = document.createDocumentFragment();
  const iconNodes = cloneSlotNodes(card, "icons");
  if (iconNodes.length) {
    const iconRow = createElement("p", { class: "header-product-tile" });
    iconNodes.forEach((node) => {
      if (node.tagName === "MERCH-ICON") {
        const mnemonic = createMnemonicIcon(
          node.getAttribute("src") || "",
          node.getAttribute("alt") || ""
        );
        mnemonic.removeAttribute("slot");
        iconRow.append(mnemonic);
        return;
      }
      node.removeAttribute?.("slot");
      iconRow.append(node);
    });
    fragment.append(iconRow);
  }
  [
    MINI_COMPARE_CHART_SLOTS.title,
    MINI_COMPARE_CHART_SLOTS.prices,
    MINI_COMPARE_CHART_SLOTS.description,
    MINI_COMPARE_CHART_SLOTS.ctas
  ].forEach((slotName) => {
    cloneSlotNodes(card, slotName).forEach((node) => {
      if (slotName === MINI_COMPARE_CHART_SLOTS.ctas) {
        fragment.append(normalizeFooterSlotNode(node));
        return;
      }
      fragment.append(node);
    });
  });
  return fragment;
}
function getBadgeData(card) {
  if (!card) return null;
  if (card._masTableBadgeData?.text) return card._masTableBadgeData;
  const badgeSlot = card.querySelector('[slot="badge"]');
  const shadowBadge = card.shadowRoot?.getElementById("badge");
  const badgeElement = badgeSlot?.matches("merch-badge") ? badgeSlot : badgeSlot?.querySelector("merch-badge");
  const text = badgeElement?.textContent?.trim() || badgeSlot?.textContent?.trim() || shadowBadge?.textContent?.trim() || card.getAttribute("badge-text") || "";
  if (!text) return null;
  const computedBadgeStyles = shadowBadge ? getComputedStyle(shadowBadge) : null;
  const backgroundColor = resolveColorValue(
    badgeElement?.getAttribute("background-color") || ""
  ) || resolveColorValue(card.getAttribute("badge-background-color") || "") || computedBadgeStyles?.backgroundColor || "";
  const textColor = resolveColorValue(badgeElement?.getAttribute("color") || "") || resolveColorValue(card.getAttribute("badge-color") || "") || computedBadgeStyles?.color || "";
  return {
    text,
    icon: badgeElement?.getAttribute("icon") || "",
    backgroundColor,
    textColor
  };
}
function createBadgeIcon(icon) {
  if (!icon) return null;
  if (icon.startsWith("sp-icon-")) {
    return createElement(icon, { class: "badge-icon" });
  }
  return createElement("img", {
    class: "badge-icon",
    src: icon,
    alt: ""
  });
}
function createBadgePreviewContent(badgeData) {
  const fragment = document.createDocumentFragment();
  const icon = createBadgeIcon(badgeData.icon);
  if (icon) fragment.append(icon);
  fragment.append(document.createTextNode(badgeData.text));
  return fragment;
}
function parseBadgeDataFromFields(fields = {}) {
  const badgeValue = fields.badge;
  if (!badgeValue) return null;
  if (typeof badgeValue !== "string") {
    const text2 = String(badgeValue).trim();
    if (!text2) return null;
    return {
      text: text2,
      icon: "",
      backgroundColor: resolveColorValue(
        fields.badgeBackgroundColor || ""
      ),
      textColor: resolveColorValue(fields.badgeColor || "")
    };
  }
  const template = document.createElement("template");
  template.innerHTML = badgeValue;
  const badgeElement = template.content.querySelector("merch-badge") || template.content.firstElementChild;
  const text = badgeElement?.textContent?.trim() || badgeValue.trim();
  if (!text) return null;
  return {
    text,
    icon: badgeElement?.getAttribute?.("icon") || "",
    backgroundColor: resolveColorValue(
      badgeElement?.getAttribute?.("background-color") || fields.badgeBackgroundColor || ""
    ),
    textColor: resolveColorValue(
      badgeElement?.getAttribute?.("color") || fields.badgeColor || ""
    )
  };
}
async function hydrateMerchCards(cardIds, referenceMap, container) {
  const entries = await Promise.all(
    cardIds.map(async (cardId) => {
      const fragment = referenceMap.get(cardId);
      if (!fragment) return [cardId, null];
      try {
        const merchCard = document.createElement("merch-card");
        const fields = {
          ...normalizeFieldsForHydrate(fragment),
          variant: MINI_COMPARE_CHART_VARIANT
        };
        merchCard.variant = MINI_COMPARE_CHART_VARIANT;
        merchCard._masTableBadgeData = parseBadgeDataFromFields(fields);
        container.append(merchCard);
        await hydrate(
          {
            ...fragment,
            fields,
            settings: fragment.settings || {},
            variantLayout: {
              aemFragmentMapping: MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING
            }
          },
          merchCard
        );
        return [cardId, merchCard];
      } catch {
        return [cardId, null];
      }
    })
  );
  return new Map(entries.filter(([, merchCard]) => merchCard));
}
function hydrateMerchHighlightRow(table, cardIds, merchCardMap) {
  if (!table.classList.contains("merch") || !table.classList.contains("highlight")) {
    return;
  }
  const highlightRow = table.firstElementChild;
  if (!highlightRow) return;
  const cells = Array.from(highlightRow.children);
  cardIds.forEach((cardId, index) => {
    const cell = cells[index];
    const badgeData = getBadgeData(merchCardMap.get(cardId));
    if (!cell || !badgeData?.text) return;
    cell.replaceChildren(createBadgePreviewContent(badgeData));
    if (badgeData.backgroundColor) {
      cell.style.backgroundColor = badgeData.backgroundColor;
      cell.style.borderColor = badgeData.backgroundColor;
    }
    if (badgeData.textColor) {
      cell.style.color = badgeData.textColor;
    }
  });
}
function hydrateMerchHeadings(table, cardIds, merchCardMap) {
  if (!table.classList.contains("merch") || !cardIds?.length) return;
  const rows = Array.from(table.children);
  if (!rows.length) return;
  const headingRowIndex = table.classList.contains("highlight") && rows.length > 1 ? 1 : 0;
  const headingRow = rows[headingRowIndex];
  if (!headingRow) return;
  const cells = Array.from(headingRow.children);
  cardIds.forEach((cardId, index) => {
    const cell = cells[index];
    const merchCard = merchCardMap.get(cardId);
    if (!cell || !merchCard) return;
    cell.replaceChildren(buildMerchHeadingContent(merchCard));
  });
}
function mergeVariantClasses(table, fields) {
  const blockName = getStringField(fields, "blockName");
  if (blockName !== "Table") return;
  getArrayField(fields, "selectedVariantNames").forEach((variant) => {
    if (variant) table.classList.add(String(variant));
  });
}
async function settleMasElements(root) {
  const masElements = [...root.querySelectorAll(SELECTOR_MAS_ELEMENT)];
  await Promise.all(
    masElements.map((element) => {
      if (typeof element.onceSettled !== "function") {
        return Promise.resolve(element);
      }
      return element.onceSettled().catch(() => element);
    })
  );
}
var _cleanup, _currentRenderId, _log, _service3, _resolveUpdate, _rejectUpdate, _startMarkName, _durationMarkName, _updateComplete, _content, _scratch;
var MasTable = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _cleanup, []);
    __privateAdd(this, _currentRenderId, 0);
    __privateAdd(this, _log);
    __privateAdd(this, _service3);
    __privateAdd(this, _resolveUpdate);
    __privateAdd(this, _rejectUpdate);
    __privateAdd(this, _startMarkName);
    __privateAdd(this, _durationMarkName);
    __privateAdd(this, _updateComplete, Promise.resolve(this));
    __privateAdd(this, _content);
    __privateAdd(this, _scratch);
    this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = getStyleText();
    __privateSet(this, _content, document.createElement("div"));
    __privateSet(this, _scratch, document.createElement("div"));
    __privateGet(this, _scratch).className = "mas-table-scratch";
    this.shadowRoot.append(style, __privateGet(this, _content), __privateGet(this, _scratch));
    this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
  }
  connectedCallback() {
    __privateSet(this, _service3, getService());
    __privateGet(this, _log) ?? __privateSet(this, _log, __privateGet(this, _service3)?.Log?.module?.(TAG_NAME) ?? __privateGet(this, _service3)?.log?.module?.(TAG_NAME) ?? console);
    this.syncDirection();
    const logId = this.getAttribute("id") ?? this.aemFragment?.getAttribute("fragment") ?? "unknown";
    __privateSet(this, _startMarkName, `${MARK_PREFIX}${logId}${MARK_START_SUFFIX}`);
    __privateSet(this, _durationMarkName, `${MARK_PREFIX}${logId}${MARK_DURATION_SUFFIX}`);
    performance.mark(__privateGet(this, _startMarkName));
    this.addEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
    this.addEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
    this.aemFragment?.setAttribute("hidden", "");
  }
  disconnectedCallback() {
    this.removeEventListener(EVENT_AEM_ERROR, this.handleAemFragmentEvents);
    this.removeEventListener(EVENT_AEM_LOAD, this.handleAemFragmentEvents);
    this.cleanup();
  }
  get aemFragment() {
    return this.querySelector("aem-fragment");
  }
  get updateComplete() {
    return __privateGet(this, _updateComplete);
  }
  syncDirection() {
    const dir = this.closest("[dir]")?.getAttribute("dir") || document.documentElement.getAttribute("dir") || "ltr";
    this.setAttribute("dir", dir);
  }
  cleanup() {
    __privateGet(this, _cleanup).splice(0).forEach((fn) => fn());
  }
  beginUpdate() {
    __privateSet(this, _updateComplete, new Promise((resolve, reject) => {
      __privateSet(this, _resolveUpdate, resolve);
      __privateSet(this, _rejectUpdate, reject);
    }));
  }
  async handleAemFragmentEvents(event) {
    var _a;
    if (!this.isConnected) return;
    if (event.type === EVENT_AEM_ERROR && event.target === this.aemFragment) {
      this.fail("AEM fragment cannot be loaded");
      return;
    }
    if (event.type !== EVENT_AEM_LOAD || event.target !== this.aemFragment)
      return;
    this.removeAttribute("failed");
    this.beginUpdate();
    const renderId = ++__privateWrapper(this, _currentRenderId)._;
    try {
      await this.renderFragment(event.detail);
      if (renderId !== __privateGet(this, _currentRenderId)) return;
      await settleMasElements(this.shadowRoot);
      const measure = performance.measure(
        __privateGet(this, _durationMarkName),
        __privateGet(this, _startMarkName)
      );
      const detail = {
        ...this.aemFragment?.fetchInfo,
        ...__privateGet(this, _service3)?.duration,
        measure: printMeasure(measure)
      };
      this.dispatchEvent(
        new CustomEvent(EVENT_MAS_READY, {
          bubbles: true,
          composed: true,
          detail
        })
      );
      (_a = __privateGet(this, _resolveUpdate)) == null ? void 0 : _a.call(this, this);
    } catch (error) {
      if (renderId !== __privateGet(this, _currentRenderId)) return;
      this.fail(error.message || "Failed to render table");
    }
  }
  getStickyTop() {
    const value = getComputedStyle(this).getPropertyValue(
      "--mas-table-sticky-top"
    );
    const top = parseFloat(value);
    return Number.isFinite(top) ? top : 0;
  }
  async renderFragment(fragment) {
    const fields = normalizeFields(fragment);
    const compareChart = getStringField(fields, "compareChart").trim();
    if (!compareChart) {
      throw new Error("compareChart field is missing");
    }
    this.cleanup();
    __privateGet(this, _content).replaceChildren();
    __privateGet(this, _scratch).replaceChildren();
    const wrapper = document.createElement("div");
    wrapper.className = "mas-table-empty";
    appendHtml(wrapper, compareChart);
    const tables = Array.from(wrapper.querySelectorAll(".table"));
    if (!tables.length) {
      throw new Error("compareChart does not contain a .table block");
    }
    const referenceMap = normalizeFragmentMap(fragment.references);
    const cardIds = getArrayField(fields, "cards").map(String);
    const merchCardMap = await hydrateMerchCards(
      cardIds,
      referenceMap,
      __privateGet(this, _scratch)
    );
    const labels = getLabels(fragment);
    tables.forEach((table) => {
      mergeVariantClasses(table, fields);
      hydrateMerchHighlightRow(table, cardIds, merchCardMap);
      hydrateMerchHeadings(table, cardIds, merchCardMap);
      const cleanup2 = decorateTable(table, {
        labels,
        getStickyTop: () => this.getStickyTop()
      });
      __privateGet(this, _cleanup).push(cleanup2);
    });
    __privateGet(this, _content).append(...Array.from(wrapper.childNodes));
  }
  fail(message, details = {}) {
    var _a;
    if (!this.isConnected) return;
    this.setAttribute("failed", "");
    const detail = {
      ...this.aemFragment?.fetchInfo,
      ...__privateGet(this, _service3)?.duration,
      ...details,
      message
    };
    __privateGet(this, _log)?.error?.(`mas-table: ${message}`, detail);
    this.dispatchEvent(
      new CustomEvent(EVENT_MAS_ERROR, {
        bubbles: true,
        composed: true,
        detail
      })
    );
    (_a = __privateGet(this, _rejectUpdate)) == null ? void 0 : _a.call(this, new Error(message));
  }
  async checkReady() {
    const timeoutPromise = new Promise(
      (resolve) => setTimeout(() => resolve("timeout"), LOAD_TIMEOUT)
    );
    if (this.aemFragment) {
      const result2 = await Promise.race([
        this.aemFragment.updateComplete,
        timeoutPromise
      ]);
      if (result2 === false || result2 === "timeout") {
        const errorMessage = result2 === "timeout" ? `AEM fragment was not resolved within ${LOAD_TIMEOUT} timeout` : "AEM fragment cannot be loaded";
        this.fail(errorMessage);
        throw new Error(errorMessage);
      }
    }
    const result = await Promise.race([
      this.updateComplete,
      timeoutPromise
    ]);
    if (result === "timeout") {
      const errorMessage = `mas-table was not resolved within ${LOAD_TIMEOUT} timeout`;
      this.fail(errorMessage);
      throw new Error(errorMessage);
    }
    return result;
  }
};
_cleanup = new WeakMap();
_currentRenderId = new WeakMap();
_log = new WeakMap();
_service3 = new WeakMap();
_resolveUpdate = new WeakMap();
_rejectUpdate = new WeakMap();
_startMarkName = new WeakMap();
_durationMarkName = new WeakMap();
_updateComplete = new WeakMap();
_content = new WeakMap();
_scratch = new WeakMap();
customElements.define(TAG_NAME, MasTable);
export {
  MasTable
};
//# sourceMappingURL=mas-table.js.map
