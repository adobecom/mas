import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { buildReleaseFragmentData, createReleaseCard } from '../../src/utils/release-cards.js';

const product = {
    arrangement_code: 'PA-2543',
    product_code: 'ANTR',
    product_family: 'ACROBAT',
    customer_segment: 'TEAM',
    market_segments: ['COM'],
    copy: { name: 'Adobe Acrobat', description: 'The complete PDF solution for working anywhere.' },
    assets: { icons: { svg: 'https://example.com/acrobat.svg' } },
};

const baseOsi = 'AYWFYb2BjlsnXgYwWJzBPN2anVXjJPsDtW49Ozqb1Qw';
const trialOsi = 'TR1ALxbVYb2BjlsnXgYwWJzBPN2anVXjJPsDtW49Ozqb';
const parentPath = '/content/dam/mas/acom/en_US';

const fieldValue = (data, name) => data.fields.find((f) => f.name === name)?.values?.[0];
const ctasValue = (data) =>
    data.fields.map((f) => f.values?.[0]).find((v) => typeof v === 'string' && v.includes('checkout-link'));
const pricesValue = (data) =>
    data.fields.map((f) => f.values?.[0]).find((v) => typeof v === 'string' && v.includes('inline-price'));

describe('release-cards buildReleaseFragmentData', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => {
        sinon.restore();
    });

    it('re-emits the selected base OSI as a top-level field', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'plans', baseOsi, parentPath });
        expect(fieldValue(data, 'osi')).to.equal(baseOsi);
    });

    it('builds a Select CTA carrying the base OSI for a plans variant', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'plans', baseOsi, parentPath });
        const ctas = ctasValue(data);
        expect(ctas).to.include(`data-wcs-osi="${baseOsi}"`);
        expect(ctas).to.include('Select');
        expect(ctas).to.not.include('Free trial');
    });

    it('emits both a Free trial and a Buy now CTA for a non-plans variant with a trial OSI', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'catalog', baseOsi, trialOsi, parentPath });
        const ctas = ctasValue(data);
        expect(ctas).to.include('Free trial');
        expect(ctas).to.include(`data-wcs-osi="${trialOsi}"`);
        expect(ctas).to.include(`data-wcs-osi="${baseOsi}"`);
    });

    it('omits the price field for the catalog variant', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'catalog', baseOsi, parentPath });
        expect(pricesValue(data)).to.equal(undefined);
    });

    it('passes an NPI/DRAFT offer selector through verbatim without any network call', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'plans', baseOsi, parentPath });
        expect(fetchStub.called).to.equal(false);
        expect(ctasValue(data)).to.include(baseOsi);
    });

    it('derives tags and the heading from MCS product data', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'plans', baseOsi, parentPath });
        expect(data.tags).to.include('mas:product_code/ANTR');
        expect(data.tags).to.include('mas:pa/PA-2543');
        expect(data.tags).to.include('mas:customer_segment/TEAM');
        expect(fieldValue(data, 'cardTitle')).to.include('Adobe Acrobat');
    });

    it('sets the AEM fragment title to "<name> - <Variant>" and the parent path', async () => {
        const data = await buildReleaseFragmentData({ product, variant: 'plans', baseOsi, parentPath });
        expect(data.title).to.equal('Adobe Acrobat - Plans');
        expect(data.parentPath).to.equal(parentPath);
        expect(data.name).to.match(/^adobe-acrobat-plans-\d+$/);
    });
});

describe('release-cards createReleaseCard', () => {
    afterEach(() => sinon.restore());

    it('creates the fragment through the repository and returns it', async () => {
        const newFragment = { id: 'frag-1', title: 'Adobe Acrobat - Plans', path: `${parentPath}/card` };
        const create = sinon.stub().resolves(newFragment);
        const repository = { aem: { sites: { cf: { fragments: { create } } } } };
        const result = await createReleaseCard({ product, variant: 'plans', baseOsi, parentPath, repository });
        expect(create.calledOnce).to.equal(true);
        expect(create.firstCall.args[0].parentPath).to.equal(parentPath);
        expect(result).to.equal(newFragment);
    });

    it('throws when no repository is available', async () => {
        let error;
        try {
            await createReleaseCard({ product, variant: 'plans', baseOsi, parentPath, repository: null });
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an('error');
    });
});
