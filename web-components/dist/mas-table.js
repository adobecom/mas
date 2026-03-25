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
import { unsafeHTML } from "./lit-all.min.js";
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
var EVENT_MERCH_QUANTITY_SELECTOR_CHANGE = "merch-quantity-selector:change";
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
function getService() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
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

// src/variants/mini-compare-chart.js
import { html as html3, css as css2, unsafeCSS } from "./lit-all.min.js";

// src/variants/variant-layout.js
import { html as html2, nothing } from "./lit-all.min.js";
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
    return html2`
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
    return html2` <div class="image">
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
    return this.card.secureLabel ? html2`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >` : nothing;
  }
  get secureLabelFooter() {
    return html2`<footer>
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
    return this.constructor.fragmentMapping ?? null;
  }
};
_container = new WeakMap();
__publicField(_VariantLayout, "styleMap", {});
var VariantLayout = _VariantLayout;

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

// src/variants/mini-compare-chart.css.js
var CSS = `
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
var FOOTER_ROW_MIN_HEIGHT = 32;
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
      const secureLabel = this.card.secureLabel ? html3`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >` : html3`<slot name="secure-transaction-label"></slot>`;
      if (this.isNewVariant) {
        return html3`<footer>
                ${secureLabel}
                <p class="action-area"><slot name="footer"></slot></p>
            </footer>`;
      }
      return html3`<footer>${secureLabel}<slot name="footer"></slot></footer>`;
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
    return CSS;
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
      return html3` <div class="top-section${this.badge ? " badge" : ""}">
                    <slot name="icons"></slot> ${this.badge}
                </div>
                <slot name="heading-m"></slot>
                ${this.card.classList.contains("bullet-list") ? html3`<slot name="heading-m-price"></slot>
                          <slot name="price-commitment"></slot>
                          <slot name="body-xxs"></slot>
                          <slot name="promo-text"></slot>
                          <slot name="body-m"></slot>
                          <slot name="offers"></slot>` : html3`<slot name="body-m"></slot>
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
    return html3` <div class="top-section${this.badge ? " badge" : ""}">
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
__publicField(MiniCompareChart, "variantStyle", css2`
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

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
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
var TABLE_HOST_SELECTOR = "mas-table, mas-comparison-table";
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
var MERCH_HEADER_SECTIONS = [
  {
    className: "header-section-icon",
    cssVar: "--mas-table-header-icon-height"
  },
  {
    className: "header-section-title",
    cssVar: "--mas-table-header-title-height"
  },
  {
    className: "header-section-description",
    cssVar: "--mas-table-header-description-height"
  },
  {
    className: "header-section-price-strikethrough",
    cssVar: "--mas-table-header-strikethrough-height"
  },
  {
    className: "header-section-price",
    cssVar: "--mas-table-header-price-height"
  },
  {
    className: "header-section-legal",
    cssVar: "--mas-table-header-legal-height"
  },
  {
    className: "header-section-buttons",
    cssVar: "--mas-table-header-buttons-height"
  }
];
var TABLE_HEIGHT_RULE_ATTR = "data-mas-table-height-rules";
var TABLE_HEIGHT_SCOPE_ATTR = "data-mas-table-height-scope";
var tableHeightScopeCounter = 0;
var tableIndex = 0;
function ensureTableHeightScope(table) {
  if (!table?.hasAttribute(TABLE_HEIGHT_SCOPE_ATTR)) {
    tableHeightScopeCounter += 1;
    table.setAttribute(TABLE_HEIGHT_SCOPE_ATTR, `${tableHeightScopeCounter}`);
  }
  return table.getAttribute(TABLE_HEIGHT_SCOPE_ATTR);
}
function getTableHeightRuleStyle(table) {
  const host = table?.closest(TABLE_HOST_SELECTOR);
  const style = host?.querySelector(`style[${TABLE_HEIGHT_RULE_ATTR}]`);
  if (!style) return null;
  if (!style._tableHeightRules) {
    style._tableHeightRules = /* @__PURE__ */ new Map();
  }
  return style;
}
function setTableHeightRule(table, ruleText = "") {
  const style = getTableHeightRuleStyle(table);
  const scope = ensureTableHeightScope(table);
  if (!style || !scope) return;
  if (ruleText) {
    style._tableHeightRules.set(scope, ruleText);
  } else {
    style._tableHeightRules.delete(scope);
  }
  style.textContent = Array.from(style._tableHeightRules.values()).join("\n");
}
function createTableHeightRule(table, declarations = []) {
  const scope = ensureTableHeightScope(table);
  if (!scope || !declarations.length) return "";
  return `[${TABLE_HEIGHT_SCOPE_ATTR}="${scope}"] .row-heading { ${declarations.join(
    " "
  )} }`;
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
function appendHtml(target, html4) {
  if (!html4) return;
  const template = document.createElement("template");
  template.innerHTML = html4;
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
function isCompareStyleMobileTable(table) {
  if (!table || table.classList.contains("merch")) return false;
  const headingRow = table.querySelector(".row-heading");
  const firstHeadingCol = headingRow?.querySelector(".col-1");
  const secondHeadingCol = headingRow?.querySelector(".col-2");
  return Boolean(
    headingRow && secondHeadingCol && firstHeadingCol && !firstHeadingCol.textContent?.trim()
  );
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
    const hasCanonicalHeadingWrappers = col.querySelector(":scope > .heading-content") && col.querySelector(":scope > .heading-button");
    const elements = col.children;
    if (hasCanonicalHeadingWrappers) {
    } else if (!elements.length) {
      col.innerHTML = `<div class="heading-content"><p class="tracking-header">${col.innerHTML}</p></div>`;
    } else {
      let textStartIndex = 0;
      let isTrackingSet = false;
      const isIconElement = (element) => element?.matches?.("img, picture, mas-mnemonic, merch-icon");
      let iconRow = elements[textStartIndex];
      const hasIconTile = iconRow?.classList?.contains("header-product-tile") || isIconElement(iconRow) || iconRow?.querySelector(
        "img, picture, mas-mnemonic, merch-icon"
      );
      if (hasIconTile) {
        if (isIconElement(iconRow)) {
          const iconWrapper = createElement("p");
          let current = iconRow;
          while (isIconElement(current)) {
            const next = current.nextElementSibling;
            iconWrapper.append(current);
            current = next;
          }
          col.insertBefore(iconWrapper, current || null);
          iconRow = iconWrapper;
        }
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
function createHeaderSection(className, content = []) {
  return createElement(
    "div",
    { class: `header-section ${className}` },
    Array.isArray(content) ? content.filter(Boolean) : content
  );
}
function replaceElementTag(element, tagName) {
  if (!element || element.tagName.toLowerCase() === tagName) return element;
  const replacement = document.createElement(tagName);
  Array.from(element.attributes).forEach(({ name, value }) => {
    replacement.setAttribute(name, value);
  });
  replacement.append(...Array.from(element.childNodes));
  element.replaceWith(replacement);
  return replacement;
}
function normalizeHeadingWrappers(table) {
  table.querySelectorAll(
    ".row-heading p.pricing, .row-heading p.supplemental-text, .row-heading p.pricing-after"
  ).forEach((wrapper) => {
    replaceElementTag(wrapper, "div");
  });
}
function nodeMatchesOrContains(node, selector) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
  return node.matches(selector) || Boolean(node.querySelector(selector));
}
function classifyPricingNode(node) {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.trim() ? "price" : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  if (nodeMatchesOrContains(
    node,
    `${SELECTOR_MAS_INLINE_PRICE}[data-template="${TEMPLATE_PRICE_LEGAL}"], [data-template="${TEMPLATE_PRICE_LEGAL}"], .price-legal`
  )) {
    return "legal";
  }
  if (nodeMatchesOrContains(
    node,
    `${SELECTOR_MAS_INLINE_PRICE}[data-template="strikethrough"], [data-template="strikethrough"], .price-strikethrough, .price-promo-strikethrough`
  )) {
    return "strikethrough";
  }
  if (nodeMatchesOrContains(
    node,
    `${SELECTOR_MAS_INLINE_PRICE}, [data-template], .price, .price-alternative`
  )) {
    return "price";
  }
  return "";
}
function createPricingGroupElement(pricingElement, className, nodes = []) {
  const content = nodes.filter(
    (node) => node && (node.nodeType !== Node.TEXT_NODE || node.textContent.trim())
  );
  if (!content.length) return null;
  return createElement(
    pricingElement.tagName.toLowerCase(),
    {
      class: className
    },
    content
  );
}
function splitPricingElement(pricingElement) {
  if (!pricingElement) {
    return { strikethrough: null, price: null, legal: null };
  }
  const groups = {
    strikethrough: [],
    price: [],
    legal: []
  };
  let lastGroup = "";
  Array.from(pricingElement.childNodes).forEach((node) => {
    let group = classifyPricingNode(node);
    if (!group && node.nodeType === Node.TEXT_NODE) {
      group = lastGroup || "price";
    }
    if (!group) {
      group = node.textContent?.trim() ? "price" : lastGroup;
    }
    if (!group) return;
    groups[group].push(node);
    lastGroup = group;
  });
  if (!groups.strikethrough.length && !groups.price.length && !groups.legal.length) {
    groups.price = Array.from(pricingElement.childNodes);
  }
  const pricingClasses = Array.from(pricingElement.classList).filter(
    (className) => !["has-pricing-before", "has-pricing-after"].includes(className)
  );
  const basePricingClassName = pricingClasses.join(" ");
  return {
    strikethrough: createPricingGroupElement(
      pricingElement,
      [basePricingClassName, "pricing-strikethrough-group"].filter(Boolean).join(" "),
      groups.strikethrough
    ),
    price: createPricingGroupElement(
      pricingElement,
      [basePricingClassName, "pricing-main-group"].filter(Boolean).join(" "),
      groups.price
    ),
    legal: createElement(
      "div",
      { class: "pricing-legal-group" },
      groups.legal.filter(
        (node) => node && (node.nodeType !== Node.TEXT_NODE || node.textContent.trim())
      )
    )
  };
}
function normalizeMerchHeadingColumn(col) {
  const directChildren = Array.from(col.children);
  if (!directChildren.length) return;
  const headingContent = directChildren.find(
    (child) => child.classList.contains("heading-content")
  ) || null;
  const headingButton = directChildren.find(
    (child) => child.classList.contains("heading-button")
  ) || null;
  const contentChildren = Array.from(headingContent?.children || []);
  const contentExtras = directChildren.filter(
    (child) => child !== headingContent && child !== headingButton && (child.classList.contains("content-before") || child.classList.contains("content-after"))
  );
  const iconElement = contentChildren.find(
    (child) => child.classList.contains("header-product-tile")
  ) || null;
  const titleElement = contentChildren.find(
    (child) => child.classList.contains("tracking-header")
  ) || null;
  const bodyElement = contentChildren.find((child) => child.classList.contains("body")) || null;
  const contentRemainder = contentChildren.filter(
    (child) => child !== iconElement && child !== titleElement && child !== bodyElement
  );
  const headingButtonChildren = Array.from(headingButton?.children || []);
  const pricingElement = headingButtonChildren.find(
    (child) => child.classList.contains("pricing")
  ) || null;
  const pricingAdjacentElements = headingButtonChildren.filter(
    (child) => child !== pricingElement && !child.classList.contains("buttons-wrapper") && (child.classList.contains("pricing-before") || child.classList.contains("pricing-after") || child.classList.contains("supplemental-text"))
  );
  const buttonsWrapper = headingButtonChildren.find(
    (child) => child.classList.contains("buttons-wrapper")
  ) || null;
  const { strikethrough, price, legal } = splitPricingElement(pricingElement);
  const legalContent = [
    ...pricingAdjacentElements,
    ...legal?.childNodes ? Array.from(legal.childNodes) : []
  ];
  const sections = [
    createHeaderSection(
      "header-section-icon",
      iconElement ? [iconElement] : []
    ),
    createHeaderSection(
      "header-section-title",
      titleElement ? [titleElement] : []
    ),
    createHeaderSection(
      "header-section-description",
      [...contentExtras, bodyElement, ...contentRemainder].filter(
        Boolean
      )
    ),
    createHeaderSection(
      "header-section-price-strikethrough",
      strikethrough ? [strikethrough] : []
    ),
    createHeaderSection("header-section-price", price ? [price] : []),
    createHeaderSection("header-section-legal", legalContent),
    createHeaderSection(
      "header-section-buttons",
      buttonsWrapper ? [buttonsWrapper] : []
    )
  ];
  col.replaceChildren(...sections);
}
function normalizeMerchHeadingSections(table) {
  if (!table.classList.contains("merch")) return;
  const headingColumns = table.querySelectorAll(".row-heading .col-heading");
  headingColumns.forEach((col) => normalizeMerchHeadingColumn(col));
}
function syncMerchHeadingSectionHeights(table) {
  const headingRow = table.querySelector(".row-heading");
  if (!headingRow) {
    setTableHeightRule(table, "");
    return;
  }
  const headingColumns = Array.from(
    headingRow.querySelectorAll(":scope > .col-heading")
  ).filter(
    (col) => !col.classList.contains("col-1") && !col.classList.contains("hidden") && getComputedStyle(col).display !== "none"
  );
  if (!headingColumns.length) {
    setTableHeightRule(table, "");
    return;
  }
  const declarations = [];
  MERCH_HEADER_SECTIONS.forEach(({ className, cssVar }) => {
    let maxHeight = 0;
    headingColumns.forEach((col) => {
      const section = col.querySelector(`:scope > .${className}`);
      if (!section) return;
      maxHeight = Math.max(
        maxHeight,
        Math.ceil(section.getBoundingClientRect().height)
      );
    });
    if (maxHeight > 0) {
      declarations.push(`${cssVar}: ${maxHeight}px;`);
    }
  });
  setTableHeightRule(table, createTableHeightRule(table, declarations));
}
function syncHeadingHeights(table) {
  setTableHeightRule(table, "");
  if (table.classList.contains("merch")) {
    syncMerchHeadingSectionHeights(table);
  }
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
      if (!(position === "pricing" && order === "after")) {
        anchor?.classList.add(`has-${tagName}`);
      }
      anchor?.insertAdjacentElement(
        order === "before" ? "beforebegin" : "afterend",
        tag
      );
    });
  });
  setTimeout(() => syncHeadingHeights(table), 0);
  table.addEventListener(
    "mas:resolved",
    debounce(() => {
      syncHeadingHeights(table);
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
function applyCompareChartHeadingRounding(headingCols, highlightCols = []) {
  headingCols.forEach((col, index) => {
    const isOuterColumn = index === 0 || index === headingCols.length - 1;
    const matchingHighlightCol = highlightCols[index];
    const hasHighlight = !!matchingHighlightCol && (matchingHighlightCol.innerText || matchingHighlightCol.dataset.hasBadge === "true");
    col.classList.toggle("no-rounded", !isOuterColumn || hasHighlight);
  });
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
      if (col.innerText || col.dataset.hasBadge === "true") {
        if (!table.classList.contains("compare-chart-features")) {
          headingCols[i]?.classList.add("no-rounded");
        }
      } else {
        col.classList.add("hidden");
      }
    });
    if (table.classList.contains("compare-chart-features")) {
      applyCompareChartHeadingRounding(headingCols, firstRowCols);
    }
  } else {
    headingCols = firstRowCols;
    firstRow.classList.add("row-heading");
    if (table.classList.contains("compare-chart-features")) {
      applyCompareChartHeadingRounding(headingCols);
    }
  }
  handleHeading(table, headingCols);
  handleAddOnContent(table);
  normalizeHeadingWrappers(table);
  normalizeMerchHeadingSections(table);
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
  const meaningfulText = textSpan.textContent?.replace(/\u00a0/g, " ").trim();
  const hasMeaningfulElement = textSpan.querySelector(
    'a, em, strong, b, i, picture, img, mas-mnemonic, merch-icon, [is="inline-price"], .icon, .icon-info, .icon-tooltip, .milo-tooltip, blockquote'
  );
  if (!hasMeaningfulElement && (!meaningfulText || meaningfulText === "-")) {
    cell.replaceChildren();
    return;
  }
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
        if (!merchCol.children.length && merchCol.innerText) {
          const pTag = createElement(
            "p",
            { class: "merch-col-text" },
            merchCol.innerText
          );
          merchCol.innerText = "";
          merchCol.append(pTag);
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
  const startValue = isMerch && !table.classList.contains("compare-chart-features") ? 1 : 2;
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
function handleMobileFilterSticky(table, getStickyTop) {
  table._filterObserver?.disconnect();
  const filters2 = table.parentElement?.querySelector(".filters");
  if (!filters2) return;
  const shouldStick = isStickyHeader(table) && defineDeviceByScreenSize() === "MOBILE" && isCompareStyleMobileTable(table);
  filters2.classList.toggle("sticky-mobile-compare", shouldStick);
  filters2.classList.remove("active");
  if (!shouldStick) {
    filters2.style.removeProperty("top");
    return;
  }
  const stickyTop = getStickyTop();
  filters2.style.top = `${stickyTop}px`;
  const intercept = filters2.parentElement?.querySelector(".filters-intercept") || createElement("div", { class: "filters-intercept" });
  intercept.setAttribute("data-observer-intercept", "");
  filters2.insertAdjacentElement("beforebegin", intercept);
  const observer = new IntersectionObserver(
    ([entry]) => {
      filters2.classList.toggle("active", !entry.isIntersecting);
    },
    { rootMargin: `-${stickyTop}px` }
  );
  observer.observe(intercept);
  table._filterObserver = observer;
}
function applyStylesBasedOnScreenSize(table, originTable, labels, getStickyTop) {
  const headingRow = table.querySelector(".row-heading");
  if (!headingRow) {
    dispatchTableHighlightLoaded(table);
    return;
  }
  const isMerch = table.classList.contains("merch");
  const isCompareChart = isCompareStyleMobileTable(table);
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
    if (isCompareChart) {
      table.querySelectorAll(".row-heading .col-1, .row-highlight .col-1").forEach((col) => {
        col.classList.add("hide-mobile");
        col.style.display = "none";
      });
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
      if (isCompareChart) {
        table.querySelectorAll(
          ".row-heading .col-1, .row-highlight .col-1"
        ).forEach((col) => {
          col.classList.add("hide-mobile");
          col.style.display = "none";
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
      handleMobileFilterSticky(table, getStickyTop);
      if (event) syncHeadingHeights(table);
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
    handleMobileFilterSticky(table, getStickyTop);
  };
  const removeClones = () => {
    table.querySelectorAll(".row .col[data-cloned]").forEach((clonedCol) => {
      clonedCol.remove();
    });
  };
  if (!isMerch && !table.querySelector(".row-heading .col-2")) {
    headingRow.style.display = "block";
    headingRow.querySelector(".col-1")?.style.setProperty("display", "flex");
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
    if (isCompareChart) {
      table.querySelectorAll(".row-heading .col-1, .row-highlight .col-1").forEach((col) => {
        col.style.removeProperty("display");
      });
    }
    handleMobileFilterSticky(table, getStickyTop);
    [...headingRow.children].forEach(
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
    syncHeadingHeights(el);
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
    syncHeadingHeights(el);
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
    el._filterObserver?.disconnect();
    delete el._stickyObserver;
    delete el._filterObserver;
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
function cloneNodeChildren(node) {
  if (!node) return [];
  return Array.from(node.childNodes).map((child) => child.cloneNode(true));
}
function flattenSlotNodeContent(node) {
  if (!node) return [];
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [node.cloneNode(true)];
  }
  const cleanNode = stripSlotAttributes(node.cloneNode(true));
  const hasMeaningfulDirectText = Array.from(cleanNode.childNodes).some(
    (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim()
  );
  const singleElementChild = cleanNode.childElementCount === 1 && cleanNode.firstElementChild && !hasMeaningfulDirectText;
  if (singleElementChild && cleanNode.firstElementChild.matches?.(
    `${SELECTOR_MAS_INLINE_PRICE}, ${SELECTOR_MAS_ELEMENT}, merch-icon, merch-badge, mas-mnemonic`
  )) {
    return [cleanNode.firstElementChild.cloneNode(true)];
  }
  if (singleElementChild) {
    return cloneNodeChildren(cleanNode.firstElementChild);
  }
  if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
    cleanNode.tagName
  )) {
    return cloneNodeChildren(cleanNode);
  }
  return [cleanNode];
}
function stripSlotAttributes(node) {
  if (!node) return node;
  if (node.nodeType !== Node.ELEMENT_NODE) return node;
  node.removeAttribute("slot");
  node.querySelectorAll?.("[slot]").forEach(
    (child) => child.removeAttribute("slot")
  );
  return node;
}
function getFirstSlotNode(card, slotName) {
  return cloneSlotNodes(card, slotName).map(stripSlotAttributes).find(Boolean);
}
function normalizeHeadingTextNode(sourceNode, className) {
  if (!sourceNode) return null;
  const heading = createElement("p", { class: className });
  const content = flattenSlotNodeContent(sourceNode);
  if (content.length) {
    heading.append(...content);
  } else {
    heading.textContent = sourceNode.textContent?.trim() || "";
  }
  return heading.textContent?.trim() || heading.childNodes.length ? heading : null;
}
function normalizeBodyNode(sourceNode) {
  if (!sourceNode) return null;
  const body = createElement("p", { class: "body" });
  const content = flattenSlotNodeContent(sourceNode);
  if (content.length) {
    body.append(...content);
  } else {
    body.textContent = sourceNode.textContent?.trim() || "";
  }
  return body.textContent?.trim() || body.childNodes.length ? body : null;
}
function collectPricingNodes(sourceNodes = []) {
  const groups = {
    strikethrough: [],
    price: [],
    legal: []
  };
  let lastGroup = "";
  sourceNodes.forEach((sourceNode) => {
    const node = stripSlotAttributes(sourceNode.cloneNode(true));
    let group = classifyPricingNode(node);
    if (!group && node.nodeType === Node.TEXT_NODE) {
      group = node.textContent?.trim() ? lastGroup || "price" : "";
    }
    if (!group && node.textContent?.trim()) {
      group = "price";
    }
    if (!group) return;
    groups[group].push(node);
    lastGroup = group;
  });
  return groups;
}
function createPricingWrapper(className, nodes = []) {
  const content = nodes.filter(
    (node) => node && (node.nodeType !== Node.TEXT_NODE || node.textContent.trim())
  );
  if (!content.length) return null;
  return createElement("div", { class: className }, content);
}
function createSyntheticLegalPrice(pricingNodes = []) {
  for (const pricingNode of pricingNodes) {
    if (pricingNode?.nodeType !== Node.ELEMENT_NODE) continue;
    const inlinePrice = pricingNode.matches?.(SELECTOR_MAS_INLINE_PRICE) ? pricingNode.cloneNode(true) : pricingNode.querySelector?.(SELECTOR_MAS_INLINE_PRICE)?.cloneNode(true);
    if (!inlinePrice) continue;
    inlinePrice.setAttribute("data-template", TEMPLATE_PRICE_LEGAL);
    inlinePrice.setAttribute("data-display-plan-type", "true");
    inlinePrice.setAttribute("data-display-per-unit", "false");
    inlinePrice.setAttribute("data-display-tax", "false");
    inlinePrice.setAttribute("data-display-old-price", "false");
    if (!inlinePrice.hasAttribute("data-force-tax-exclusive")) {
      inlinePrice.setAttribute("data-force-tax-exclusive", "true");
    }
    return inlinePrice;
  }
  return null;
}
function buildCanonicalButtonsWrapper(card) {
  const footerNodes = cloneSlotNodes(card, MINI_COMPARE_CHART_SLOTS.ctas).map(
    stripSlotAttributes
  );
  const buttons = footerNodes.flatMap((node) => {
    if (node.matches?.(".con-button, button, a.con-button")) return [node];
    return Array.from(
      node.querySelectorAll?.(".con-button, button, a.con-button") || []
    ).map((button) => button.cloneNode(true));
  });
  if (!buttons.length) return null;
  const wrapper = createElement("div", { class: "buttons-wrapper" });
  buttons.forEach((button, index) => {
    const container = index === 0 ? createElement("p") : createElement("div", {
      class: "supplemental-text body-xl action-area"
    });
    container.append(button);
    wrapper.append(container);
  });
  return wrapper;
}
function buildMerchHeadingContent(card) {
  const fragment = document.createDocumentFragment();
  const headingContent = createElement("div", {
    class: "heading-content content"
  });
  const headingButton = createElement("div", { class: "heading-button" });
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
    headingContent.append(iconRow);
  }
  const titleNode = normalizeHeadingTextNode(
    getFirstSlotNode(card, MINI_COMPARE_CHART_SLOTS.title),
    "tracking-header"
  );
  if (titleNode) headingContent.append(titleNode);
  const descriptionNode = normalizeBodyNode(
    getFirstSlotNode(card, MINI_COMPARE_CHART_SLOTS.description)
  );
  if (descriptionNode) headingContent.append(descriptionNode);
  const priceSourceNodes = cloneSlotNodes(
    card,
    MINI_COMPARE_CHART_SLOTS.prices
  ).flatMap((node) => flattenSlotNodeContent(node));
  const pricingGroups = collectPricingNodes(priceSourceNodes);
  const strikethroughWrapper = createPricingWrapper(
    "pricing-before",
    pricingGroups.strikethrough
  );
  if (strikethroughWrapper) headingButton.append(strikethroughWrapper);
  const priceWrapper = createPricingWrapper("pricing", pricingGroups.price);
  if (priceWrapper) headingButton.append(priceWrapper);
  const legalNodes = pricingGroups.legal.length ? pricingGroups.legal : [createSyntheticLegalPrice(pricingGroups.price)].filter(Boolean);
  const legalWrapper = createPricingWrapper("pricing-after", legalNodes);
  if (legalWrapper) headingButton.append(legalWrapper);
  const buttonsWrapper = buildCanonicalButtonsWrapper(card);
  if (buttonsWrapper) headingButton.append(buttonsWrapper);
  fragment.append(headingContent, headingButton);
  return fragment;
}
function getBadgeData(card) {
  if (!card) return null;
  if (card._masTableBadgeData?.contentHtml || card._masTableBadgeData?.text) {
    return card._masTableBadgeData;
  }
  const badgeSlot = card.querySelector('[slot="badge"]');
  const shadowBadge = card.shadowRoot?.getElementById("badge");
  const badgeElement = badgeSlot?.matches("merch-badge") ? badgeSlot : badgeSlot?.querySelector("merch-badge");
  const contentHtml = badgeElement?.innerHTML?.trim() || badgeSlot?.innerHTML?.trim() || shadowBadge?.innerHTML?.trim() || "";
  const text = badgeElement?.textContent?.trim() || badgeSlot?.textContent?.trim() || shadowBadge?.textContent?.trim() || card.getAttribute("badge-text") || "";
  if (!contentHtml && !text) return null;
  const computedBadgeStyles = shadowBadge ? getComputedStyle(shadowBadge) : null;
  const backgroundColor = resolveColorValue(
    badgeElement?.getAttribute("background-color") || ""
  ) || resolveColorValue(card.getAttribute("badge-background-color") || "") || computedBadgeStyles?.backgroundColor || "";
  const textColor = resolveColorValue(badgeElement?.getAttribute("color") || "") || resolveColorValue(card.getAttribute("badge-color") || "") || computedBadgeStyles?.color || "";
  return {
    contentHtml,
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
  const content = createElement("span", { class: "badge-inline-content" });
  const icon = createBadgeIcon(badgeData.icon);
  const hasLabelContent = Boolean(badgeData.contentHtml || badgeData.text);
  if (icon) content.append(icon);
  if (icon && hasLabelContent) {
    content.append(document.createTextNode(" "));
  }
  if (badgeData.contentHtml) {
    const template = document.createElement("template");
    template.innerHTML = badgeData.contentHtml;
    content.append(template.content.cloneNode(true));
  } else if (badgeData.text) {
    content.append(document.createTextNode(badgeData.text));
  }
  return content;
}
function parseBadgeDataFromFields(fields = {}) {
  const badgeValue = fields.badge;
  if (!badgeValue) return null;
  if (typeof badgeValue !== "string") {
    const text2 = String(badgeValue).trim();
    if (!text2) return null;
    return {
      contentHtml: "",
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
  const contentHtml = badgeElement?.innerHTML?.trim() || "";
  const text = badgeElement?.textContent?.trim() || badgeValue.trim();
  if (!contentHtml && !text) return null;
  return {
    contentHtml,
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
  if (!table.classList.contains("merch") && !table.classList.contains("compare-chart-features") || !table.classList.contains("highlight")) {
    return;
  }
  const highlightRow = table.firstElementChild;
  if (!highlightRow) return;
  const cells = Array.from(highlightRow.children);
  const columnOffset = table.classList.contains("compare-chart-features") ? 1 : 0;
  cardIds.forEach((cardId, index) => {
    const cell = cells[index + columnOffset];
    const badgeData = getBadgeData(merchCardMap.get(cardId));
    if (!cell) return;
    if (!badgeData?.contentHtml && !badgeData?.text) {
      cell.removeAttribute("data-has-badge");
      cell.replaceChildren();
      return;
    }
    cell.dataset.hasBadge = "true";
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
  if (!table.classList.contains("merch") && !table.classList.contains("compare-chart-features") || !cardIds?.length) {
    return;
  }
  const rows = Array.from(table.children);
  if (!rows.length) return;
  const headingRowIndex = table.classList.contains("highlight") && rows.length > 1 ? 1 : 0;
  const headingRow = rows[headingRowIndex];
  if (!headingRow) return;
  const cells = Array.from(headingRow.children);
  const columnOffset = table.classList.contains("compare-chart-features") ? 1 : 0;
  cardIds.forEach((cardId, index) => {
    const cell = cells[index + columnOffset];
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
var _cleanup, _currentRenderId, _log, _service3, _resolveUpdate, _rejectUpdate, _startMarkName, _durationMarkName, _updateComplete, _heightRuleStyle, _content, _scratch;
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
    __privateAdd(this, _heightRuleStyle);
    __privateAdd(this, _content);
    __privateAdd(this, _scratch);
    __privateSet(this, _heightRuleStyle, document.createElement("style"));
    __privateGet(this, _heightRuleStyle).setAttribute(TABLE_HEIGHT_RULE_ATTR, "");
    __privateSet(this, _content, document.createElement("div"));
    __privateSet(this, _scratch, document.createElement("div"));
    __privateGet(this, _scratch).className = "mas-table-scratch";
    __privateGet(this, _scratch).hidden = true;
    __privateGet(this, _scratch).setAttribute("aria-hidden", "true");
    this.append(
      __privateGet(this, _heightRuleStyle),
      __privateGet(this, _content),
      __privateGet(this, _scratch)
    );
    this.handleAemFragmentEvents = this.handleAemFragmentEvents.bind(this);
  }
  connectedCallback() {
    const tagName = this.localName || TAG_NAME;
    __privateSet(this, _service3, getService());
    __privateGet(this, _log) ?? __privateSet(this, _log, __privateGet(this, _service3)?.Log?.module?.(tagName) ?? __privateGet(this, _service3)?.log?.module?.(tagName) ?? console);
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
      await settleMasElements(this);
      __privateGet(this, _content).querySelectorAll(".table").forEach((table) => syncHeadingHeights(table));
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
    const tagName = this.localName || TAG_NAME;
    const detail = {
      ...this.aemFragment?.fetchInfo,
      ...__privateGet(this, _service3)?.duration,
      ...details,
      message
    };
    __privateGet(this, _log)?.error?.(`${tagName}: ${message}`, detail);
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
_heightRuleStyle = new WeakMap();
_content = new WeakMap();
_scratch = new WeakMap();
customElements.define(TAG_NAME, MasTable);
export {
  MasTable
};
//# sourceMappingURL=mas-table.js.map
