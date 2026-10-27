import { expect } from 'chai';
import { getRequestMetadata } from '../../src/fragment/utils/cache.js';
import { MockState } from './mocks/MockState.js';

const requestKey = async (params) => (await getRequestMetadata({ state: new MockState(), ...params })).requestKey;

describe('request metadata key', () => {
    it('keys a fragment id request by id, locale & country', async () => {
        expect(await requestKey({ id: 'some-id', locale: 'fr_FR', country: 'CA' })).to.equal('req-some-id-fr_FR-CA');
    });

    it('keys a request without id by its offer, template & surface', async () => {
        const key = await requestKey({ offer: 'some-osi', template: 'plans', surface: 'acom', locale: 'en_US' });
        expect(key).to.equal('req-offer-en_US-o_some-osi-t_plans-s_acom');
    });

    it('keeps an offer override of a fragment apart from the fragment itself', async () => {
        const fragment = await requestKey({ id: 'some-id', locale: 'en_US' });
        const overridden = await requestKey({ id: 'some-id', locale: 'en_US', offer: 'some-osi' });
        expect(overridden).to.equal('req-some-id-en_US-o_some-osi');
        expect(overridden).to.not.equal(fragment);
    });

    it('never collides between offer requests on distinct templates or surfaces', async () => {
        const keys = await Promise.all([
            requestKey({ offer: 'some-osi', template: 'plans', surface: 'acom', locale: 'en_US' }),
            requestKey({ offer: 'some-osi', template: 'catalog', surface: 'acom', locale: 'en_US' }),
            requestKey({ offer: 'some-osi', template: 'plans', surface: 'ccd', locale: 'en_US' }),
        ]);
        expect(new Set(keys).size).to.equal(3);
    });
});
