/**
 * Base class for the components merch-card, merch-card-collection,
 * merch-quantity-select and merch-sidenav ship without Lit. It keeps Lit's
 * public contract: `static properties` (type, attribute, reflect, converter,
 * state), requestUpdate(), updateComplete, willUpdate/firstUpdated/updated and
 * values assigned before the element was upgraded.
 *
 * render() returns a string built with `html`, which escapes every value.
 * When it differs from the previous render, the shadow DOM is patched in
 * place: nodes the render left unchanged are not touched, even if other code
 * moved them, changed nodes get only the attributes and text that changed,
 * and only new nodes are created. As with Lit, focus, listeners and changes
 * other code made to rendered nodes survive, and nodes other code added are
 * kept. bindEvents() runs after every render to attach listeners with on().
 */

const ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

class Markup {
    constructor(value) {
        this.value = value;
    }

    toString() {
        return this.value;
    }
}

/** Renders nothing. The same registered symbol as Lit's `nothing`. */
export const nothing = Symbol.for('lit-nothing');

const toMarkup = (value) => {
    if (value == null || value === nothing) return '';
    if (value instanceof Markup) return value.value;
    if (Array.isArray(value)) return value.map(toMarkup).join('');
    return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
};

/** Escapes interpolated values, except nested html and unsafeHTML results. */
export const html = (strings, ...values) =>
    new Markup(
        strings.reduce(
            (markup, string, index) =>
                markup + toMarkup(values[index - 1]) + string,
        ),
    );

/** Inserts trusted markup as is. */
export const unsafeHTML = (value) => new Markup(value ?? '');

const listeners = new WeakMap();

/** Sets the listener of `type` on `element`, replacing the previous one. */
export function on(element, type, listener) {
    if (!element) return;
    let byType = listeners.get(element);
    if (!byType) listeners.set(element, (byType = new Map()));
    if (!byType.has(type)) {
        element.addEventListener(type, (event) => byType.get(type)(event));
    }
    byType.set(type, listener);
}

// Each rendered node keeps the parsed template node it was rendered from and
// the child nodes it rendered, aligned with that template node's children.
const rendered = new WeakMap();

function record(node, source) {
    rendered.set(node, { source, children: [...node.childNodes] });
    node.childNodes.forEach((child, index) =>
        record(child, source.childNodes[index]),
    );
}

// Pairs each next child with the previous one it updates: equal nodes along
// their longest common subsequence, then nodes of the same type in between.
function match(previous, next) {
    const equal = previous.map((node) =>
        next.map((other) => node.isEqualNode(other)),
    );
    const lengths = [...previous, null].map(() =>
        Array(next.length + 1).fill(0),
    );
    for (let i = previous.length - 1; i >= 0; i--) {
        for (let j = next.length - 1; j >= 0; j--) {
            lengths[i][j] = equal[i][j]
                ? lengths[i + 1][j + 1] + 1
                : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
        }
    }
    const matches = [];
    let [i, j, gapI, gapJ] = [0, 0, 0, 0];
    const pairGap = () => {
        for (; gapJ < j; gapJ++) {
            let k = gapI;
            while (k < i && previous[k].nodeName !== next[gapJ].nodeName) k++;
            if (k === i) continue;
            matches[gapJ] = { index: k, changed: true };
            gapI = k + 1;
        }
    };
    while (i < previous.length && j < next.length) {
        if (equal[i][j]) {
            pairGap();
            matches[j] = { index: i, changed: false };
            [i, j] = [i + 1, j + 1];
            [gapI, gapJ] = [i, j];
        } else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++;
        else j++;
    }
    [i, j] = [previous.length, next.length];
    pairGap();
    return matches;
}

function patchChildren(parent, previous, source) {
    const state = rendered.get(parent);
    const next = [...source.childNodes];
    const matches = match([...previous.childNodes], next);
    let cursor;
    const children = next.map((sourceNode, index) => {
        let node = state.children[matches[index]?.index];
        if (node && matches[index].changed) patchNode(node, sourceNode);
        if (!node) {
            node = document.importNode(sourceNode, true);
            record(node, sourceNode);
            if (cursor) cursor.after(node);
            else parent.prepend(node);
        }
        if (node.parentNode === parent) cursor = node;
        return node;
    });
    const kept = new Set(children);
    for (const node of state.children) {
        if (!kept.has(node) && node.parentNode === parent) node.remove();
    }
    state.children = children;
}

function patchNode(node, source) {
    const state = rendered.get(node);
    const previous = state.source;
    state.source = source;
    if (source.nodeType !== Node.ELEMENT_NODE) {
        node.data = source.data;
        return;
    }
    for (const { name, value } of source.attributes) {
        if (previous.getAttribute(name) !== value) {
            node.setAttribute(name, value);
        }
    }
    for (const { name } of previous.attributes) {
        if (!source.hasAttribute(name)) node.removeAttribute(name);
    }
    patchChildren(node, previous, source);
}

function patch(root, markup) {
    if (!rendered.has(root)) {
        rendered.set(root, {
            source: document.createDocumentFragment(),
            children: [],
        });
    }
    const template = document.createElement('template');
    template.innerHTML = markup;
    const state = rendered.get(root);
    patchChildren(root, state.source, template.content);
    state.source = template.content;
}

const notEqual = (value, old) =>
    old !== value && (old === old || value === value);

