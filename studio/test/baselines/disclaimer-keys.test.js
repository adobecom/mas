import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { filterDisclaimerKeys, findDisclaimerKey, loadDisclaimerKeys } from '../../src/baselines/disclaimer-keys.js';

const DICTIONARY = '/content/dam/mas/acom-cc/en_US/dictionary';

const entry = (key, status = 'PUBLISHED') => ({
    path: `${DICTIONARY}/${key}`,
    status,
    fields: [{ name: 'key', values: [key] }],
});

const ACOM_CC_KEYS = [
    { key: 'cc-pricing-legal-disclaimer-abm' },
    { key: 'cc-pricing-legal-disclaimer-abm-edu' },
    { key: 'cc-pricing-legal-disclaimer-puf' },
    { key: 'cc-pricing-legal-disclaimer' },
    { key: 'abm-buy-now' },
    { key: 'puf-legal' },
];

describe('disclaimer-keys', () => {
    it('loads the sorted keys of the en_US dictionary of the surface, without its index', async () => {
        const repository = {
            searchFragmentList: sinon
                .stub()
                .resolves([entry('puf-legal', 'DRAFT'), { path: `${DICTIONARY}/index`, fields: [] }, entry('abm-legal')]),
        };

        const keys = await loadDisclaimerKeys(repository, 'acom-cc');

        expect(repository.searchFragmentList.firstCall.args[0]).to.deep.equal({ path: DICTIONARY });
        expect(keys).to.deep.equal([
            { key: 'abm-legal', status: 'PUBLISHED' },
            { key: 'puf-legal', status: 'DRAFT' },
        ]);
    });

    it('preselects the shortest legal disclaimer key of each plan, none for a plan without one', () => {
        expect(findDisclaimerKey(ACOM_CC_KEYS, 'abm')).to.equal('cc-pricing-legal-disclaimer-abm');
        expect(findDisclaimerKey(ACOM_CC_KEYS, 'puf')).to.equal('cc-pricing-legal-disclaimer-puf');
        expect(findDisclaimerKey(ACOM_CC_KEYS, 'm2m')).to.equal('');
    });

    it('filters the keys containing the typed text, ignoring case', () => {
        expect(filterDisclaimerKeys(ACOM_CC_KEYS, ' Disclaimer-ABM').map(({ key }) => key)).to.deep.equal([
            'cc-pricing-legal-disclaimer-abm',
            'cc-pricing-legal-disclaimer-abm-edu',
        ]);
        expect(filterDisclaimerKeys(ACOM_CC_KEYS, '')).to.equal(ACOM_CC_KEYS);
    });
});
