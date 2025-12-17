(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // docs/src/spectrum.mjs
  var import_index_base = __require("@spectrum-css/button/dist/index-base.css");
  var import_spectrum = __require("@spectrum-css/button/dist/themes/spectrum.css");
  var import_index_base2 = __require("@spectrum-css/link/dist/index-base.css");
  var import_dist = __require("@spectrum-css/page/dist/index.css");
  var import_dist2 = __require("@spectrum-css/tokens/dist/index.css");
  var import_dist3 = __require("@spectrum-css/typography/dist/index.css");
})();
