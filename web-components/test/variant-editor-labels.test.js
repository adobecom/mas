import { expect } from '@esm-bundle/chai';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import { MARQUEE_AEM_FRAGMENT_MAPPING } from '../src/variants/marquee.js';
import { FAQ_AEM_FRAGMENT_MAPPING } from '../src/variants/faq.js';
import { BANNER_BLADE_AEM_FRAGMENT_MAPPING } from '../src/variants/banner-blade.js';
import { HEADLESS_AEM_FRAGMENT_MAPPING } from '../src/variants/headless.js';

const labels = (mapping, keys) => keys.map((key) => mapping[key].editorLabel);

describe('variant editorLabel values', () => {
    it('labels the marquee fields', () => {
        expect(
            labels(MARQUEE_AEM_FRAGMENT_MAPPING, [
                'title',
                'description',
                'ctas',
            ]),
        ).to.deep.equal([
            'Marquee title',
            'Marquee description',
            'Marquee CTA',
        ]);
    });

    it('labels the FAQ answers', () => {
        expect(
            labels(FAQ_AEM_FRAGMENT_MAPPING, [
                'description',
                'shortDescription',
                'callout',
            ]),
        ).to.deep.equal(['Answer 1', 'Answer 2', 'Answer 3']);
    });

    it('labels the banner-blade fields', () => {
        expect(
            labels(BANNER_BLADE_AEM_FRAGMENT_MAPPING, [
                'title',
                'description',
                'ctas',
            ]),
        ).to.deep.equal(['Title', 'Description', 'CTA']);
    });

    it('leaves the generic headless labels to the defaults', () => {
        for (const key of ['title', 'promoText', 'shortDescription']) {
            expect(HEADLESS_AEM_FRAGMENT_MAPPING[key].editorLabel).to.be
                .undefined;
        }
    });
});
