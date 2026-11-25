import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, oneEvent } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/common/components/mas-offer-field.js';

const selectOffer = (detail) => document.dispatchEvent(new CustomEvent('ost-offer-select', { detail }));

describe('MasOfferField', () => {
    let sandbox;
    let service;

    const mount = async (template = html`<mas-offer-field label="Offer"></mas-offer-field>`) => {
        const el = await fixture(template);
        sandbox.stub(el.osiField, 'handleOpenOfferSelector');
        return el;
    };

    const detailsText = (el) => el.shadowRoot.querySelector('.offer-details').textContent.replace(/\s+/g, ' ').trim();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = document.createElement('mas-commerce-service');
        service.collectPriceOptions = sandbox.stub().returns({});
        service.resolveOfferSelectors = sandbox.stub();
        document.body.append(service);
    });

    afterEach(() => {
        fixtureCleanup();
        service.remove();
        sandbox.restore();
    });

    it('gives each field only the offer selected from its own button', async () => {
        const container = await fixture(
            html`<div>
                <mas-offer-field label="M2M offer"></mas-offer-field>
                <mas-offer-field label="PUF offer"></mas-offer-field>
            </div>`,
        );
        const [m2m, puf] = container.querySelectorAll('mas-offer-field');
        await Promise.all([m2m.updateComplete, puf.updateComplete]);
        sandbox.stub(m2m.osiField, 'handleOpenOfferSelector');
        sandbox.stub(puf.osiField, 'handleOpenOfferSelector');
        const pufChange = sandbox.spy();
        puf.addEventListener('change', pufChange);

        m2m.openOfferSelector();
        selectOffer({ offerSelectorId: 'M2M-OSI', offer: { productArrangementCode: 'PA-1' } });

        expect(m2m.osi).to.equal('M2M-OSI');
        expect(puf.osi).to.equal('');
        expect(pufChange.called).to.be.false;
    });

    it('ignores later selections once another field has opened the offer selector', async () => {
        const container = await fixture(
            html`<div>
                <mas-offer-field label="M2M offer"></mas-offer-field>
                <mas-offer-field label="PUF offer"></mas-offer-field>
            </div>`,
        );
        const [m2m, puf] = container.querySelectorAll('mas-offer-field');
        await Promise.all([m2m.updateComplete, puf.updateComplete]);
        sandbox.stub(m2m.osiField, 'handleOpenOfferSelector');
        sandbox.stub(puf.osiField, 'handleOpenOfferSelector');
        const m2mChange = sandbox.spy();
        const m2mCancel = sandbox.spy();
        m2m.addEventListener('change', m2mChange);
        m2m.addEventListener('cancel', m2mCancel);

        m2m.openOfferSelector();
        puf.openOfferSelector();
        selectOffer({ offerSelectorId: 'PUF-OSI', offer: { productArrangementCode: 'PA-2' } });
        document.dispatchEvent(new CustomEvent('ost-close'));

        expect(puf.osi).to.equal('PUF-OSI');
        expect(m2m.osi).to.equal('');
        expect(m2mChange.called).to.be.false;
        expect(m2mCancel.called).to.be.false;
    });

    it('reports the selected offer, then its resolved details', async () => {
        const el = await mount();
        const changes = [];
        el.addEventListener('change', ({ detail }) => changes.push(detail));
        service.resolveOfferSelectors.returns([
            Promise.resolve([
                {
                    productArrangementCode: 'PA-1',
                    marketSegments: ['EDU'],
                    productArrangement: { productCode: 'CCSN' },
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                },
            ]),
        ]);

        el.openOfferSelector();
        selectOffer({ offerSelectorId: 'OSI-1', offer: {} });
        await oneEvent(el, 'change');
        await el.updateComplete;

        expect(changes).to.deep.equal([
            { osi: 'OSI-1', offer: null },
            {
                osi: 'OSI-1',
                offer: {
                    productArrangementCode: 'PA-1',
                    marketSegment: 'EDU',
                    productCode: 'CCSN',
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                },
            },
        ]);
        expect(detailsText(el)).to.equal('OSI: OSI-1 PA code: PA-1 Market segment: EDU Commitment: YEAR Term: MONTHLY');
    });

    it('shows the commitment of a perpetual offer, which has no term', async () => {
        const el = await mount();

        el.openOfferSelector();
        selectOffer({ offerSelectorId: 'OSI-PERPETUAL', offer: { productArrangementCode: 'PA-1', commitment: 'PERPETUAL' } });
        await oneEvent(el, 'change');
        await el.updateComplete;

        expect(detailsText(el)).to.equal('OSI: OSI-PERPETUAL PA code: PA-1 Commitment: PERPETUAL');
    });

    it('drops the details of an offer replaced while it resolves', async () => {
        const el = await mount();
        const changes = [];
        el.addEventListener('change', ({ detail }) => changes.push(detail));
        let resolveFirst;
        service.resolveOfferSelectors.onFirstCall().returns([new Promise((resolve) => (resolveFirst = resolve))]);
        service.resolveOfferSelectors.onSecondCall().returns([Promise.resolve([{ productArrangementCode: 'PA-2' }])]);

        el.openOfferSelector();
        selectOffer({ offerSelectorId: 'FIRST', offer: {} });
        el.openOfferSelector();
        selectOffer({ offerSelectorId: 'SECOND', offer: {} });
        await oneEvent(el, 'change');
        resolveFirst([{ productArrangementCode: 'PA-1' }]);
        await new Promise((resolve) => setTimeout(resolve));

        expect(changes.filter(({ offer }) => offer).map(({ offer }) => offer.productArrangementCode)).to.deep.equal(['PA-2']);
    });

    it('fires cancel when the offer selector closes without a selection', async () => {
        const el = await mount();
        const cancel = sandbox.spy();
        el.addEventListener('cancel', cancel);

        el.openOfferSelector();
        document.dispatchEvent(new CustomEvent('ost-close'));
        document.dispatchEvent(new CustomEvent('ost-close'));

        expect(cancel.calledOnce).to.be.true;
    });

    it('does not fire cancel when the offer selector closes after a selection', async () => {
        const el = await mount();
        const cancel = sandbox.spy();
        el.addEventListener('cancel', cancel);

        el.openOfferSelector();
        selectOffer({ offerSelectorId: 'OSI-1', offer: { productArrangementCode: 'PA-1' } });
        document.dispatchEvent(new CustomEvent('ost-close'));

        expect(cancel.called).to.be.false;
    });

    it('shows the details of a preset offer without reporting a change', async () => {
        service.resolveOfferSelectors.returns([Promise.resolve([{ productArrangementCode: 'PA-PRESET' }])]);
        const change = sandbox.spy();
        const el = await mount(html`<mas-offer-field label="ABM offer" osi="PRESET" @change=${change}></mas-offer-field>`);

        await new Promise((resolve) => setTimeout(resolve));
        await el.updateComplete;

        expect(detailsText(el)).to.equal('OSI: PRESET PA code: PA-PRESET');
        expect(change.called).to.be.false;
    });

    it('keeps the change event of the hidden osi-field inside the component', async () => {
        const el = await mount();
        const change = sandbox.spy();
        el.addEventListener('change', change);

        el.osiField.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));

        expect(change.called).to.be.false;
    });

    it('marks an optional field as not required and uses its placeholder', async () => {
        const el = await mount(
            html`<mas-offer-field label="Trial offer" placeholder="Select trial offer…" optional></mas-offer-field>`,
        );

        expect(el.shadowRoot.querySelector('sp-field-label').required).to.be.false;
        expect(el.shadowRoot.querySelector('sp-action-button').textContent.trim()).to.equal('Select trial offer…');
    });
});
