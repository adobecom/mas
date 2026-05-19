// Guard against duplicate custom element registration.
// When mas-ost is loaded inside MAS Studio, SWC components are already registered.
// We wrap customElements.define to silently skip already-defined elements.
// This must run before ANY other imports.
if (!window.__masOstSafeDefine) {
    window.__masOstSafeDefine = true;
    const origDefine = CustomElementRegistry.prototype.define;
    CustomElementRegistry.prototype.define = function(name, ctor, options) {
        if (this.get(name)) return;
        return origDefine.call(this, name, ctor, options);
    };
}

// Suppress SWC sp-picker overlay crash in MAS Studio's nested shadow DOM.
// sp-picker's strategy constructor accesses button.ownerDocument during
// firstUpdated(), but the #button query returns null in this context.
// This is non-fatal — the picker retries on the next update cycle.
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes("reading 'ownerDocument'")) {
        e.preventDefault();
    }
});

// Debug marker and error catcher
window.__masOstLoading = true;
window.__masOstErrors = [];
window.addEventListener('error', function(e) {
    window.__masOstErrors.push(e.message + ' at ' + (e.filename || '').split('/').pop() + ':' + e.lineno);
});
