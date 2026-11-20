import { expect } from '@esm-bundle/chai';
import { buildFragmentTitle } from '../../src/utils/fragment-title.js';
import { VARIANTS, VARIANT_NAMES } from '../../src/editors/variant-picker.js';

const OFFER_NODES = { org: 'merch', template: 'Catalog', product: 'Photoshop', customerSegment: 'Individual', state: 'Q3' };

describe('buildFragmentTitle', () => {
    it('builds the default pattern', () => {
        expect(buildFragmentTitle({ ...OFFER_NODES, surface: 'acom' })).to.equal(
            'MERCH : Catalog : Photoshop : Individual : Q3',
        );
    });

    it('adds the plan type before the state on acom-dc only', () => {
        expect(buildFragmentTitle({ ...OFFER_NODES, planType: 'ABM', state: 'x', surface: 'acom-dc' })).to.equal(
            'MERCH : Catalog : Photoshop : Individual : ABM : x',
        );
        expect(buildFragmentTitle({ ...OFFER_NODES, planType: 'ABM', surface: 'acom' })).to.equal(
            'MERCH : Catalog : Photoshop : Individual : Q3',
        );
    });

    it('adds the block or page after the org for headless templates only', () => {
        const headless = { ...OFFER_NODES, template: 'Headless', blockPage: 'hero', isHeadless: true };
        expect(buildFragmentTitle(headless)).to.equal('MERCH : hero : Headless : Photoshop : Individual : Q3');
        expect(buildFragmentTitle({ ...OFFER_NODES, blockPage: 'hero', isHeadless: false })).to.equal(
            'MERCH : Catalog : Photoshop : Individual : Q3',
        );
    });

    it('omits empty nodes without dangling separators', () => {
        expect(buildFragmentTitle({ org: 'mas', template: 'Catalog', state: '', product: '  ' })).to.equal('MAS : Catalog');
    });

    it('uppercases only the org', () => {
        expect(
            buildFragmentTitle({ org: 'mas', blockPage: 'hero', state: 'draft', template: 'Headless', isHeadless: true }),
        ).to.equal('MAS : hero : Headless : draft');
    });

    it('uses the variant picker label as the template node', () => {
        const { label } = VARIANTS.find(({ value }) => value === VARIANT_NAMES.CATALOG);
        expect(buildFragmentTitle({ org: 'mas', template: label })).to.equal('MAS : Catalog');
    });
});
