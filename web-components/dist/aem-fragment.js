var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

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
var EVENT_AEM_LOAD = "aem:load";
var EVENT_AEM_ERROR = "aem:error";
var LOG_NAMESPACE = "mas/commerce";
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
var log = Log.module("utilities");
var FETCH_INFO_HEADERS = {
  requestId: HEADER_X_REQUEST_ID,
  etag: "Etag",
  lastModified: "Last-Modified",
  serverTiming: "server-timing"
};
function getLogHeaders(response) {
  const logHeaders = {};
  if (!response?.headers) return logHeaders;
  const headers = response.headers;
  for (const [key, value] of Object.entries(FETCH_INFO_HEADERS)) {
    let headerValue = headers.get(value);
    if (headerValue) {
      headerValue = headerValue.replace(/[,;]/g, "|");
      headerValue = headerValue.replace(/[| ]+/g, "|");
      logHeaders[key] = headerValue;
    }
  }
  return logHeaders;
}

// src/utils.js
var MAS_COMMERCE_SERVICE = "mas-commerce-service";
function printMeasure(measure) {
  return `startTime:${measure.startTime.toFixed(2)}|duration:${measure.duration.toFixed(2)}`;
}
function getService() {
  return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}

// src/utils/mas-fetch.js
async function masFetch(resource, options = {}, retries = 2, baseDelay = 100) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(resource, options);
      response.retryCount = attempt;
      return response;
    } catch (error) {
      lastError = error;
      lastError.retryCount = attempt;
      if (attempt > retries) break;
      await new Promise(
        (resolve) => setTimeout(resolve, baseDelay * (attempt + 1))
      );
    }
  }
  throw lastError;
}