const fromAttribute = (value, type) => {
    if (type === Boolean) return value !== null;
    if (type === Number) return value === null ? null : Number(value);
    if (type === Object || type === Array) {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    return value;
};

const toAttribute = (value, type) => {
    if (type === Boolean) return value ? '' : null;
    if (type === Object || type === Array) {
        return value == null ? value : JSON.stringify(value);
    }
    return value;
};

const classes = new WeakMap();

// Per element update state. A WeakMap rather than private class fields, which
// the es2020 build would otherwise turn into helper code in every bundle.
const states = new WeakMap();

function finalize(ctor) {
    let info = classes.get(ctor);
    if (info) return info;
    const properties = new Map();
    const attributes = new Map();
    for (const [name, options] of Object.entries(ctor.properties ?? {})) {
        const attribute =
            options.state || options.attribute === false
                ? undefined
                : typeof options.attribute === 'string'
                  ? options.attribute
                  : name.toLowerCase();
        properties.set(name, { ...options, attribute });
        if (attribute) attributes.set(attribute, name);
        if (Object.hasOwn(ctor.prototype, name)) continue;
        Object.defineProperty(ctor.prototype, name, {
            get() {
                return states.get(this).values.get(name);
            },
            set(value) {
                const { values } = states.get(this);
                const oldValue = values.get(name);
                values.set(name, value);
                this.requestUpdate(name, oldValue);
            },
            configurable: true,
            enumerable: true,
        });
    }
    let sheet;
    if (ctor.styles) {
        sheet = new CSSStyleSheet();
        sheet.replaceSync(ctor.styles);
    }
    info = { properties, attributes, sheet };
    classes.set(ctor, info);
    return info;
}

function reflect(element, state, name) {
    const { attribute, converter, type } = state.info.properties.get(name);
    if (!attribute) return;
    const value = (converter?.toAttribute ?? toAttribute)(element[name], type);
    state.reflectingProperty = name;
    if (value == null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, value);
    state.reflectingProperty = null;
}

function markUpdated(state) {
    state.changed = new Map();
    state.pending = false;
}

function performUpdate(element, state) {
    if (!state.pending) return;
    if (state.instanceValues) {
        for (const [name, value] of state.instanceValues) element[name] = value;
        state.instanceValues = undefined;
    }
    const { changed } = state;
    try {
        element.willUpdate(changed);
        element.update(changed);
    } catch (error) {
        markUpdated(state);
        throw error;
    }
    if (!state.hasUpdated) {
        state.hasUpdated = true;
        element.firstUpdated(changed);
    }
    element.updated(changed);
}

async function enqueueUpdate(element, state) {
    try {
        await state.updatePromise;
    } catch (error) {
        // A failed update must not stop the following ones.
        Promise.reject(error);
    }
    performUpdate(element, state);
    return !state.pending;
}

export class BaseElement extends HTMLElement {
    static get observedAttributes() {
        return [...finalize(this).attributes.keys()];
    }

    constructor() {
        super();
        const info = finalize(this.constructor);
        const state = {
            info,
            values: new Map(),
            changed: new Map(),
            reflecting: new Set(),
            reflectingProperty: null,
            pending: false,
            hasUpdated: false,
        };
        state.updatePromise = new Promise((resolve) => {
            state.enableUpdating = resolve;
        });
        states.set(this, state);
        // Values assigned before upgrade shadow the accessors; apply them on
        // the first update, as Lit does.
        for (const name of info.properties.keys()) {
            if (!Object.hasOwn(this, name)) continue;
            (state.instanceValues ??= new Map()).set(name, this[name]);
            delete this[name];
        }
        this.attachShadow({ mode: 'open' });
        if (info.sheet) this.shadowRoot.adoptedStyleSheets = [info.sheet];
        this.requestUpdate();
    }

    get hasUpdated() {
        return states.get(this).hasUpdated;
    }

    get isUpdatePending() {
        return states.get(this).pending;
    }

    /** Resolves after the pending update, to false if another one is pending. */
    get updateComplete() {
        return states.get(this).updatePromise;
    }

    connectedCallback() {
        states.get(this).enableUpdating(true);
    }

    disconnectedCallback() {}

    attributeChangedCallback(attribute, oldValue, value) {
        const state = states.get(this);
        const name = state.info.attributes.get(attribute);
        if (name === undefined || state.reflectingProperty === name) return;
        const { converter, type } = state.info.properties.get(name);
        const convert =
            typeof converter === 'function'
                ? converter
                : (converter?.fromAttribute ?? fromAttribute);
        state.reflectingProperty = name;
        this[name] = convert(value, type);
        state.reflectingProperty = null;
    }

    /**
     * Schedules an update in a microtask; calls before it runs are batched.
     * @param {string} [name] changed property
     * @param {*} [oldValue] its previous value
     */
    requestUpdate(name, oldValue) {
        const state = states.get(this);
        if (name !== undefined) {
            const options = state.info.properties.get(name) ?? {};
            if (!(options.hasChanged ?? notEqual)(this[name], oldValue)) return;
            if (!state.changed.has(name)) state.changed.set(name, oldValue);
            if (options.reflect && state.reflectingProperty !== name) {
                state.reflecting.add(name);
            }
        }
        if (state.pending) return;
        state.pending = true;
        state.updatePromise = enqueueUpdate(this, state);
    }

    /** Reflects properties and writes render() to the shadow DOM. */
    update() {
        const state = states.get(this);
        const result = this.render();
        const markup = result === nothing ? '' : String(result ?? '');
        for (const name of state.reflecting) reflect(this, state, name);
        state.reflecting.clear();
        markUpdated(state);
        if (markup !== state.markup) {
            state.markup = markup;
            patch(this.shadowRoot, markup);
        }
        this.bindEvents();
    }

    willUpdate() {}

    firstUpdated() {}

    updated() {}

    /** @returns {Markup | string} */
    render() {
        return '';
    }

    /** Attaches listeners and sets properties on rendered nodes with on(). */
    bindEvents() {}
}
