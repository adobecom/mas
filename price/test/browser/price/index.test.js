import * as snapshots from './__snapshots__/index.snapshot.js';
import { expectHtml } from '../helpers.js';
import { dataTrees } from '../../fixtures/price-info.js';

import {
    ANNUAL,
    OPTICAL,
    PROMO_STRIKETHROUGH,
    STRIKETHROUGH,
    renderPrice,
    renderPriceWithAnnual,
    renderPromoPriceWithAnnual,
} from '../../../src/price/template.js';

const globals = { country: 'US', language: 'en' };

const data = await fetch(new URL('./data.json', import.meta.url)).then((response) => response.json());

const root = document.createElement('div');
document.body.append(root);

const renderText = (content, tag = 'p') => {
    const el = document.createElement(tag);
    el.textContent = content;
    root.append(el);
};

const renderAndComparePrice = (id, html) => {
    const el = document.createElement('p', { id });
    el.setAttribute('id', id);
    el.innerHTML = html;
    root.append(el);
    expectHtml(el.innerHTML, snapshots[id]);
};

// WCS response formats. Both must produce the same markup, so the matrix runs
// twice against one set of snapshots. `preformatted` attaches the hand-written
// pre-split tree for the fixture; `legacy` leaves the offer untouched.
const formats = {
    legacy: (offer) => offer,
    preformatted: (offer, name) => ({
        ...offer,
        priceInfo: dataTrees[name.split(':')[0]],
    }),
};

const withFlags = (flags) => (context, value) => renderPrice(context, value, console, flags);

Object.entries({
    price: withFlags(0),
    priceOptical: withFlags(OPTICAL),
    priceStrikethrough: withFlags(STRIKETHROUGH),
    pricePromoStrikethrough: withFlags(PROMO_STRIKETHROUGH),
    priceAnnual: withFlags(ANNUAL),
    priceWithAnnual: renderPriceWithAnnual,
    pricePromoWithAnnual: renderPromoPriceWithAnnual,
}).forEach(([templateName, template]) => {
    describe(`template "${templateName}"`, () => {
        [
            { displayPerUnit: true },
            { displayRecurrence: false },
            { displayTax: true },
            { forceTaxExclusive: false },
            { forceTaxExclusive: true },
        ].forEach((context) => {
            describe(`context "${JSON.stringify(context)}"`, () => {
                Object.entries(formats).forEach(([formatName, applyFormat]) => {
                    describe(`WCS format "${formatName}"`, () => {
                        Object.entries(data).forEach(([name, offer]) => {
                            it(`renders "${name}"`, function () {
                                const idPrefix =
                                    `${templateName}${Object.entries(context)[0].join('')}${name.split(':')[0]}`.replace(
                                        /-/g,
                                        '',
                                    );
                                renderText(
                                    `${this.test.parent.parent.parent.title} ${this.test.parent.parent.title} ${this.test.parent.title} ${this.test.title}: language = en`,
                                );
                                renderAndComparePrice(
                                    `${idPrefix}1`,
                                    template({ ...context, ...globals }, applyFormat(offer, name)),
                                );
                            });
                        });
                    });
                });
            });
        });
    });
});
