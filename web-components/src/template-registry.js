import { TEMPLATE_LOAD_TIMEOUT } from './constants.js';
import { templateDeps } from './template-deps.js';
import { clearForegroundTimeout, setForegroundTimeout } from './utils.js';

const templates = new Map();

// Templates a card is waiting for, by name: { promise, resolve, timer }
const pending = new Map();

const templateState = new WeakMap();

// Shadow stylesheets by template name, shared by every card of that template
const templateStyleSheets = new Map();

/**
 * Registers one template. The first registration of a name wins, so a page that
 * loads two bundles with the same template keeps a single class.
 * @param {string} name template name, e.g. 'pro'
 * @param {{ class: Function, fragmentMapping?: object, style?: string, collectionOptions?: object }} template
 */
export function registerTemplate(name, template) {
    if (templates.has(name)) return;
    templates.set(name, template);
    const waiting = pending.get(name);
    if (!waiting) return;
    pending.delete(name);
    clearForegroundTimeout(waiting.timer);
    waiting.resolve(template);
}

/**
 * Registers the templates of a template file: `define` receives the injected
 * dependencies and returns its templates by name.
 * @param {(deps: typeof templateDeps) => Record<string, object>} define
 */
export function registerTemplates(define) {
    for (const [name, template] of Object.entries(define(templateDeps))) {
        registerTemplate(name, template);
    }
}

export function getTemplate(name) {
    return templates.get(name);
}

/**
 * Resolves with the template once it is registered. Rejects after
 * TEMPLATE_LOAD_TIMEOUT when the page never loads it (no bundle on this page
 * contains it).
 * @param {string} name
 * @returns {Promise<object>}
 */
export function whenTemplate(name) {
    const template = templates.get(name);
    if (template) return Promise.resolve(template);
    let waiting = pending.get(name);
    if (!waiting) {
        waiting = {};
        waiting.promise = new Promise((resolve, reject) => {
            waiting.resolve = resolve;
            waiting.timer = setForegroundTimeout(() => {
                pending.delete(name);
                reject(
                    new Error(
                        `template "${name}" is not loaded on ${window.location.pathname}: add it to this page's bundle (MERCH_CARD_TEMPLATE_RULES in Milo libs/utils/utils.js)`,
                    ),
                );
            }, TEMPLATE_LOAD_TIMEOUT);
        });
        pending.set(name, waiting);
    }
    return waiting.promise;
}

const applyStyleSheet = (card, name, style, state) => {
    try {
        let sheet = templateStyleSheets.get(name);
        if (!sheet) {
            sheet = new CSSStyleSheet();
            sheet.replaceSync(style);
            templateStyleSheets.set(name, sheet);
        }

        // Remove old sheet if exists and it's different
        if (state?.styleSheet && state.styleSheet !== sheet) {
            const index = card.shadowRoot.adoptedStyleSheets.indexOf(
                state.styleSheet,
            );
            if (index !== -1) {
                card.shadowRoot.adoptedStyleSheets.splice(index, 1);
            }
        }

        if (!card.shadowRoot.adoptedStyleSheets.includes(sheet)) {
            card.shadowRoot.adoptedStyleSheets.push(sheet);
        }

        return { styleSheet: sheet };
    } catch (e) {
        // Fallback for browsers without CSSStyleSheet constructor
        const styleElement = document.createElement('style');
        styleElement.textContent = style;
        styleElement.setAttribute('data-template-style', name);

        // Remove old style element
        const oldElement =
            state?.styleElement ||
            card.shadowRoot.querySelector('[data-template-style]');
        if (oldElement) oldElement.remove();

        card.shadowRoot.appendChild(styleElement);
        return { styleElement };
    }
};

export function getTemplateLayout(card) {
    const name = card.template;
    const template = templates.get(name);
    if (!template) return undefined;

    const { class: TemplateClass, style } = template;
    const state = templateState.get(card);

    if (state?.appliedTemplate === name) {
        return new TemplateClass(card);
    }

    const styleState = style ? applyStyleSheet(card, name, style, state) : {};
    templateState.set(card, {
        appliedTemplate: name,
        ...styleState,
    });

    return new TemplateClass(card);
}

export function getFragmentMapping(name) {
    return templates.get(name)?.fragmentMapping;
}

export function getCollectionOptions(name) {
    return templates.get(name)?.collectionOptions;
}
