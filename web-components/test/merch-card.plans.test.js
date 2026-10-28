import { expect } from '@esm-bundle/chai';
// mas.js must be imported first to break the circular dep between
// variant-layout.js → variants.js → catalog.js → variant-layout.js
import '../src/mas.js';

let Plans;
let PlansV2;

before(async () => {
    ({ Plans } = await import('../src/variants/plans.js'));
    ({ PlansV2 } = await import('../src/variants/plans-v2.js'));
});

function makeLayout(Variant, settings = {}, osi = 'osi-a') {
    const root = document.createElement('div');
    root.innerHTML = `<p slot="heading-m"><span is="inline-price" data-template="price" data-wcs-osi="${osi}"></span></p>`;
    const price = root.querySelector('span');
    price.onceSettled = () => new Promise(() => {});
    const layout = Object.create(Variant.prototype);
    layout.card = {
        settings,
        updateComplete: Promise.resolve(),
        querySelector: (selector) => root.querySelector(selector),
    };
    return { layout, root, price, headingM: root.firstElementChild };
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

[
    ['Plans', () => Plans],
    ['PlansV2', () => PlansV2],
].forEach(([name, getVariant]) => {
    describe(`${name} legal price`, () => {
        it('disables plan type on the main heading price', () => {
            const { layout, price } = makeLayout(getVariant());
            const options = { displayPlanType: true, displayPerUnit: true };
            layout.priceOptionsProvider(price, options);
            expect(options.displayPlanType).to.be.false;
            expect(options.displayPerUnit).to.be.false;
        });

        it('inserts the legal clone before the main price settles', async () => {
            const { layout, price, headingM } = makeLayout(getVariant());
            layout.adjustLegal();
            await flush();
            const legal = price.nextElementSibling;
            expect(legal.dataset.template).to.equal('legal');
            expect(
                headingM.querySelectorAll('[data-template="legal"]'),
            ).to.have.length(1);
            expect(price.dataset.displayTax).to.be.undefined;
            expect(price.dataset.displayPlanType).to.be.undefined;
        });

        it('keeps the existing legal clone on re-run', async () => {
            const { layout, price, headingM } = makeLayout(getVariant());
            layout.adjustLegal();
            await flush();
            const legal = price.nextElementSibling;
            const mutations = [];
            const observer = new MutationObserver((records) =>
                mutations.push(...records),
            );
            observer.observe(headingM, { childList: true });
            layout.legalAdjusted = false;
            layout.adjustLegal();
            await flush();
            observer.disconnect();
            expect(mutations).to.have.length(0);
            expect(price.nextElementSibling).to.equal(legal);
        });

        it('replaces the legal clone when the offer changes', async () => {
            const { layout, price, headingM } = makeLayout(getVariant());
            layout.adjustLegal();
            await flush();
            price.dataset.wcsOsi = 'osi-b';
            layout.legalAdjusted = false;
            layout.adjustLegal();
            await flush();
            const legals = headingM.querySelectorAll('[data-template="legal"]');
            expect(legals).to.have.length(1);
            expect(legals[0].dataset.wcsOsi).to.equal('osi-b');
        });
    });
});

describe('PlansV2 tax options', () => {
    it('keeps tax on the main price and removes it from legal with displayAnnual', () => {
        const { layout, price } = makeLayout(PlansV2, { displayAnnual: true });
        const main = { displayTax: true };
        layout.priceOptionsProvider(price, main);
        expect(main.displayTax).to.be.true;
        price.dataset.template = 'legal';
        const legal = { displayTax: true };
        layout.priceOptionsProvider(price, legal);
        expect(legal.displayTax).to.be.false;
    });

    it('removes tax from the main price without displayAnnual', () => {
        const { layout, price } = makeLayout(PlansV2);
        const main = { displayTax: true };
        layout.priceOptionsProvider(price, main);
        expect(main.displayTax).to.be.false;
    });
});
