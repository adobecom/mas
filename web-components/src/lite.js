/**
 * Minimal Lit-compatible rendering and reactivity for merch-card and the
 * components it bundles. Supports the subset of Lit those components use:
 * html, nothing, unsafeHTML, ifDefined, child/attribute/boolean/property/event
 * bindings and the ReactiveElement lifecycle (static properties and styles,
 * requestUpdate, updateComplete, willUpdate, firstUpdated, updated) plus
 * reactive controllers (addController, hostConnected, hostDisconnected,
 * hostUpdate, hostUpdated).
 * Template results keep Lit's shape ({ _$litType$, strings, values }).
 */

export const nothing = Symbol.for('lit-nothing');

export const html = (strings, ...values) => ({
    _$litType$: 1,
    strings,
    values,
});

class UnsafeHTML {
    constructor(value) {
        this.value = value;
    }
}

export const unsafeHTML = (value) =>
    value == null || value === nothing ? nothing : new UnsafeHTML(value);

export const ifDefined = (value) => value ?? nothing;

const MARKER = 'lit$';
const TEXT = 0;
const TAG = 1;
const DOUBLE_QUOTED = 2;
const SINGLE_QUOTED = 3;
const COMMENT = 4;
const QUOTES = { [DOUBLE_QUOTED]: '"', [SINGLE_QUOTED]: "'" };
const ATTRIBUTE_TAIL = {
    [TAG]: /([^\s"'>/=]+)\s*=\s*()$/,
    [DOUBLE_QUOTED]: /([^\s"'>/=]+)\s*=\s*"([^"]*)$/,
    [SINGLE_QUOTED]: /([^\s"'>/=]+)\s*=\s*'([^']*)$/,
};
const KINDS = { '@': 'event', '.': 'property', '?': 'boolean' };

const templates = new WeakMap();

const prepare = (strings) => {
    let template = templates.get(strings);
    if (template) return template;
    const parts = [];
    let markup = '';
    let state = TEXT;
    let attribute = null;
    const last = strings.length - 1;
    for (let i = 0; i <= last; i++) {
        const string = strings[i];
        let start = 0;
        if (attribute) {
            const end = attribute.quote ? string.indexOf(attribute.quote) : 0;
            if (end === -1) {
                attribute.strings.push(string);
                attribute.count++;
                continue;
            }
            attribute.strings.push(string.slice(0, end));
            start = attribute.quote ? end + 1 : 0;
            attribute = null;
            state = TAG;
        }
        for (let j = start; j < string.length; j++) {
            const char = string[j];
            if (state === TEXT) {
                if (string.startsWith('<!--', j)) state = COMMENT;
                else if (char === '<' && /[a-zA-Z/]/.test(string[j + 1] ?? ''))
                    state = TAG;
            } else if (state === COMMENT) {
                if (string.startsWith('-->', j)) {
                    markup += '-->';
                    j += 2;
                    state = TEXT;
                    continue;
                }
            } else if (state === TAG) {
                if (char === '"') state = DOUBLE_QUOTED;
                else if (char === "'") state = SINGLE_QUOTED;
                else if (char === '>') state = TEXT;
            } else if (char === QUOTES[state]) state = TAG;
            markup += char;
        }
        if (i === last) break;
        const index = parts.length;
        if (state === TEXT) {
            parts.push({ type: 'child' });
            markup += `<!--?${MARKER}${index}-->`;
        } else if (state === COMMENT) {
            parts.push({ type: 'ignored' });
        } else {
            const match = markup.match(ATTRIBUTE_TAIL[state]);
            const [, rawName, prefix] = match;
            const kind = KINDS[rawName[0]] ?? 'attribute';
            attribute = {
                type: kind,
                name: kind === 'attribute' ? rawName : rawName.slice(1),
                strings: [prefix],
                count: 1,
                quote: QUOTES[state],
            };
            parts.push(attribute);
            markup = `${markup.slice(0, match.index)}${MARKER}${index} `;
        }
    }
    const element = document.createElement('template');
    element.innerHTML = markup;
    template = { element, parts };
    templates.set(strings, template);
    return template;
};

class AttributePart {
    constructor(element, { name, strings }) {
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.single =
            strings.length === 2 && strings[0] === '' && strings[1] === '';
    }

    setValue(values) {
        const { strings } = this;
        let value = values[0];
        if (!this.single) {
            value = values.includes(nothing)
                ? nothing
                : strings.reduce(
                      (result, string, i) =>
                          `${result}${values[i - 1] ?? ''}${string}`,
                  );
        }
        if (Object.is(value, this.value) && 'value' in this) return;
        this.value = value;
        if (value === nothing) this.element.removeAttribute(this.name);
        else this.element.setAttribute(this.name, value ?? '');
    }
}

class BooleanPart extends AttributePart {
    setValue([value]) {
        const enabled = !!value && value !== nothing;
        if (enabled === this.value) return;
        this.value = enabled;
        this.element.toggleAttribute(this.name, enabled);
    }
}

class PropertyPart extends AttributePart {
    setValue([value]) {
        const next = value === nothing ? undefined : value;
        if (Object.is(next, this.value) && 'value' in this) return;
        this.value = next;
        this.element[this.name] = next;
    }
}

class EventPart extends AttributePart {
    constructor(element, part, host) {
        super(element, part);
        this.host = host;
    }

    setValue([value]) {
        const listener = value === nothing ? undefined : value;
        if (!listener !== !this.value) {
            if (listener) this.element.addEventListener(this.name, this);
            else this.element.removeEventListener(this.name, this);
        }
        this.value = listener;
    }

    handleEvent(event) {
        const { value } = this;
        if (typeof value === 'function')
            value.call(this.host ?? this.element, event);
        else value.handleEvent(event);
    }
}

class IgnoredPart {
    setValue() {}
}

const PARTS = {
    attribute: AttributePart,
    boolean: BooleanPart,
    property: PropertyPart,
    event: EventPart,
};

class TemplateInstance {
    constructor(template, options) {
        this.template = template;
        this.options = options;
    }

    clone() {
        const { element, parts } = this.template;
        const fragment = document.importNode(element.content, true);
        const walker = document.createTreeWalker(
            fragment,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
        );
        this.parts = parts.map((part) =>
            part.type === 'ignored' ? new IgnoredPart() : null,
        );
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.COMMENT_NODE) {
                if (node.data.startsWith(`?${MARKER}`)) {
                    const index = Number(node.data.slice(MARKER.length + 1));
                    this.parts[index] = new ChildPart(
                        node,
                        node.nextSibling,
                        this.options,
                    );
                }
                continue;
            }
            for (const name of node.getAttributeNames()) {
                if (!name.startsWith(MARKER)) continue;
                const index = Number(name.slice(MARKER.length));
                node.removeAttribute(name);
                const part = parts[index];
                this.parts[index] = new PARTS[part.type](
                    node,
                    part,
                    this.options?.host,
                );
            }
        }
        return fragment;
    }

    update(values) {
        let i = 0;
        this.template.parts.forEach(({ count }, index) => {
            const part = this.parts[index];
            if (count) {
                part.setValue(values.slice(i, i + count));
                i += count;
            } else part.setValue(values[i++]);
        });
    }
}

class ChildPart {
    constructor(start, end, options) {
        this.start = start;
        this.end = end;
        this.options = options;
        this.type = 'none';
        this.value = nothing;
    }

    insert(node) {
        this.start.parentNode.insertBefore(node, this.end);
    }

    clear() {
        let node = this.start.nextSibling;
        while (node && node !== this.end) {
            const next = node.nextSibling;
            node.remove();
            node = next;
        }
        this.type = 'none';
        this.value = nothing;
    }

    commit(type, value, node) {
        this.clear();
        this.insert(node);
        this.type = type;
        this.value = value;
    }

    setValue(value) {
        if (value == null || value === nothing || value === '') {
            if (this.type !== 'none') this.clear();
        } else if (value._$litType$) this.setTemplate(value);
        else if (value instanceof UnsafeHTML) {
            if (this.type === 'html' && this.value === value.value) return;
            const template = document.createElement('template');
            template.innerHTML = value.value;
            this.commit('html', value.value, template.content);
        } else if (value instanceof Node) {
            if (this.value !== value) this.commit('node', value, value);
        } else if (
            typeof value !== 'string' &&
            typeof value[Symbol.iterator] === 'function'
        )
            this.setList(value);
        else if (this.type === 'text') {
            if (this.value !== value) this.start.nextSibling.data = value;
            this.value = value;
        } else this.commit('text', value, document.createTextNode(value));
    }

    setTemplate({ strings, values }) {
        const template = prepare(strings);
        if (this.type === 'template' && this.value.template === template) {
            this.value.update(values);
            return;
        }
        const instance = new TemplateInstance(template, this.options);
        const fragment = instance.clone();
        instance.update(values);
        this.commit('template', instance, fragment);
    }

    setList(items) {
        if (this.type !== 'list') {
            this.clear();
            this.type = 'list';
            this.value = [];
        }
        const parts = this.value;
        let i = 0;
        for (const item of items) {
            if (!parts[i]) {
                const start = document.createComment('');
                const end = document.createComment('');
                this.insert(start);
                this.insert(end);
                parts[i] = new ChildPart(start, end, this.options);
            }
            parts[i++].setValue(item);
        }
        if (i === parts.length) return;
        const last = parts.at(-1).end;
        let node = parts[i].start;
        while (node !== last) {
            const next = node.nextSibling;
            node.remove();
            node = next;
        }
        last.remove();
        parts.length = i;
    }
}

const PART = Symbol('litePart');

export const render = (value, container, options) => {
    let part = container[PART];
    if (!part) {
        const marker = document.createComment('');
        container.append(marker);
        part = container[PART] = new ChildPart(marker, null, options);
    }
    part.setValue(value);
    return part;
};

const defaultConverter = {
    toAttribute(value, type) {
        if (type === Boolean) return value ? '' : null;
        if (type === Object || type === Array)
            return value == null ? value : JSON.stringify(value);
        return value;
    },
    fromAttribute(value, type) {
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
    },
};

const notEqual = (value, old) => !Object.is(value, old);

export class LiteElement extends HTMLElement {
    static elementProperties = new Map();
    static attributeToPropertyMap = new Map();

    static finalize() {
        if (Object.hasOwn(this, 'finalized')) return;
        this.finalized = true;
        const parent = Object.getPrototypeOf(this);
        if (parent !== LiteElement) parent.finalize();
        this.elementProperties = new Map(parent.elementProperties);
        this.attributeToPropertyMap = new Map(parent.attributeToPropertyMap);
        if (!Object.hasOwn(this, 'properties')) return;
        for (const [name, options] of Object.entries(this.properties))
            this.createProperty(name, options);
    }

    static get observedAttributes() {
        this.finalize();
        return [...this.attributeToPropertyMap.keys()];
    }

    static createProperty(name, options = {}) {
        let attribute = options.state ? false : (options.attribute ?? true);
        if (attribute === true) attribute = name.toLowerCase();
        const settings = { ...options, attribute };
        this.elementProperties.set(name, settings);
        if (attribute) this.attributeToPropertyMap.set(attribute, name);
        const key = Symbol(name);
        const { get, set } = Object.getOwnPropertyDescriptor(
            this.prototype,
            name,
        ) ?? {
            get() {
                return this[key];
            },
            set(value) {
                this[key] = value;
            },
        };
        Object.defineProperty(this.prototype, name, {
            get() {
                return get.call(this);
            },
            set(value) {
                const old = get.call(this);
                set.call(this, value);
                this.requestUpdate(name, old, settings);
            },
            configurable: true,
            enumerable: true,
        });
    }

    static get styleSheets() {
        if (!Object.hasOwn(this, 'sheets')) {
            this.sheets = [this.styles ?? []].flat().map((styles) => {
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(styles);
                return sheet;
            });
        }
        return this.sheets;
    }

    constructor() {
        super();
        this.isUpdatePending = false;
        this.hasUpdated = false;
        this.changedProperties = new Map();
        this.reflectingProperties = undefined;
        this.reflectingProperty = null;
        this.updatePromise = new Promise(
            (resolve) => (this.enableUpdating = resolve),
        );
        this.constructor.finalize();
        for (const name of this.constructor.elementProperties.keys()) {
            if (!Object.hasOwn(this, name)) continue;
            (this.instanceProperties ??= new Map()).set(name, this[name]);
            delete this[name];
        }
        this.requestUpdate();
    }

    get updateComplete() {
        return this.updatePromise;
    }

    createRenderRoot() {
        const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
        root.adoptedStyleSheets = this.constructor.styleSheets;
        return root;
    }

    addController(controller) {
        (this.controllers ??= new Set()).add(controller);
        if (this.renderRoot && this.isConnected) controller.hostConnected?.();
    }

    removeController(controller) {
        this.controllers?.delete(controller);
    }

    connectedCallback() {
        this.renderRoot ??= this.createRenderRoot();
        this.enableUpdating(true);
        this.controllers?.forEach((controller) => controller.hostConnected?.());
    }

    disconnectedCallback() {
        this.controllers?.forEach((controller) =>
            controller.hostDisconnected?.(),
        );
    }

    attributeChangedCallback(name, old, value) {
        const property = this.constructor.attributeToPropertyMap.get(name);
        if (this.reflectingProperty === property) return;
        const { converter, type } =
            this.constructor.elementProperties.get(property);
        const fromAttribute =
            typeof converter === 'function'
                ? converter
                : (converter?.fromAttribute ?? defaultConverter.fromAttribute);
        this.reflectingProperty = property;
        this[property] = fromAttribute(value, type);
        this.reflectingProperty = null;
    }

    requestUpdate(name, oldValue, options) {
        if (name !== undefined) {
            const settings =
                options ?? this.constructor.elementProperties.get(name) ?? {};
            if (!(settings.hasChanged ?? notEqual)(this[name], oldValue))
                return;
            if (!this.changedProperties.has(name))
                this.changedProperties.set(name, oldValue);
            if (settings.reflect && this.reflectingProperty !== name) {
                (this.reflectingProperties ??= new Set()).add(name);
            }
        }
        if (!this.isUpdatePending) this.updatePromise = this.enqueueUpdate();
    }

    async enqueueUpdate() {
        this.isUpdatePending = true;
        try {
            await this.updatePromise;
        } catch (error) {
            Promise.reject(error);
        }
        this.performUpdate();
        return !this.isUpdatePending;
    }

    performUpdate() {
        if (!this.isUpdatePending) return;
        if (this.instanceProperties) {
            for (const [name, value] of this.instanceProperties)
                this[name] = value;
            this.instanceProperties = undefined;
        }
        const changed = this.changedProperties;
        let shouldUpdate = false;
        try {
            shouldUpdate = this.shouldUpdate(changed);
            if (shouldUpdate) {
                this.willUpdate(changed);
                this.controllers?.forEach((controller) =>
                    controller.hostUpdate?.(),
                );
                this.update(changed);
            } else this.markUpdated();
        } catch (error) {
            shouldUpdate = false;
            this.markUpdated();
            throw error;
        }
        if (!shouldUpdate) return;
        this.controllers?.forEach((controller) => controller.hostUpdated?.());
        if (!this.hasUpdated) {
            this.hasUpdated = true;
            this.firstUpdated(changed);
        }
        this.updated(changed);
    }

    markUpdated() {
        this.changedProperties = new Map();
        this.isUpdatePending = false;
    }

    shouldUpdate() {
        return true;
    }

    willUpdate() {}

    update() {
        const value = this.render();
        if (this.reflectingProperties) {
            for (const name of this.reflectingProperties)
                this.reflectProperty(name);
            this.reflectingProperties = undefined;
        }
        this.markUpdated();
        render(value, this.renderRoot, { host: this });
    }

    reflectProperty(name) {
        const { attribute, converter, type } =
            this.constructor.elementProperties.get(name);
        const toAttribute =
            converter?.toAttribute ?? defaultConverter.toAttribute;
        const value = toAttribute(this[name], type);
        this.reflectingProperty = name;
        if (value == null) this.removeAttribute(attribute);
        else this.setAttribute(attribute, value);
        this.reflectingProperty = null;
    }

    firstUpdated() {}

    updated() {}

    render() {
        return nothing;
    }
}
