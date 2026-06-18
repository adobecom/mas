import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import '../../src/swc.js';
import { buildPromotionOfferRecord } from '../../src/promotions/promotion-editor-utils.js';
import '../../src/promotions/mas-promo-codes-manager.js';
import { MANAGE_PROMO_CODES_AND_OFFERS_LABEL } from '../../src/promotions/mas-promo-codes-manager.js';

const CUSTOM_OSI_RESOLVE_DEBOUNCE_MS = 400;

const OFFER_ID = 'AABBCC1122334455DDEEFF6677889900A';
const REGIONAL_OFFER_ID = 'FF00EE11DD22CC33BB44AA5566778899B';
const REGIONAL_SELECTOR_ID = 'regional-osi';

function makeOffer(overrides = {}) {
    return {
        path: 'default-osi',
        title: 'Creative Cloud',
        offerData: { offerId: OFFER_ID },
        tags: [{ id: 'mas:product_code/creative-cloud', title: 'Creative Cloud' }],
        ...overrides,
    };
}

function makeRegionalOffer() {
    return makeOffer({
        path: REGIONAL_SELECTOR_ID,
        title: 'CC Pro Regional',
        offerData: { offerId: REGIONAL_OFFER_ID },
        tags: [{ id: 'mas:product_code/creative-cloud', title: 'CC Pro Regional' }],
    });
}

function $(el, selector) {
    return el.shadowRoot.querySelector(selector);
}

function $$(el, selector) {
    return [...el.shadowRoot.querySelectorAll(selector)];
}

async function renderManager(props = {}) {
    const el = await fixture(html`
        <mas-promo-codes-manager
            .open=${false}
            .offers=${props.offers ?? [makeOffer()]}
            .geos=${props.geos ?? ['mas:locale/CA_en', 'mas:locale/US']}
            .defaultPromoCode=${props.defaultPromoCode ?? 'CCI_40OFF'}
            .exceptions=${props.exceptions ?? new Map()}
            .offerSubstitutions=${props.offerSubstitutions ?? new Map()}
        ></mas-promo-codes-manager>
    `);
    if (props.resolveSubstituteOfferEntry) {
        el.resolveSubstituteOfferEntry = props.resolveSubstituteOfferEntry;
    }
    el.open = props.open ?? true;
    await el.updateComplete;
    return el;
}

async function expandCountry(el, country) {
    const toggle = $(el, `[data-country="${country}"] .expand-toggle`);
    toggle.click();
    await el.updateComplete;
}

function makeIllustratorCacheEntry(osi) {
    return buildPromotionOfferRecord(osi, {
        product_code: 'ilst',
        product_name: 'Illustrator',
        offerId: osi,
        icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg',
    });
}

