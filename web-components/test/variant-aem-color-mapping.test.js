import { expect } from '@esm-bundle/chai';
import '../src/mas.js';
import { IMAGE_AEM_FRAGMENT_MAPPING } from '../src/variants/image.js';
import { MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING } from '../src/variants/mini-compare-chart.js';
import { MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING } from '../src/variants/mini-compare-chart-mweb.js';

describe('non-plans variant AEM color mappings', () => {
    it('mini-compare-chart defaults and allows variation tokens plus legacy plans strings', () => {
        expect(MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING.badge.default).to.equal(
            'color-yellow-300-variation',
        );
        expect(
            MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING.allowedBadgeColors,
        ).to.include.members([
            'color-yellow-300-variation',
            'spectrum-yellow-300-plans',
        ]);
        expect(
            MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING.allowedBorderColors,
        ).to.include.members([
            'color-green-900-variation',
            'spectrum-green-900-plans',
        ]);
        expect(
            MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING.allowedWhatsIncludedDividerColors,
        ).to.include.members([
            'color-gray-300-variation',
            'spectrum-gray-300-plans',
        ]);
    });

    it('mini-compare-chart-mweb defaults and allows variation tokens plus legacy plans strings', () => {
        expect(
            MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING.badge.default,
        ).to.equal('color-yellow-300-variation');
        expect(
            MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING.allowedBadgeColors,
        ).to.include('color-red-700-variation');
        expect(
            MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING.allowedBadgeColors,
        ).to.include('spectrum-red-700-plans');
    });

    it('image variant defaults and allows variation tokens plus legacy plans strings', () => {
        expect(IMAGE_AEM_FRAGMENT_MAPPING.badge.default).to.equal(
            'color-yellow-300-variation',
        );
        expect(
            IMAGE_AEM_FRAGMENT_MAPPING.allowedBorderColors,
        ).to.include.members([
            'color-yellow-300-variation',
            'spectrum-yellow-300-plans',
        ]);
    });
});
