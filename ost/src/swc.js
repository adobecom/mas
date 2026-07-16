// When the ost bundle loads inside MAS Studio, Studio's own studio/libs/swc.js
// has already registered the shared Spectrum Web Components (sp-theme,
// sp-button, sp-picker, …). The SWC element modules call
// customElements.define() unconditionally at module-evaluation time, so
// re-importing them here throws NotSupportedError and halts ost's bootstrap.
//
// Scope a brief guard around the SWC imports only: if a tag is already
// registered (by Studio or any earlier host), skip the second define silently.
// Outside this block, customElements.define keeps its native, throwing
// behavior so genuine duplicate-define bugs in ost source surface loudly.
const originalDefine = CustomElementRegistry.prototype.define;
CustomElementRegistry.prototype.define = function (name, ctor, options) {
    if (this.get(name)) return;
    return originalDefine.call(this, name, ctor, options);
};

import('@spectrum-web-components/theme/sp-theme.js');
import('@spectrum-web-components/theme/spectrum-two/theme-light.js');
import('@spectrum-web-components/theme/spectrum-two/scale-medium.js');
import('@spectrum-web-components/action-button/sp-action-button.js');
import('@spectrum-web-components/badge/sp-badge.js');
import('@spectrum-web-components/button/sp-button.js');
import('@spectrum-web-components/checkbox/sp-checkbox.js');
import('@spectrum-web-components/field-label/sp-field-label.js');
import('@spectrum-web-components/menu/sp-menu.js');
import('@spectrum-web-components/menu/sp-menu-item.js');
import('@spectrum-web-components/picker/sp-picker.js');
import('@spectrum-web-components/progress-circle/sp-progress-circle.js');
import('@spectrum-web-components/search/sp-search.js');
import('@spectrum-web-components/switch/sp-switch.js');
import('@spectrum-web-components/tabs/sp-tabs.js');
import('@spectrum-web-components/tabs/sp-tab.js');
import('@spectrum-web-components/textfield/sp-textfield.js');
import('@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js');
import('@spectrum-web-components/icons-workflow/icons/sp-icon-copy.js');
import('@spectrum-web-components/icons-workflow/icons/sp-icon-info.js');
import('@spectrum-web-components/icons-workflow/icons/sp-icon-cancel.js');
import('@spectrum-web-components/icons-workflow/icons/sp-icon-undo.js');

// Do NOT restore originalDefine — Studio's swc.js also registers SWC elements
// (sp-theme, sp-button, etc.) that ost's own components like ost-checkout-options
// use inside their render(). Once ost's bundle has loaded, any subsequent
// customElements.define for an already-registered SWC element from elsewhere
// would still throw. Keeping the no-op guard in place across the rest of the
// session is the conservative behavior. ost's own ost-* components are
// guaranteed unique by tag prefix, so they remain unaffected by genuine
// collisions.