describe('MasPromoCodesManager', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(async () => {
        fixtureCleanup();
        sandbox.restore();
    });

    describe('rendering', () => {
        it('renders nothing when open is false', async () => {
            const el = await renderManager({ open: false });
            expect($(el, '.dialog-backdrop')).to.be.null;
            expect(el.hasAttribute('open')).to.be.false;
        });

        it('renders the dialog backdrop when open is true', async () => {
            const el = await renderManager({ open: true });
            expect($(el, '.dialog-backdrop')).to.exist;
        });

        it('renders a country row for each locale in geos', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            const countryLabels = $$(el, '.country-label').map((l) => l.textContent.trim());
            expect(countryLabels).to.include('CA_en');
            expect(countryLabels).to.include('US');
        });

        it('skips non-country pzn geos entries', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:pzn/TEAMS'] });
            const countryLabels = $$(el, '.country-label').map((l) => l.textContent.trim());
            expect(countryLabels).to.deep.equal(['CA_en']);
        });

        it('renders locale and pzn country geos as separate country rows', async () => {
            const el = await renderManager({
                geos: ['mas:locale/id_ID', 'mas:pzn/country/id', 'mas:pzn/country/co'],
            });
            const countryLabels = $$(el, '.country-label').map((l) => l.textContent.trim());
            expect(countryLabels).to.deep.equal(['id_ID', 'id', 'co']);
        });

        it('renders normalized geo labels without country/ prefix or slashes', async () => {
            const el = await renderManager({
                geos: ['mas:locale/country/bg', 'mas:locale/EG/ar_EG', 'mas:locale/pt_BR'],
            });
            const countryLabels = $$(el, '.country-label').map((l) => l.textContent.trim());
            expect(countryLabels).to.deep.equal(['bg', 'ar_EG', 'pt_BR']);
        });

        it('renders a "Select all" checkbox', async () => {
            const el = await renderManager();
            expect($(el, '.select-all-checkbox')).to.exist;
        });

        it('shows the country count next to "Select all"', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            const countEl = $(el, '.country-count');
            expect(countEl).to.exist;
            expect(countEl.textContent.trim()).to.equal('2 countries');
        });

        it('countries are collapsed by default (no offer inputs visible)', async () => {
            const el = await renderManager();
            expect($$(el, '.promo-code-input').length).to.equal(0);
        });

        it('shows offer grid after expanding a country', async () => {
            const el = await renderManager();
            await expandCountry(el, 'CA_en');
            expect($$(el, '[data-country="CA_en"] .promo-code-input').length).to.be.greaterThan(0);
        });

        it('shows empty promo code input when no exception exists for that geo/offer', async () => {
            const el = await renderManager({ defaultPromoCode: 'DEFAULT_CODE' });
            await expandCountry(el, 'CA_en');
            const inputs = $$(el, '[data-country="CA_en"] .promo-code-input');
            expect(inputs.length).to.be.greaterThan(0);
            inputs.forEach((input) => {
                expect(input.value).to.equal('');
            });
        });

        it('pre-fills promo code input with exception when override exists', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const el = await renderManager({ exceptions });
            await expandCountry(el, 'CA_en');
            const input = $(el, '[data-country="CA_en"] .promo-code-input');
            expect(input.value).to.equal('CCI_30OFF');
        });

        it('shows promo restore link when promo code is overridden', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const el = await renderManager({ exceptions });
            await expandCountry(el, 'CA_en');
            const link = $(el, '[data-country="CA_en"] .restore-promo-link');
            expect(link).to.exist;
            expect(link.textContent).to.include('Overridden code');
            expect($(el, '[data-country="CA_en"] .restore-offer-link')).to.be.null;
        });

        it('shows offer restore link when offer is substituted', async () => {
            const offerSubstitutions = new Map([['default-osi|CA_en', REGIONAL_SELECTOR_ID]]);
            const el = await renderManager({ offers: [makeOffer(), makeRegionalOffer()], offerSubstitutions });
            await expandCountry(el, 'CA_en');
            const link = $(el, '[data-country="CA_en"] .restore-offer-link');
            expect(link).to.exist;
            expect(link.textContent).to.include('Overridden offer');
            expect($(el, '[data-country="CA_en"] .restore-promo-link')).to.be.null;
        });

        it('does not show restore links when using defaults', async () => {
            const el = await renderManager({ exceptions: new Map() });
            await expandCountry(el, 'CA_en');
            expect($$(el, '.restore-promo-link').length).to.equal(0);
            expect($$(el, '.restore-offer-link').length).to.equal(0);
        });

        it('hides the bulk apply section when no countries are selected', async () => {
            const el = await renderManager();
            expect($(el, '.bulk-apply-section')).to.be.null;
        });

        it('shows "Confirm" and "Cancel" buttons', async () => {
            const el = await renderManager();
            expect($(el, '.confirm-button')).to.exist;
            expect($(el, '.cancel-button')).to.exist;
        });

        it('selected country header gets the is-selected class', async () => {
            const el = await renderManager();
            $(el, '[data-country="CA_en"] .country-checkbox').click();
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .country-header.is-selected')).to.exist;
        });
    });

    describe('expand / collapse', () => {
        it('clicking the chevron expands a collapsed country', async () => {
            const el = await renderManager();
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.be.null;
            await expandCountry(el, 'CA_en');
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.exist;
        });

        it('clicking the chevron again collapses an expanded country', async () => {
            const el = await renderManager();
            await expandCountry(el, 'CA_en');
            await expandCountry(el, 'CA_en');
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.be.null;
        });

        it('clicking the country header expands a collapsed country', async () => {
            const el = await renderManager();
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.be.null;
            $(el, '[data-country="CA_en"] .country-header').click();
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.exist;
        });

        it('clicking the country header again collapses an expanded country', async () => {
            const el = await renderManager();
            $(el, '[data-country="CA_en"] .country-header').click();
            await el.updateComplete;
            $(el, '[data-country="CA_en"] .country-header').click();
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.be.null;
        });

        it('expanding one country collapses the previously expanded country', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            await expandCountry(el, 'CA_en');
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.exist;
            await expandCountry(el, 'US');
            expect($(el, '[data-country="CA_en"] .offer-grid')).to.be.null;
            expect($(el, '[data-country="US"] .offer-grid')).to.exist;
        });
    });

    describe('interactions', () => {
        it('shows bulk apply section when a country checkbox is checked', async () => {
            const el = await renderManager();
            $(el, '.country-checkbox').click();
            await el.updateComplete;
            expect($(el, '.bulk-apply-section')).to.exist;
        });

        it('select all checks all countries', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            $(el, '.select-all-checkbox').click();
            await el.updateComplete;
            const checkboxes = $$(el, '.country-checkbox');
            checkboxes.forEach((cb) => expect(cb.checked).to.be.true);
        });

        it('unchecks all when select-all clicked while all are checked', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            $(el, '.select-all-checkbox').click();
            await el.updateComplete;
            $(el, '.select-all-checkbox').click();
            await el.updateComplete;
            const checkboxes = $$(el, '.country-checkbox');
            checkboxes.forEach((cb) => expect(cb.checked).to.be.false);
        });

        it('clicking promo restore removes the exception and shows empty field', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const el = await renderManager({ exceptions });
            await expandCountry(el, 'CA_en');
            $(el, '[data-country="CA_en"] .restore-promo-link').click();
            await el.updateComplete;
            const input = $(el, '[data-country="CA_en"] .promo-code-input');
            expect(input.value).to.equal('');
            expect($(el, '[data-country="CA_en"] .restore-promo-link')).to.be.null;
        });

        it('clicking offer restore resets offer but keeps promo override', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const offerSubstitutions = new Map([['default-osi|CA_en', REGIONAL_SELECTOR_ID]]);
            const el = await renderManager({
                offers: [makeOffer(), makeRegionalOffer()],
                exceptions,
                offerSubstitutions,
            });
            await expandCountry(el, 'CA_en');
            $(el, '[data-country="CA_en"] .restore-offer-link').click();
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-id-text').textContent.trim()).to.equal(OFFER_ID);
            expect($(el, '[data-country="CA_en"] .promo-code-input').value).to.equal('CCI_30OFF');
            expect($(el, '[data-country="CA_en"] .restore-promo-link')).to.exist;
            expect($(el, '[data-country="CA_en"] .restore-offer-link')).to.be.null;
        });

        it('clicking promo restore resets promo but keeps offer substitution', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const offerSubstitutions = new Map([['default-osi|CA_en', REGIONAL_SELECTOR_ID]]);
            const el = await renderManager({
                offers: [makeOffer(), makeRegionalOffer()],
                exceptions,
                offerSubstitutions,
            });
            await expandCountry(el, 'CA_en');
            $(el, '[data-country="CA_en"] .restore-promo-link').click();
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .promo-code-input').value).to.equal('');
            expect($(el, '[data-country="CA_en"] .offer-id-text').textContent.trim()).to.equal(REGIONAL_OFFER_ID);
            expect($(el, '[data-country="CA_en"] .restore-offer-link')).to.exist;
            expect($(el, '[data-country="CA_en"] .restore-promo-link')).to.be.null;
        });

        it('dispatches promo-codes-save with correct Map on Confirm', async () => {
            const exceptions = new Map([['default-osi|CA_en', 'CCI_30OFF']]);
            const el = await renderManager({ exceptions });
            const saved = sinon.spy();
            el.addEventListener('promo-codes-save', saved);
            $(el, '.confirm-button').click();
            await el.updateComplete;
            expect(saved.calledOnce).to.be.true;
            const { detail } = saved.firstCall.args[0];
            expect(detail.exceptions).to.be.instanceOf(Map);
            expect(detail.exceptions.get('default-osi|CA_en')).to.equal('CCI_30OFF');
            expect(detail.offerSubstitutions).to.be.instanceOf(Map);
        });

        it('renders manage promo codes and offers title', async () => {
            const el = await renderManager();
            expect($(el, '.dialog-header').textContent.trim()).to.equal(MANAGE_PROMO_CODES_AND_OFFERS_LABEL);
        });

        it('renders figma-style columns Offer, Offer ID, and Promo code', async () => {
            const el = await renderManager({ offers: [makeOffer(), makeRegionalOffer()] });
            await expandCountry(el, 'CA_en');
            const headers = $$(el, '[data-country="CA_en"] .offer-grid-header span').map((node) => node.textContent.trim());
            expect(headers).to.deep.equal(['Offer', 'Offer ID', 'Promo code']);
        });

        it('skips offers without offer id data', async () => {
            const el = await renderManager({
                offers: [makeOffer(), { title: 'Fragment without offer', tags: [], fields: [] }],
            });
            await expandCountry(el, 'CA_en');
            expect($$(el, '[data-country="CA_en"] .offer-grid-row').length).to.equal(1);
        });

        it('dispatches offerSubstitutions on Confirm when substitute is set', async () => {
            const offerSubstitutions = new Map([['default-osi|CA_en', REGIONAL_SELECTOR_ID]]);
            const el = await renderManager({ offers: [makeOffer(), makeRegionalOffer()], offerSubstitutions });
            const saved = sinon.spy();
            el.addEventListener('promo-codes-save', saved);
            $(el, '.confirm-button').click();
            await el.updateComplete;
            expect(saved.firstCall.args[0].detail.offerSubstitutions.get('default-osi|CA_en')).to.equal(REGIONAL_SELECTOR_ID);
        });

        it('accepts manual custom OSI input and saves it as substitution', async () => {
            const manualOsi = 'AAABBB777CCCDDD888EEEFFF999GGG';
            const el = await renderManager({ offers: [makeOffer()] });
            await expandCountry(el, 'CA_en');
            const input = $(el, '[data-country="CA_en"] .custom-osi-input');
            input.value = manualOsi;
            input.dispatchEvent(new Event('input'));
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-id-text').textContent.trim()).to.equal(manualOsi);
            expect($(el, '[data-country="CA_en"] .offer-name-cell span').textContent.trim()).to.equal(
                'Custom OSI: AAABBB777CCCDDD888EEEFFF999G...',
            );
            const saved = sinon.spy();
            el.addEventListener('promo-codes-save', saved);
            $(el, '.confirm-button').click();
            await el.updateComplete;
            expect(saved.firstCall.args[0].detail.offerSubstitutions.get('default-osi|CA_en')).to.equal(manualOsi);
        });

        it('shows custom OSI field even when only one offer exists', async () => {
            const el = await renderManager({ offers: [makeOffer()] });
            await expandCountry(el, 'CA_en');
            expect($(el, '[data-country="CA_en"] .custom-osi-input')).to.exist;
        });

        it('resolves custom OSI via commerce and updates the offer column', async () => {
            const customOsi = 'AAABB11CC22DD33EE44FF55GG66HH77';
            const el = await renderManager({
                offers: [makeOffer()],
                resolveSubstituteOfferEntry: async (osi) => makeIllustratorCacheEntry(osi),
            });
            await expandCountry(el, 'CA_en');
            const input = $(el, '[data-country="CA_en"] .custom-osi-input');
            input.value = customOsi;
            input.dispatchEvent(new Event('input'));
            await new Promise((resolve) => setTimeout(resolve, CUSTOM_OSI_RESOLVE_DEBOUNCE_MS + 50));
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-name-cell span').textContent.trim()).to.equal('Illustrator');
            expect($(el, '[data-country="CA_en"] .offer-mnemonic')).to.exist;
            expect($(el, '[data-country="CA_en"] .offer-id-text').textContent.trim()).to.equal(customOsi);
        });

        it('hydrates offer column when dialog opens with a saved custom OSI', async () => {
            const customOsi = 'AAABB11CC22DD33EE44FF55GG66HH77';
            const el = await renderManager({
                offerSubstitutions: new Map([['default-osi|CA_en', customOsi]]),
                resolveSubstituteOfferEntry: async (osi) => makeIllustratorCacheEntry(osi),
            });
            await new Promise((resolve) => setTimeout(resolve, 50));
            await el.updateComplete;
            await expandCountry(el, 'CA_en');
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .offer-name-cell span').textContent.trim()).to.equal('Illustrator');
            expect($(el, '[data-country="CA_en"] .offer-mnemonic')).to.exist;
        });

        it('keeps custom OSI input when substitution matches the base offer path', async () => {
            const el = await renderManager({ offers: [makeOffer()] });
            await expandCountry(el, 'CA_en');
            const input = $(el, '[data-country="CA_en"] .custom-osi-input');
            input.value = 'default-osi';
            input.dispatchEvent(new Event('input'));
            await el.updateComplete;
            expect($(el, '[data-country="CA_en"] .custom-osi-input').value).to.equal('default-osi');
            expect($(el, '[data-country="CA_en"] .offer-name-cell span').textContent.trim()).to.equal(
                'Custom OSI: default-osi',
            );
            expect($(el, '[data-country="CA_en"] .restore-offer-link')).to.exist;
        });

        it('dispatches promo-codes-cancel event on Cancel', async () => {
            const el = await renderManager();
            const cancelled = sinon.spy();
            el.addEventListener('promo-codes-cancel', cancelled);
            $(el, '.cancel-button').click();
            await el.updateComplete;
            expect(cancelled.calledOnce).to.be.true;
        });

        it('bulk apply sets code for all selected countries for all offers', async () => {
            const el = await renderManager({ geos: ['mas:locale/CA_en', 'mas:locale/US'] });
            $(el, '.select-all-checkbox').click();
            await el.updateComplete;
            const bulkInput = $(el, '.bulk-promo-input');
            bulkInput.value = 'BULK_CODE';
            bulkInput.dispatchEvent(new Event('input'));
            await el.updateComplete;
            $(el, '.bulk-apply-button').click();
            await el.updateComplete;
            await expandCountry(el, 'CA_en');
            expect($(el, '[data-country="CA_en"] .promo-code-input').value).to.equal('BULK_CODE');
            await expandCountry(el, 'US');
            expect($(el, '[data-country="US"] .promo-code-input').value).to.equal('BULK_CODE');
        });

        it('shows success banner after bulk apply', async () => {
            const el = await renderManager();
            $(el, '.country-checkbox').click();
            await el.updateComplete;
            const bulkInput = $(el, '.bulk-promo-input');
            bulkInput.value = 'BULK';
            bulkInput.dispatchEvent(new Event('input'));
            await el.updateComplete;
            $(el, '.bulk-apply-button').click();
            await el.updateComplete;
            expect($(el, '.success-message')).to.exist;
            expect($(el, '.success-message').textContent).to.include('successfully');
        });

        it('X button on success banner dismisses it', async () => {
            const el = await renderManager();
            $(el, '.country-checkbox').click();
            await el.updateComplete;
            const bulkInput = $(el, '.bulk-promo-input');
            bulkInput.value = 'CODE';
            bulkInput.dispatchEvent(new Event('input'));
            await el.updateComplete;
            $(el, '.bulk-apply-button').click();
            await el.updateComplete;
            $(el, '.dismiss-success').click();
            await el.updateComplete;
            expect($(el, '.success-message')).to.be.null;
        });

        it('X button on bulk apply section hides it', async () => {
            const el = await renderManager();
            $(el, '.country-checkbox').click();
            await el.updateComplete;
            expect($(el, '.bulk-apply-section')).to.exist;
            $(el, '.bulk-apply-section sp-action-button[aria-label="Close bulk apply"]').click();
            await el.updateComplete;
            expect($(el, '.bulk-apply-section')).to.be.null;
        });
    });
});
