"use strict";
import {
  supportsAdoptingStyleSheets
} from "@spectrum-web-components/base";
import { version } from "@spectrum-web-components/base/src/version.js";
const SystemVariantValues = ["spectrum", "express", "spectrum-two"];
const ScaleValues = [
  "medium",
  "large",
  "medium-express",
  "large-express",
  "medium-spectrum-two",
  "large-spectrum-two"
];
const ColorValues = [
  "light",
  "lightest",
  "dark",
  "darkest",
  "light-express",
  "lightest-express",
  "dark-express",
  "darkest-express",
  "light-spectrum-two",
  "dark-spectrum-two"
];
const _Theme = class _Theme extends HTMLElement {
  constructor() {
    super();
    this._dir = "";
    this._system = "spectrum";
    this._color = "";
    this._scale = "";
    this.trackedChildren = /* @__PURE__ */ new Set();
    this._updateRequested = false;
    this._contextConsumers = /* @__PURE__ */ new Map();
    this.attachShadow({ mode: "open" });
    const node = document.importNode(_Theme.template.content, true);
    this.shadowRoot.appendChild(node);
    this.shouldAdoptStyles();
    this.addEventListener(
      "sp-query-theme",
      this.onQueryTheme
    );
    this.addEventListener(
      "sp-language-context",
      this._handleContextPresence
    );
    this.updateComplete = this.__createDeferredPromise();
  }
  static get observedAttributes() {
    return [
      "color",
      "scale",
      "lang",
      "dir",
      "system",
      /* deprecated attributes, but still observing */
      "theme"
    ];
  }
  set dir(dir) {
    if (dir === this.dir) return;
    this.setAttribute("dir", dir);
    this._dir = dir;
    const targetDir = dir === "rtl" ? dir : "ltr";
    this.trackedChildren.forEach((el) => {
      el.setAttribute("dir", targetDir);
    });
  }
  /**
   * Reading direction of the content scoped to this `sp-theme` element.
   * @type {"ltr" | "rtl" | ""}
   * @attr
   */
  get dir() {
    return this._dir;
  }
  attributeChangedCallback(attrName, old, value) {
    if (old === value) {
      return;
    }
    if (attrName === "color") {
      this.color = value;
    } else if (attrName === "scale") {
      this.scale = value;
    } else if (attrName === "lang" && !!value) {
      this.lang = value;
      this._provideContext();
    } else if (attrName === "theme") {
      this.theme = value;
      if (true) {
        window.__swc.warn(
          this,
          'property theme in <sp-theme> has been deprecated. Please use system instead like this <sp-theme system="spectrum"/>',
          "https://opensource.adobe.com/spectrum-web-components/tools/themes/#deprecation",
          { level: "deprecation" }
        );
        if (value === "spectrum-two") {
          window.__swc.warn(
            this,
            "You are currently using the beta version of Spectrum Two theme. Consumption of this system may be subject to unexpected changes before the 1.0 release of SWC.",
            "https://s2.spectrum.adobe.com/",
            { level: "high" }
          );
        }
      }
    } else if (attrName === "system") {
      this.system = value;
      if (true) {
        if (value === "spectrum-two") {
          window.__swc.warn(
            this,
            "You are currently using the beta version of Spectrum Two theme. Consumption of this system may be subject to unexpected changes before the 1.0 release of SWC.",
            "https://s2.spectrum.adobe.com/",
            { level: "high" }
          );
        }
      }
    } else if (attrName === "dir") {
      this.dir = value;
    }
  }
  requestUpdate() {
    if (window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow) {
      window.ShadyCSS.styleElement(this);
    } else {
      this.shouldAdoptStyles();
    }
  }
  /**
   * The Spectrum system that is applied to the content scoped to this `sp-theme` element.
   *
   * A value is requried.
   * @type {"spectrum" | "express" }
   * @attr
   */
  get system() {
    const systemFragments = _Theme.themeFragmentsByKind.get("system");
    const { name } = systemFragments && systemFragments.get("default") || {};
    return this._system || name || "";
  }
  set system(newValue) {
    if (newValue === this._system) return;
    const system = !!newValue && SystemVariantValues.includes(newValue) ? newValue : this.system;
    if (system !== this._system) {
      this._system = system;
      this.requestUpdate();
    }
    if (system) {
      this.setAttribute("system", system);
    } else {
      this.removeAttribute("system");
    }
  }
  /*
   * @deprecated The `theme` attribute has been deprecated in favor of the `system` attribute.
   */
  get theme() {
    if (!this.system) {
      this.removeAttribute("system");
    }
    return this.system;
  }
  /*
   * @deprecated The `theme` attribute has been deprecated in favor of the `system` attribute.
   */
  set theme(newValue) {
    this.system = newValue;
    this.requestUpdate();
  }
  /**
   * The Spectrum color stops to apply to content scoped by this `sp-theme` element.
   *
   * A value is requried.
   * @type {"lightest" | "light" | "dark" | "darkest" | ""}
   * @attr
   */
  get color() {
    const themeFragments = _Theme.themeFragmentsByKind.get("color");
    const { name } = themeFragments && themeFragments.get("default") || {};
    return this._color || name || "";
  }
  set color(newValue) {
    if (newValue === this._color) return;
    const color = !!newValue && ColorValues.includes(newValue) ? newValue : this.color;
    if (color !== this._color) {
      this._color = color;
      this.requestUpdate();
    }
    if (color) {
      this.setAttribute("color", color);
    } else {
      this.removeAttribute("color");
    }
  }
  /**
   * The Spectrum platform scale to apply to content scoped by this `sp-theme` element.
   *
   * A value is requried.
   * @type {"medium" | "large" | ""}
   * @attr
   */
  get scale() {
    const themeFragments = _Theme.themeFragmentsByKind.get("scale");
    const { name } = themeFragments && themeFragments.get("default") || {};
    return this._scale || name || "";
  }
  set scale(newValue) {
    if (newValue === this._scale) return;
    const scale = !!newValue && ScaleValues.includes(newValue) ? newValue : this.scale;
    if (scale !== this._scale) {
      this._scale = scale;
      this.requestUpdate();
    }
    if (scale) {
      this.setAttribute("scale", scale);
    } else {
      this.removeAttribute("scale");
    }
  }
  get styles() {
    const themeKinds = [
      ..._Theme.themeFragmentsByKind.keys()
    ];
    const getStyle = (fragments, name, kind) => {
      const currentStyles = kind && kind !== "theme" && kind !== "system" && this.theme !== "spectrum" && this.system !== "spectrum" ? fragments.get(`${name}-${this.system}`) : fragments.get(name);
      const isAppliedFragment = name === "spectrum" || !kind || this.hasAttribute(kind);
      if (currentStyles && isAppliedFragment) {
        return currentStyles.styles;
      }
      return;
    };
    const styles = themeKinds.reduce((acc, kind) => {
      const kindFragments = _Theme.themeFragmentsByKind.get(
        kind
      );
      let style;
      if (kind === "app" || kind === "core") {
        style = getStyle(kindFragments, kind);
      } else {
        const { [kind]: name } = this;
        style = getStyle(kindFragments, name, kind);
      }
      if (style) {
        acc.push(style);
      }
      return acc;
    }, []);
    if (true) {
      const issues = [];
      const checkForAttribute = (name, resolvedValue, actualValue) => {
        var _a;
        const systemModifier = this.system && this.system !== "spectrum" ? `-${this.system}` : "";
        if (!resolvedValue) {
          issues.push(
            `You have not explicitly set the "${name}" attribute and there is no default value on which to fallback.`
          );
        } else if (!actualValue) {
          issues.push(
            `You have not explicitly set the "${name}" attribute, the default value ("${resolvedValue}") is being used as a fallback.`
          );
        } else if (!((_a = _Theme.themeFragmentsByKind.get(name)) == null ? void 0 : _a.get(
          resolvedValue + (name === "system" ? "" : systemModifier)
        ))) {
          issues.push(
            `You have set "${name}='${resolvedValue}'" but the associated system fragment has not been loaded.`
          );
        }
      };
      checkForAttribute("system", this.system, this._system);
      checkForAttribute("color", this.color, this._color);
      checkForAttribute("scale", this.scale, this._scale);
      if (this.hasAttribute("theme")) {
        issues.push(
          `The "theme" attribute has been deprecated in favor of "system".`
        );
      }
      if (issues.length) {
        window.__swc.warn(
          this,
          "You are leveraging an <sp-theme> element and the following issues may disrupt your theme delivery:",
          "https://opensource.adobe.com/spectrum-web-components/components/theme/#example",
          {
            issues
          }
        );
      }
      if (["lightest", "darkest"].includes(this.color)) {
        window.__swc.warn(
          this,
          `Color lightest and darkest are deprecated and will be removed in a future release`,
          "https://opensource.adobe.com/spectrum-web-components/tools/themes/#deprecation",
          { level: "deprecation" }
        );
      }
    }
    return [...styles];
  }
  static get template() {
    if (!this.templateElement) {
      this.templateElement = document.createElement("template");
      this.templateElement.innerHTML = "<slot></slot>";
    }
    return this.templateElement;
  }
  __createDeferredPromise() {
    return new Promise((resolve) => {
      this.__resolve = resolve;
    });
  }
  /* c8 ignore next 12 */
  onQueryTheme(event) {
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    const { detail: theme } = event;
    theme.color = this.color || void 0;
    theme.scale = this.scale || void 0;
    theme.lang = this.lang || document.documentElement.lang || navigator.language;
    theme.theme = this.system || void 0;
    theme.system = this.system || void 0;
  }
  connectedCallback() {
    this.shouldAdoptStyles();
    if (window.ShadyCSS !== void 0) {
      window.ShadyCSS.styleElement(this);
    }
    _Theme.instances.add(this);
    if (!this.hasAttribute("dir")) {
      let dirParent = this.assignedSlot || this.parentNode;
      while (dirParent !== document.documentElement && !(dirParent instanceof _Theme)) {
        dirParent = dirParent.assignedSlot || // step into the shadow DOM of the parent of a slotted node
        dirParent.parentNode || // DOM Element detected
        dirParent.host;
      }
      this.dir = dirParent.dir === "rtl" ? dirParent.dir : "ltr";
    }
  }
  disconnectedCallback() {
    _Theme.instances.delete(this);
  }
  startManagingContentDirection(el) {
    this.trackedChildren.add(el);
  }
  stopManagingContentDirection(el) {
    this.trackedChildren.delete(el);
  }
  async shouldAdoptStyles() {
    if (!this._updateRequested) {
      this.updateComplete = this.__createDeferredPromise();
      this._updateRequested = true;
      this._updateRequested = await false;
      this.adoptStyles();
      this.__resolve(true);
    }
  }
  adoptStyles() {
    const styles = this.styles;
    if (window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow && window.ShadyCSS.ScopingShim) {
      const fragmentCSS = [];
      for (const [kind, fragments] of _Theme.themeFragmentsByKind) {
        for (const [name, { styles: styles2 }] of fragments) {
          if (name === "default") continue;
          let cssText = styles2.cssText;
          if (!_Theme.defaultFragments.has(name)) {
            cssText = cssText.replace(
              ":host",
              `:host([${kind}='${name}'])`
            );
          }
          fragmentCSS.push(cssText);
        }
      }
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(
        fragmentCSS,
        this.localName
      );
      window.ShadyCSS.prepareTemplate(_Theme.template, this.localName);
    } else if (supportsAdoptingStyleSheets) {
      const styleSheets = [];
      for (const style of styles) {
        styleSheets.push(
          style.styleSheet
        );
      }
      this.shadowRoot.adoptedStyleSheets = styleSheets;
    } else {
      const styleNodes = this.shadowRoot.querySelectorAll("style");
      styleNodes.forEach((element) => element.remove());
      styles.forEach((s) => {
        const style = document.createElement("style");
        style.textContent = s.cssText;
        this.shadowRoot.appendChild(style);
      });
    }
  }
  static registerThemeFragment(name, kind, styles) {
    const fragmentMap = _Theme.themeFragmentsByKind.get(kind) || /* @__PURE__ */ new Map();
    if (fragmentMap.size === 0) {
      _Theme.themeFragmentsByKind.set(kind, fragmentMap);
      fragmentMap.set("default", { name, styles });
      _Theme.defaultFragments.add(name);
    }
    fragmentMap.set(name, { name, styles });
    _Theme.instances.forEach((instance) => instance.shouldAdoptStyles());
  }
  /* c8 ignore next 5 */
  _provideContext() {
    this._contextConsumers.forEach(
      ([callback, unsubscribe]) => callback(this.lang, unsubscribe)
    );
  }
  _handleContextPresence(event) {
    event.stopPropagation();
    const target = event.composedPath()[0];
    if (this._contextConsumers.has(target)) {
      return;
    }
    this._contextConsumers.set(target, [
      event.detail.callback,
      () => this._contextConsumers.delete(target)
    ]);
    const [callback, unsubscribe] = this._contextConsumers.get(target) || [];
    if (callback && unsubscribe) {
      callback(
        this.lang || document.documentElement.lang || navigator.language,
        unsubscribe
      );
    }
  }
};
_Theme.themeFragmentsByKind = /* @__PURE__ */ new Map();
_Theme.defaultFragments = /* @__PURE__ */ new Set(["spectrum"]);
_Theme.instances = /* @__PURE__ */ new Set();
_Theme.VERSION = version;
export let Theme = _Theme;
//# sourceMappingURL=Theme.dev.js.map
