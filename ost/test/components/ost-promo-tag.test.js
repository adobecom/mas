import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import { PROMO_CONTEXT_CANCEL_VALUE } from '@dexter/tacocat-core/src/promotion.js';
import '../../src/components/ost-promo-tag.js';

describe('ost-promo-tag', () => {
    beforeEach(() => {
        store.storedPromoOverride = undefined;
        store.promotionCode = undefined;
    });

    afterEach(() => {
        store.storedPromoOverride = undefined;
        store.promotionCode = undefined;
    });

    it('renders an inline "Promotion:" label, badge, textfield, and clear button', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const label = el.shadowRoot.querySelector('.promo-label');
        expect(label).to.exist;
        expect(label.textContent.trim()).to.equal('Promotion:');
        expect(el.shadowRoot.querySelector('sp-badge')).to.exist;
        expect(el.shadowRoot.querySelector('sp-textfield')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid="ost-promo-clear"]')).to.exist;
    });

    it('lays out everything in a single horizontal row', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        expect(el.shadowRoot.querySelector('.promo-row')).to.exist;
        expect(el.shadowRoot.querySelector('.section-label')).to.not.exist;
    });

    it('renders an Undo icon inside the Clear button', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const clearBtn = el.shadowRoot.querySelector('[data-testid="ost-promo-clear"]');
        expect(clearBtn.querySelector('sp-icon-undo')).to.exist;
    });

    it('hides the Cancel context button when no context promo exists', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        expect(el.shadowRoot.querySelector('[data-testid="ost-promo-cancel-context"]')).to.not.exist;
    });

    it('renders a Cancel icon button when a context promo exists', async () => {
        store.promotionCode = 'CTX';
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const cancelBtn = el.shadowRoot.querySelector('[data-testid="ost-promo-cancel-context"]');
        expect(cancelBtn).to.exist;
        expect(cancelBtn.querySelector('sp-icon-cancel')).to.exist;
    });

    it('shows "no promo" badge with neutral variant when nothing is set', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge.getAttribute('variant')).to.equal('neutral');
        expect(badge.textContent).to.contain('no promo');
    });

    it('shows configured promo code with yellow variant when only configured is set', async () => {
        store.promotionCode = 'SUMMER25';
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge.getAttribute('variant')).to.equal('yellow');
        expect(badge.textContent).to.contain('SUMMER25');
    });

    it('shows override with "was" annotation when override differs from configured', async () => {
        store.promotionCode = 'OLD';
        store.storedPromoOverride = 'NEW';
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge.textContent).to.contain('NEW');
        expect(badge.textContent).to.contain('was');
        expect(badge.textContent).to.contain('OLD');
    });

    it('renders empty textfield value when override is the cancel sentinel', async () => {
        store.storedPromoOverride = PROMO_CONTEXT_CANCEL_VALUE;
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const textfield = el.shadowRoot.querySelector('sp-textfield');
        expect(textfield.getAttribute('value')).to.equal('');
    });

    it('renders the override value in the textfield when set', async () => {
        store.storedPromoOverride = 'PROMO42';
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const textfield = el.shadowRoot.querySelector('sp-textfield');
        expect(textfield.getAttribute('value')).to.equal('PROMO42');
    });

    it('calls store.setPromoCode with the new value on input', async () => {
        const calls = [];
        const orig = store.setPromoCode.bind(store);
        store.setPromoCode = (v) => {
            calls.push(v);
            orig(v);
        };
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const textfield = el.shadowRoot.querySelector('sp-textfield');
        textfield.value = 'TYPED';
        textfield.dispatchEvent(new Event('input'));
        expect(calls).to.include('TYPED');
        store.setPromoCode = orig;
    });

    it('clears the promo override via the Clear button', async () => {
        store.storedPromoOverride = 'TO_CLEAR';
        const calls = [];
        const orig = store.setPromoCode.bind(store);
        store.setPromoCode = (v) => {
            calls.push(v);
            orig(v);
        };
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        const clearBtn = el.shadowRoot.querySelector('[data-testid="ost-promo-clear"]');
        clearBtn.click();
        expect(calls).to.include(undefined);
        store.setPromoCode = orig;
    });

    it('re-renders on store change notifications', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        let badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge.textContent).to.contain('no promo');
        store.promotionCode = 'LATE_ADD';
        store.notify();
        await el.updateComplete;
        badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge.textContent).to.contain('LATE_ADD');
    });

    it('unsubscribes from the store on disconnect', async () => {
        const el = await fixture(html`<ost-promo-tag></ost-promo-tag>`);
        let updateCount = 0;
        const origRequestUpdate = el.requestUpdate.bind(el);
        el.requestUpdate = () => {
            updateCount += 1;
            origRequestUpdate();
        };
        el.remove();
        store.promotionCode = 'AFTER_DISCONNECT';
        store.notify();
        expect(updateCount).to.equal(0);
    });
});
