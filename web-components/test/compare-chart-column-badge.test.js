import { expect } from '@esm-bundle/chai';
import { COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING } from '../src/variants/compare-chart-column.js';

describe('COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING', () => {
    it('exposes a badge field mapped to the badge slot', () => {
        const { badge } = COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING;
        expect(badge.slot).to.equal('badge');
    });

    it('exposes allowed badge and border color options', () => {
        const { allowedBadgeColors, allowedBorderColors } =
            COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING;
        expect(allowedBadgeColors.length > 0).to.equal(true);
        expect(allowedBorderColors.length > 0).to.equal(true);
    });

    it('leaves the pre-existing mapping entries unchanged', () => {
        const mapping = COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING;
        expect(mapping.mnemonics).to.deep.equal({ size: 'l' });
        expect(mapping.title).to.deep.equal({
            tag: 'h3',
            slot: 'header',
            maxCount: 100,
        });
        expect(mapping.prices).to.deep.equal({ tag: 'p', slot: 'price' });
        expect(mapping.description).to.deep.equal({
            tag: 'div',
            slot: 'detail',
            maxCount: 1000,
        });
        expect(mapping.ctas).to.deep.equal({ slot: 'cta', size: 'M' });
        expect(mapping.features).to.deep.equal({
            tag: 'div',
            slot: 'features',
            unwrap: true,
        });
    });
});