// src/aem-fragment.js
var ATTRIBUTE_FRAGMENT = "fragment";
var ATTRIBUTE_AUTHOR = "author";
var ATTRIBUTE_PREVIEW = "preview";
var ATTRIBUTE_LOADING = "loading";
var ATTRIBUTE_TIMEOUT = "timeout";
var AEM_FRAGMENT_TAG_NAME = "aem-fragment";
var LOADING_EAGER = "eager";
var LOADING_CACHE = "cache";
var LOADING_VALUES = [LOADING_EAGER, LOADING_CACHE];
var _fragmentCache, _fetchInfos, _promises;
var FragmentCache = class {
  constructor() {
    __privateAdd(this, _fragmentCache, /* @__PURE__ */ new Map());
    __privateAdd(this, _fetchInfos, /* @__PURE__ */ new Map());
    __privateAdd(this, _promises, /* @__PURE__ */ new Map());
  }
  clear() {
    __privateGet(this, _fragmentCache).clear();
    __privateGet(this, _fetchInfos).clear();
    __privateGet(this, _promises).clear();
  }
  /**
   * Add fragment to cache
   * @param {Object} fragment fragment object.
   */
  add(fragment, references = true) {
    if (this.has(fragment.id)) return;
    if (this.has(fragment.fields?.originalId)) return;
    __privateGet(this, _fragmentCache).set(fragment.id, fragment);
    if (fragment.fields?.originalId) {
      __privateGet(this, _fragmentCache).set(fragment.fields.originalId, fragment);
    }
    if (__privateGet(this, _promises).has(fragment.id)) {
      const [, resolve] = __privateGet(this, _promises).get(fragment.id);
      resolve();
    }
    if (__privateGet(this, _promises).has(fragment.fields?.originalId)) {
      const [, resolve] = __privateGet(this, _promises).get(fragment.fields?.originalId);
      resolve();
    }
    if (!references || typeof fragment.references !== "object" || Array.isArray(fragment.references))
      return;
    for (const key in fragment.references) {
      const { type, value } = fragment.references[key];
      if (type === "content-fragment") {
        value.settings = {
          ...fragment?.settings,
          ...value.settings
        };
        value.placeholders = {
          ...fragment?.placeholders,
          ...value.placeholders
        };
        value.dictionary = {
          ...fragment?.dictionary,
          ...value.dictionary
        };
        value.priceLiterals = {
          ...fragment?.priceLiterals,
          ...value.priceLiterals
        };
        this.add(value, fragment);
      }
    }
  }
  has(fragmentId) {
    return __privateGet(this, _fragmentCache).has(fragmentId);
  }
  entries() {
    return __privateGet(this, _fragmentCache).entries();
  }
  get(key) {
    return __privateGet(this, _fragmentCache).get(key);
  }
  getAsPromise(key) {
    let [promise] = __privateGet(this, _promises).get(key) ?? [];
    if (promise) {
      return promise;
    }
    let resolveFn;
    promise = new Promise((resolve) => {
      resolveFn = resolve;
      if (this.has(key)) {
        resolve();
      }
    });
    __privateGet(this, _promises).set(key, [promise, resolveFn]);
    return promise;
  }
  getFetchInfo(fragmentId) {
    let fetchInfo = __privateGet(this, _fetchInfos).get(fragmentId);
    if (!fetchInfo) {
      fetchInfo = {
        url: null,
        retryCount: 0,
        stale: false,
        measure: null,
        status: null
      };
      __privateGet(this, _fetchInfos).set(fragmentId, fetchInfo);
    }
    return fetchInfo;
  }
  remove(fragmentId) {
    __privateGet(this, _fragmentCache).delete(fragmentId);
    __privateGet(this, _fetchInfos).delete(fragmentId);
    __privateGet(this, _promises).delete(fragmentId);
  }
};
_fragmentCache = new WeakMap();
_fetchInfos = new WeakMap();
_promises = new WeakMap();
var cache = new FragmentCache();
var _log, _rawData, _data, _service, _fragmentId, _fetchInfo, _loading, _timeout, _fetchPromise, _author, _fetchCount, _preview, _AemFragment_instances, getFragmentById_fn, applyHeaders_fn, fail_fn, fetchData_fn;
var AemFragment = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _AemFragment_instances);
    __publicField(this, "cache", cache);
    __privateAdd(this, _log);
    __privateAdd(this, _rawData, null);
    __privateAdd(this, _data, null);
    __privateAdd(this, _service, null);
    /**
     * @type {string} fragment id
     */
    __privateAdd(this, _fragmentId);
    __privateAdd(this, _fetchInfo);
    __privateAdd(this, _loading, LOADING_EAGER);
    __privateAdd(this, _timeout, 5e3);
    /**
     * Internal promise to track if fetching is in progress.
     */
    __privateAdd(this, _fetchPromise);
    __privateAdd(this, _author, false);
    __privateAdd(this, _fetchCount, 0);
    __privateAdd(this, _preview);
  }
  static get observedAttributes() {
    return [
      ATTRIBUTE_FRAGMENT,
      ATTRIBUTE_LOADING,
      ATTRIBUTE_TIMEOUT,
      ATTRIBUTE_AUTHOR,
      ATTRIBUTE_PREVIEW
    ];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === ATTRIBUTE_FRAGMENT) {
      __privateSet(this, _fragmentId, newValue);
      __privateSet(this, _fetchInfo, cache.getFetchInfo(newValue));
    }
    if (name === ATTRIBUTE_LOADING && LOADING_VALUES.includes(newValue)) {
      __privateSet(this, _loading, newValue);
    }
    if (name === ATTRIBUTE_TIMEOUT) {
      __privateSet(this, _timeout, parseInt(newValue, 10));
    }
    if (name === ATTRIBUTE_AUTHOR) {
      __privateSet(this, _author, ["", "true"].includes(newValue));
    }
    if (name === ATTRIBUTE_PREVIEW) {
      __privateSet(this, _preview, newValue);
    }
  }
  connectedCallback() {
    if (__privateGet(this, _fetchPromise)) return;
    __privateGet(this, _service) ?? __privateSet(this, _service, getService(this));
    __privateSet(this, _preview, __privateGet(this, _service).settings?.preview);
    __privateGet(this, _log) ?? __privateSet(this, _log, __privateGet(this, _service).log.module(
      `${AEM_FRAGMENT_TAG_NAME}[${__privateGet(this, _fragmentId)}]`
    ));
    if (!__privateGet(this, _fragmentId) || __privateGet(this, _fragmentId) === "#") {
      __privateGet(this, _fetchInfo) ?? __privateSet(this, _fetchInfo, cache.getFetchInfo("missing-fragment-id"));
      __privateMethod(this, _AemFragment_instances, fail_fn).call(this, "Missing fragment id");
      return;
    }
    this.refresh(false);
  }
  get fetchInfo() {
    return Object.fromEntries(
      Object.entries(__privateGet(this, _fetchInfo)).filter(([key, value]) => value != void 0).map(([key, value]) => [`aem-fragment:${key}`, value])
    );
  }
  async refresh(flushCache = true) {
    if (__privateGet(this, _fetchPromise)) {
      const ready = await Promise.race([
        __privateGet(this, _fetchPromise),
        Promise.resolve(false)
      ]);
      if (!ready) return;
    }
    if (flushCache) {
      cache.remove(__privateGet(this, _fragmentId));
    }
    if (__privateGet(this, _loading) === LOADING_CACHE) {
      await Promise.race([
        cache.getAsPromise(__privateGet(this, _fragmentId)),
        new Promise((resolve) => setTimeout(resolve, __privateGet(this, _timeout)))
      ]);
    }
    try {
      __privateSet(this, _fetchPromise, __privateMethod(this, _AemFragment_instances, fetchData_fn).call(this));
      await __privateGet(this, _fetchPromise);
    } catch (e) {
      __privateMethod(this, _AemFragment_instances, fail_fn).call(this, e.message);
      return false;
    }
    const { references, referencesTree, placeholders, wcs } = __privateGet(this, _rawData) || {};
    if (wcs && !getParameter("mas.disableWcsCache")) {
      __privateGet(this, _service).prefillWcsCache(wcs);
    }
    this.dispatchEvent(
      new CustomEvent(EVENT_AEM_LOAD, {
        detail: {
          ...this.data,
          references,
          referencesTree,
          placeholders,
          ...__privateGet(this, _fetchInfo)
          // Spread all fetch info
        },
        bubbles: true,
        composed: true
      })
    );
    return __privateGet(this, _fetchPromise);
  }
  get updateComplete() {
    return __privateGet(this, _fetchPromise) ?? Promise.reject(new Error("AEM fragment cannot be loaded"));
  }
  get data() {
    if (__privateGet(this, _data)) return __privateGet(this, _data);
    if (__privateGet(this, _author)) {
      this.transformAuthorData();
    } else {
      this.transformPublishData();
    }
    return __privateGet(this, _data);
  }
  get rawData() {
    return __privateGet(this, _rawData);
  }
  transformAuthorData() {
    const {
      fields,
      id,
      tags,
      settings = {},
      priceLiterals = {},
      dictionary = {},
      placeholders = {}
    } = __privateGet(this, _rawData);
    __privateSet(this, _data, fields.reduce(
      (acc, { name, multiple, values }) => {
        acc.fields[name] = multiple ? values : values[0];
        return acc;
      },
      {
        fields: {},
        id,
        tags,
        settings,
        priceLiterals,
        dictionary,
        placeholders
      }
    ));
  }
  transformPublishData() {
    const {
      fields,
      id,
      tags,
      settings = {},
      priceLiterals = {},
      dictionary = {},
      placeholders = {}
    } = __privateGet(this, _rawData);
    __privateSet(this, _data, Object.entries(fields).reduce(
      (acc, [key, value]) => {
        acc.fields[key] = value?.mimeType ? value.value : value ?? "";
        return acc;
      },
      {
        fields: {},
        id,
        tags,
        settings,
        priceLiterals,
        dictionary,
        placeholders
      }
    ));
  }
  /**
   * Gets the URL for loading fragment-client.js based on maslibs parameter
   * @returns {string} URL for fragment-client.js
   */
  getFragmentClientUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const masLibs = urlParams.get("maslibs");
    if (!masLibs || masLibs.trim() === "") {
      return "https://mas.adobe.com/studio/libs/fragment-client.js";
    }
    const sanitizedMasLibs = masLibs.trim().toLowerCase();
    if (sanitizedMasLibs === "local") {
      return "http://localhost:3000/studio/libs/fragment-client.js";
    }
    const { hostname } = window.location;
    const extension = hostname.endsWith(".page") ? "page" : "live";
    if (sanitizedMasLibs.includes("--")) {
      return `https://${sanitizedMasLibs}.aem.${extension}/studio/libs/fragment-client.js`;
    }
    return `https://${sanitizedMasLibs}--mas--adobecom.aem.${extension}/studio/libs/fragment-client.js`;
  }
  async generatePreview() {
    const fragmentClientUrl = this.getFragmentClientUrl();
    const { previewFragment } = await import(fragmentClientUrl);
    const data = await previewFragment(__privateGet(this, _fragmentId), {
      locale: __privateGet(this, _service).settings.locale,
      apiKey: __privateGet(this, _service).settings.wcsApiKey
    });
    return data;
  }
};
_log = new WeakMap();
_rawData = new WeakMap();
_data = new WeakMap();
_service = new WeakMap();
_fragmentId = new WeakMap();
_fetchInfo = new WeakMap();
_loading = new WeakMap();
_timeout = new WeakMap();
_fetchPromise = new WeakMap();
_author = new WeakMap();
_fetchCount = new WeakMap();
_preview = new WeakMap();
_AemFragment_instances = new WeakSet();
getFragmentById_fn = async function(endpoint) {
  __privateWrapper(this, _fetchCount)._++;
  const markPrefix = `${AEM_FRAGMENT_TAG_NAME}:${__privateGet(this, _fragmentId)}:${__privateGet(this, _fetchCount)}`;
  const startMarkName = `${markPrefix}${MARK_START_SUFFIX}`;
  const measureName = `${markPrefix}${MARK_DURATION_SUFFIX}`;
  if (__privateGet(this, _preview)) {
    return await this.generatePreview();
  }
  performance.mark(startMarkName);
  let response;
  try {
    __privateGet(this, _fetchInfo).stale = false;
    __privateGet(this, _fetchInfo).url = endpoint;
    response = await masFetch(endpoint, {
      cache: "default",
      credentials: "omit"
    });
    __privateMethod(this, _AemFragment_instances, applyHeaders_fn).call(this, response);
    __privateGet(this, _fetchInfo).status = response?.status;
    __privateGet(this, _fetchInfo).measure = printMeasure(
      performance.measure(measureName, startMarkName)
    );
    __privateGet(this, _fetchInfo).retryCount = response.retryCount;
    if (!response?.ok) {
      throw new MasError("Unexpected fragment response", {
        response,
        ...__privateGet(this, _service).duration
      });
    }
    return await response.json();
  } catch (e) {
    __privateGet(this, _fetchInfo).measure = printMeasure(
      performance.measure(measureName, startMarkName)
    );
    __privateGet(this, _fetchInfo).retryCount = e.retryCount;
    if (__privateGet(this, _rawData)) {
      __privateGet(this, _fetchInfo).stale = true;
      __privateGet(this, _log).error(`Serving stale data`, __privateGet(this, _fetchInfo));
      return __privateGet(this, _rawData);
    }
    const reason = e.message ?? "unknown";
    throw new MasError(`Failed to fetch fragment: ${reason}`, {});
  }
};
applyHeaders_fn = function(response) {
  Object.assign(__privateGet(this, _fetchInfo), getLogHeaders(response));
};
fail_fn = function(message) {
  __privateSet(this, _fetchPromise, null);
  __privateGet(this, _fetchInfo).message = message;
  this.classList.add("error");
  const detail = {
    ...__privateGet(this, _fetchInfo),
    ...__privateGet(this, _service).duration
  };
  __privateGet(this, _log).error(message, detail);
  this.dispatchEvent(
    new CustomEvent(EVENT_AEM_ERROR, {
      detail,
      bubbles: true,
      composed: true
    })
  );
};
fetchData_fn = async function() {
  var _a;
  this.classList.remove("error");
  __privateSet(this, _data, null);
  let fragment = cache.get(__privateGet(this, _fragmentId));
  if (fragment) {
    __privateSet(this, _rawData, fragment);
    return true;
  }
  const { masIOUrl, wcsApiKey, country, locale } = __privateGet(this, _service).settings;
  let endpoint = `${masIOUrl}/fragment?id=${__privateGet(this, _fragmentId)}&api_key=${wcsApiKey}&locale=${locale}`;
  if (country && !locale.endsWith(`_${country}`)) {
    endpoint += `&country=${country}`;
  }
  fragment = await __privateMethod(this, _AemFragment_instances, getFragmentById_fn).call(this, endpoint);
  (_a = fragment.fields).originalId ?? (_a.originalId = __privateGet(this, _fragmentId));
  cache.add(fragment);
  __privateSet(this, _rawData, fragment);
  return true;
};
// TO be deprecated
__publicField(AemFragment, "cache", cache);
customElements.define(AEM_FRAGMENT_TAG_NAME, AemFragment);
export {
  AemFragment
};
//# sourceMappingURL=aem-fragment.js.map
