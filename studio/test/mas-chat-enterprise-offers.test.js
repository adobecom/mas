import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { clearProductCache } from '../src/services/product-api.js';

const individual = { name: 'Photoshop', arrangement_code: 'phsp', customer_segment: 'INDIVIDUAL' };
const team = { name: 'Photoshop Team', arrangement_code: 'phsp_t', customerSegments: { TEAM: true } };
const enterprise = { name: 'Photoshop Enterprise', arrangement_code: 'phsp_e', customer_segment: 'ENTERPRISE' };

describe('MasChat ENTERPRISE offers', () => {
    let el;
    let originalFetch;

    beforeEach(async () => {
        originalFetch = globalThis.fetch;
        sessionStorage.setItem('masAccessToken', 'test-token');
        clearProductCache();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        sessionStorage.removeItem('masAccessToken');
        clearProductCache();
        sinon.restore();
        el.remove();
    });

    const lastMessage = () => el.messages[el.messages.length - 1];
    const stubCatalog = (products) => {
        globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => products });
    };

    describe('guided steps', () => {
        it('never presents an ENTERPRISE product card and keeps the others in order', async () => {
            const step = await el.enrichGuidedStepWithRecentProducts({
                message: 'Which product?',
                productCards: [individual, enterprise, team],
            });
            expect(step.productCards).to.have.length(2);
            expect(step.productCards[0]).to.equal(individual);
            expect(step.productCards[1]).to.equal(team);
        });

        it('drops the Enterprise customer-segment option and keeps the others in order', async () => {
            const options = [
                { label: 'Individual', value: 'INDIVIDUAL' },
                { label: 'Enterprise', value: 'ENTERPRISE' },
                { label: 'Team', value: 'TEAM' },
            ];
            const step = await el.enrichGuidedStepWithRecentProducts({
                message: 'Customer segment?',
                buttonGroup: { label: 'Customer segment', options },
            });
            expect(step.buttonGroup.options).to.deep.equal([options[0], options[2]]);
        });

        it('does not inject remembered ENTERPRISE products', async () => {
            el.recentProducts = [individual, enterprise];
            const step = await el.enrichGuidedStepWithRecentProducts({ message: 'Select a product' });
            expect(step.productCards.map((card) => card.arrangement_code)).to.deep.equal(['phsp']);
        });
    });

    describe('recoverProductLookup', () => {
        it('shows only individual and team matches', async () => {
            stubCatalog([enterprise, individual, team]);
            await el.recoverProductLookup('photoshop');
            expect(lastMessage().productCards.map((card) => card.arrangement_code)).to.deep.equal(['phsp', 'phsp_t']);
        });

        it('replies that the offer is not available when every match is ENTERPRISE', async () => {
            stubCatalog([enterprise]);
            await el.recoverProductLookup('photoshop');
            expect(lastMessage().productCards).to.equal(undefined);
            expect(lastMessage().content).to.include("isn't available");
        });
    });

    describe('direct requests for an ENTERPRISE offer', () => {
        const lookupOffer = async (operationName, body) => {
            globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => body });
            const continueStub = sinon.stub(el, 'continueFromResolvedOffer').resolves();
            const lookupStub = sinon.stub(el, 'resolveReleaseProductByArrangementCode').resolves();
            await el.executeRegularOperation(
                { type: 'studio_operation', operationName, operationParams: {} },
                operationName,
                'release',
            );
            expect(continueStub.called).to.equal(false);
            expect(lookupStub.called).to.equal(false);
            expect(el.selectedReleaseOffer).to.not.be.ok;
            expect(el.selectedReleaseProduct).to.not.be.ok;
            expect(JSON.stringify(el.messages)).to.include("isn't available");
        };

        it('does not attach an ENTERPRISE offer requested by ID', async () => {
            await lookupOffer('get_offer_by_id', { offer: { offerId: 'e', customer_segment: 'ENTERPRISE' } });
        });

        it('does not attach an ENTERPRISE offer resolved from an offer selector', async () => {
            await lookupOffer('resolve_offer_selector', {
                offers: [{ product_arrangement_code: 'phsp_e', customer_segment: 'ENTERPRISE' }],
                selector: { product_arrangement_code: 'phsp_e' },
            });
        });
    });
});
