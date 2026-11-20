import { expect } from '@esm-bundle/chai';
import { buildFragmentTitle, parseFragmentTitle, splitFragmentTitle } from '../../src/utils/fragment-title.js';
import { VARIANTS, VARIANT_NAMES } from '../../src/editors/variant-picker.js';

const OFFER_NODES = { org: 'merch', template: 'Catalog', product: 'Photoshop', customerSegment: 'Individual', state: 'Q3' };
const PARSE_PARTS = { template: 'Catalog', product: 'Photoshop', customerSegment: 'Individual', surface: 'acom' };
const EMPTY = { org: '', state: '', blockPage: '' };

describe('buildFragmentTitle', () => {
    it('builds the default pattern', () => {
        expect(buildFragmentTitle({ ...OFFER_NODES, surface: 'acom' })).to.equal('MERCH: Catalog: Photoshop: Individual: Q3');
    });

    it('adds the plan type before the state on acom-dc only', () => {
        expect(buildFragmentTitle({ ...OFFER_NODES, planType: 'ABM', state: 'x', surface: 'acom-dc' })).to.equal(
            'MERCH: Catalog: Photoshop: Individual: ABM: x',
        );
        expect(buildFragmentTitle({ ...OFFER_NODES, planType: 'ABM', surface: 'acom' })).to.equal(
            'MERCH: Catalog: Photoshop: Individual: Q3',
        );
    });

    it('adds the block or page after the org for headless templates only', () => {
        const headless = { ...OFFER_NODES, template: 'Headless', blockPage: 'hero', isHeadless: true };
        expect(buildFragmentTitle(headless)).to.equal('MERCH: hero: Headless: Photoshop: Individual: Q3');
        expect(buildFragmentTitle({ ...OFFER_NODES, blockPage: 'hero', isHeadless: false })).to.equal(
            'MERCH: Catalog: Photoshop: Individual: Q3',
        );
    });

    it('omits empty nodes without dangling separators', () => {
        expect(buildFragmentTitle({ org: 'mas', template: 'Catalog', state: '', product: '  ' })).to.equal('MAS: Catalog');
    });

    it('uppercases only the org', () => {
        expect(
            buildFragmentTitle({ org: 'mas', blockPage: 'hero', state: 'draft', template: 'Headless', isHeadless: true }),
        ).to.equal('MAS: hero: Headless: draft');
    });

    it('uses the variant picker label as the template node', () => {
        const { label } = VARIANTS.find(({ value }) => value === VARIANT_NAMES.CATALOG);
        expect(buildFragmentTitle({ org: 'mas', template: label })).to.equal('MAS: Catalog');
    });
});

describe('parseFragmentTitle', () => {
    it('reads the org and state of a generated title', () => {
        expect(parseFragmentTitle('MERCH: Catalog: Photoshop: Individual: Q3', PARSE_PARTS)).to.deep.equal({
            org: 'MERCH',
            state: 'Q3',
            blockPage: '',
        });
    });

    it('returns an empty state when the title has none', () => {
        expect(parseFragmentTitle('MERCH: Catalog: Photoshop: Individual', PARSE_PARTS)).to.deep.equal({
            org: 'MERCH',
            state: '',
            blockPage: '',
        });
    });

    it('parses the plan type on acom-dc only', () => {
        const parts = { ...PARSE_PARTS, planType: 'ABM' };
        const title = 'MERCH: Catalog: Photoshop: Individual: ABM: x';
        expect(parseFragmentTitle(title, { ...parts, surface: 'acom-dc' })).to.deep.equal({
            org: 'MERCH',
            state: 'x',
            blockPage: '',
        });
        expect(parseFragmentTitle(title, parts).state).to.equal('ABM: x');
    });

    it('reads the block or page of a headless title', () => {
        const parts = { template: 'Headless', surface: 'acom', isHeadless: true };
        expect(parseFragmentTitle('MAS: hero: Headless: draft', parts)).to.deep.equal({
            org: 'MAS',
            state: 'draft',
            blockPage: 'hero',
        });
    });

    it('treats a freeform title as legacy', () => {
        expect(parseFragmentTitle('Summer promo card', PARSE_PARTS)).to.deep.equal(EMPTY);
    });

    it('treats a title whose offer nodes differ as legacy', () => {
        expect(parseFragmentTitle('MERCH: Catalog: Illustrator: Individual', PARSE_PARTS)).to.deep.equal(EMPTY);
    });

    it('requires an uppercase org', () => {
        expect(parseFragmentTitle('merch: Catalog', { template: 'Catalog' })).to.deep.equal(EMPTY);
    });
});

describe('splitFragmentTitle', () => {
    it('splits the org from the rest at the first separator', () => {
        expect(splitFragmentTitle('MERCH: Catalog: Photoshop', 'merch')).to.deep.equal(['MERCH', ': Catalog: Photoshop']);
        expect(splitFragmentTitle('MERCH', 'merch')).to.deep.equal(['MERCH', '']);
    });

    it('keeps the whole title in the rest without an org', () => {
        expect(splitFragmentTitle('Catalog: Photoshop', '')).to.deep.equal(['', 'Catalog: Photoshop']);
    });
});
