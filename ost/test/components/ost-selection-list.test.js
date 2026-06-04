import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-selection-list.js';

function resetStore() {
    store.authoringFlow = 'single';
    store.selectedOffers = [];
    store.selectedOffer = undefined;
    store.selectedOsi = undefined;
    store.currentSlot = 'base';
    store.pendingFlowSwitch = null;
}

describe('ost-selection-list', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    it('renders nothing in single flow', async () => {
        store.authoringFlow = 'single';
        const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
        expect(el.shadowRoot.querySelector('.selection-slot')).to.not.exist;
    });

    it('renders nothing in consult flow', async () => {
        store.authoringFlow = 'consult';
        const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
        expect(el.shadowRoot.querySelector('.selection-slot')).to.not.exist;
    });

    describe('tryBuy flow', () => {
        beforeEach(() => {
            store.authoringFlow = 'tryBuy';
        });

        it('renders two empty slots (trial + base) when no offers are selected', async () => {
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const slots = el.shadowRoot.querySelectorAll('.selection-slot');
            expect(slots.length).to.equal(2);
            const labels = [...el.shadowRoot.querySelectorAll('.slot-label')].map((l) => l.textContent.trim());
            expect(labels[0]).to.contain('Trial offer');
            expect(labels[1]).to.contain('Base offer');
        });

        it('marks the current slot as active', async () => {
            store.currentSlot = 'base';
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const slots = el.shadowRoot.querySelectorAll('.selection-slot');
            expect(slots[0].classList.contains('active')).to.be.false;
            expect(slots[1].classList.contains('active')).to.be.true;
        });

        it('marks filled slots with a checkmark and offer label', async () => {
            store.selectedOffers = [{ offer: { offer_id: 'BASE-1' }, osi: 'base-osi-1', role: 'base' }];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const slots = el.shadowRoot.querySelectorAll('.selection-slot');
            const baseSlot = slots[1];
            expect(baseSlot.classList.contains('filled')).to.be.true;
            expect(baseSlot.querySelector('.slot-check')).to.exist;
            expect(baseSlot.querySelector('.slot-value').textContent.trim()).to.equal('BASE-1');
        });

        it('falls back to product_arrangement_code when offer_id is missing', async () => {
            store.selectedOffers = [{ offer: { product_arrangement_code: 'pac-xyz' }, osi: 'osi-1', role: 'trial' }];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const slots = el.shadowRoot.querySelectorAll('.selection-slot');
            expect(slots[0].querySelector('.slot-value').textContent.trim()).to.equal('pac-xyz');
        });

        it('changes current slot when a slot is clicked', async () => {
            store.currentSlot = 'base';
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const trialSlot = el.shadowRoot.querySelectorAll('.selection-slot')[0];
            trialSlot.click();
            expect(store.currentSlot).to.equal('trial');
        });

        it('clears the trial offer via the clear button without changing current slot', async () => {
            store.selectedOffers = [{ offer: { offer_id: 'TRIAL-1' }, osi: 'trial-osi', role: 'trial' }];
            store.currentSlot = 'base';
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const trialSlot = el.shadowRoot.querySelectorAll('.selection-slot')[0];
            const clearBtn = trialSlot.querySelector('.slot-clear');
            expect(clearBtn).to.exist;
            clearBtn.click();
            expect(store.selectedOffers.find((o) => o.role === 'trial')).to.be.undefined;
            expect(store.currentSlot).to.equal('base');
        });

        it('clears the base offer via the clear button', async () => {
            store.selectedOffers = [{ offer: { offer_id: 'BASE-1' }, osi: 'base-osi', role: 'base' }];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const baseSlot = el.shadowRoot.querySelectorAll('.selection-slot')[1];
            baseSlot.querySelector('.slot-clear').click();
            expect(store.selectedOffers.find((o) => o.role === 'base')).to.be.undefined;
        });
    });

    describe('bundle flow', () => {
        beforeEach(() => {
            store.authoringFlow = 'bundle';
        });

        it('renders one filled slot per selected offer plus a hint', async () => {
            store.selectedOffers = [
                { offer: { offer_id: 'A' }, osi: 'osi-a' },
                { offer: { offer_id: 'B' }, osi: 'osi-b' },
                { offer: { offer_id: 'C' }, osi: 'osi-c' },
            ];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const slots = el.shadowRoot.querySelectorAll('.selection-slot');
            expect(slots.length).to.equal(3);
            slots.forEach((s) => expect(s.classList.contains('filled')).to.be.true);
            expect(el.shadowRoot.querySelector('.bundle-hint')).to.exist;
        });

        it('numbers each bundle slot 1, 2, 3...', async () => {
            store.selectedOffers = [
                { offer: { offer_id: 'A' }, osi: 'a' },
                { offer: { offer_id: 'B' }, osi: 'b' },
            ];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const numbers = [...el.shadowRoot.querySelectorAll('.slot-number')].map((n) => n.textContent.trim());
            expect(numbers).to.deep.equal(['1.', '2.']);
        });

        it('removes an offer by index when its clear button is clicked', async () => {
            store.selectedOffers = [
                { offer: { offer_id: 'A' }, osi: 'a' },
                { offer: { offer_id: 'B' }, osi: 'b' },
            ];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const firstClear = el.shadowRoot.querySelectorAll('.selection-slot')[0].querySelector('.slot-clear');
            firstClear.click();
            expect(store.selectedOffers).to.have.length(1);
            expect(store.selectedOffers[0].offer.offer_id).to.equal('B');
        });

        it('renders only the bundle hint when no offers are selected', async () => {
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            expect(el.shadowRoot.querySelectorAll('.selection-slot')).to.have.length(0);
            expect(el.shadowRoot.querySelector('.bundle-hint')).to.exist;
        });
    });

    describe('pending flow switch confirm bar', () => {
        it('renders a confirm bar with offer names when a flow switch is pending', async () => {
            store.authoringFlow = 'tryBuy';
            store.pendingFlowSwitch = 'bundle';
            store.selectedOffers = [
                { offer: { offer_id: 'KEEP-1' }, osi: 'k1' },
                { offer: { offer_id: 'KEEP-2' }, osi: 'k2' },
            ];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const bar = el.shadowRoot.querySelector('.confirm-bar');
            expect(bar).to.exist;
            expect(bar.textContent).to.contain('KEEP-1');
            expect(bar.textContent).to.contain('KEEP-2');
        });

        it('renders no confirm bar when no flow switch is pending', async () => {
            store.authoringFlow = 'tryBuy';
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            expect(el.shadowRoot.querySelector('.confirm-bar')).to.not.exist;
        });

        it('confirms a flow switch and keeps selections when "Keep" is clicked', async () => {
            store.authoringFlow = 'tryBuy';
            store.pendingFlowSwitch = 'bundle';
            store.selectedOffers = [{ offer: { offer_id: 'X' }, osi: 'x', role: 'base' }];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const buttons = el.shadowRoot.querySelectorAll('.confirm-bar sp-button');
            buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            expect(store.pendingFlowSwitch).to.be.null;
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.selectedOffers.length).to.be.greaterThan(0);
        });

        it('confirms a flow switch and discards selections when "Discard" is clicked', async () => {
            store.authoringFlow = 'tryBuy';
            store.pendingFlowSwitch = 'bundle';
            store.selectedOffers = [{ offer: { offer_id: 'Y' }, osi: 'y', role: 'base' }];
            const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
            const buttons = el.shadowRoot.querySelectorAll('.confirm-bar sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            expect(store.pendingFlowSwitch).to.be.null;
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.selectedOffers.length).to.equal(0);
        });
    });

    it('re-renders on store notify', async () => {
        store.authoringFlow = 'bundle';
        const el = await fixture(html`<ost-selection-list></ost-selection-list>`);
        expect(el.shadowRoot.querySelectorAll('.selection-slot').length).to.equal(0);
        store.selectedOffers = [{ offer: { offer_id: 'LATE' }, osi: 'late' }];
        store.notify();
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.selection-slot').length).to.equal(1);
    });
});
