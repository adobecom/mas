import { AEM } from '@adobe/mas-commons';
import { createTag } from './utils.js';

const ATTR_AEM_BUCKET = 'aem-bucket';

const cardContent = {
    catalog: {
        name: 'catalog',
        title: {
            tag: 'h3',
            slot: 'heading-xs',
        },
        prices: {
            tag: 'h3',
            slot: 'heading-xs',
        },
        description: {
            tag: 'div',
            slot: 'body-xs',
        },
        ctas: { size: 'l' },
    },
    ah: {
        name: 'ah',
        title: {
            tag: 'h3',
            slot: 'heading-xxs',
        },
        prices: {
            tag: 'h3',
            slot: 'heading-xs',
        },
        description: {
            tag: 'div',
            slot: 'body-xxs',
        },
        ctas: { size: 's' },
    },
    'ccd-action': {
        name: 'ccd-action',
        title: {
            tag: 'h3',
            slot: 'heading-xs',
        },
        prices: {
            tag: 'h3',
            slot: 'heading-xs',
        },
        description: {
            tag: 'div',
            slot: 'body-xs',
        },
        ctas: { size: 'l' },
    },
};

async function parseMerchCard(item, merchCard) {
    const { variant = 'ccd-action' } = item;
    const cardMapping = cardContent[variant];

    merchCard.setAttribute('variant', variant);
    item.icon?.forEach((icon) => {
        const merchIcon = createTag('merch-icon', {
            slot: 'icons',
            src: icon,
            alt: '',
            href: '',
            size: 'l',
        });
        merchCard.append(merchIcon);
    });

    if (item.title) {
        merchCard.append(
            createTag(
                cardMapping.title.tag,
                { slot: cardMapping.title.slot },
                item.title,
            ),
        );
    }

    if (item.prices) {
        const prices = item.prices;
        const headingM = createTag(
            cardMapping.prices.tag,
            { slot: cardMapping.prices.slot },
            prices,
        );
        merchCard.append(headingM);
    }

    if (item.description) {
        const body = createTag(
            cardMapping.description.tag,
            { slot: cardMapping.description.slot },
            item.description,
        );
        merchCard.append(body);
    }

    if (item.ctas) {
        let ctas = item.ctas;
        const footer = createTag('div', { slot: 'footer' }, ctas);
        [...footer.querySelectorAll('[is="checkout-link"]')].forEach((cta) => {
            const spectrumCta = createTag('sp-button', {}, cta);
            spectrumCta.addEventListener('click', (e) => {
                e.stopPropagation();
                cta.click();
            });
            footer.appendChild(spectrumCta);
        });
        merchCard.append(footer);
    }
}

class FragmentCache {
    #fragmentCache = new Map();
    clear() {
        this.#fragmentCache.clear();
    }
    add(...items) {
        items.forEach((item) => {
            const { path } = item;
            if (path) {
                this.#fragmentCache.set(path, item);
            }
        });
    }
    has(path) {
        return this.#fragmentCache.has(path);
    }
    get(path) {
        return this.#fragmentCache.get(path);
    }
    remove(path) {
        this.#fragmentCache.delete(path);
    }
}
const cache = new FragmentCache();

/**
 * Custom element representing a MerchDataSource.
 *
 * @attr {string} path - fragment path
 */
export class MerchDataSource extends HTMLElement {
    /**
     * @type {import('@adobe/mas-commons').AEM}
     */
    #aem;
    cache = cache;

    /**
     * @type {string} fragment path
     */
    path;

    static get observedAttributes() {
        return ['source', 'path'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }

    connectedCallback() {
        const bucket =
            this.getAttribute(ATTR_AEM_BUCKET) ??
            document.querySelector('mas-studio')?.getAttribute(ATTR_AEM_BUCKET);
        this.#aem = new AEM(bucket);
        this.fetchData();
    }

    refresh(flushCache = true) {
        this.parentElement
            .querySelectorAll(':scope > *:not(merch-datasource)')
            .forEach((item) => item.remove());
        if (flushCache) {
            this.cache.remove(this.path);
        }
        this.fetchData();
    }

    async fetchData() {
        let item = cache.get(this.path);
        if (!item) {
            item = await this.#aem.sites.cf.fragments.getCfByPath(this.path);
        }
        if (item) {
            parseMerchCard(item, this.parentElement);
            return;
        }
    }
}

customElements.define('merch-datasource', MerchDataSource);
