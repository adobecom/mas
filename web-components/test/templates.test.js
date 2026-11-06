// Every template file registers exactly the templates it is named for, and only
// uses the injected dependencies (the build fails on any import).
import { expect } from '@esm-bundle/chai';
import { templateDeps } from '../src/template-deps.js';

const FILES = {
    'ah-promoted-plans': ['ah-promoted-plans'],
    'ah-try-buy-widget': ['ah-try-buy-widget'],
    'brand-concierge-product': ['brand-concierge-product'],
    catalog: ['catalog'],
    'ccd-slice': ['ccd-slice'],
    'ccd-suggested': ['ccd-suggested'],
    'compare-chart-column': ['compare-chart-column'],
    fries: ['fries'],
    'full-pricing-express': ['full-pricing-express'],
    headless: ['headless', 'marquee', 'faq', 'banner-blade'],
    image: ['image'],
    'inline-heading': ['inline-heading'],
    media: ['media'],
    mini: ['mini'],
    'mini-compare-chart': ['mini-compare-chart'],
    'mini-compare-chart-mweb': ['mini-compare-chart-mweb'],
    plans: ['plans', 'plans-students', 'plans-education'],
    'plans-v2': ['plans-v2'],
    pro: ['pro'],
    product: ['product'],
    'product-c2': ['product-c2'],
    'product-pricing': ['product-pricing'],
    segment: ['segment'],
    'simplified-pricing-express': ['simplified-pricing-express'],
    'special-offers': ['special-offers'],
};

describe('template files', () => {
    for (const [file, names] of Object.entries(FILES)) {
        it(`${file}.js registers ${names.join(', ')}`, async () => {
            const { define } = await import(`../src/templates/${file}.js`);
            const templates = define(templateDeps);
            expect(Object.keys(templates)).to.have.members(names);
            for (const template of Object.values(templates)) {
                expect(template.class.prototype).to.be.instanceOf(
                    templateDeps.TemplateLayout,
                );
            }
        });
    }
});
