import { expect } from '@open-wc/testing';
import { mapAIConfigToFragmentFields, validateAIConfig, createFragmentDataForAEM } from '../../src/utils/ai-card-mapper.js';

const MOCK_CATALOG_MAPPING = {
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    prices: { tag: 'p', slot: 'price' },
    ctas: { tag: 'footer', slot: 'footer' },
    badge: { default: '#EDCC2D' },
    mnemonics: {},
    osi: {},
    backgroundImage: { tag: 'div', slot: 'bg-image' },
    size: {},
};

if (!customElements.get('merch-card')) {
    class MockMerchCard extends HTMLElement {
        static getFragmentMapping(variant) {
            if (variant === 'catalog') return MOCK_CATALOG_MAPPING;
            return null;
        }
    }
    customElements.define('merch-card', MockMerchCard);
}

describe('ai-card-mapper', () => {
    describe('mapAIConfigToFragmentFields', () => {
        it('always includes variant field', () => {
            const fields = mapAIConfigToFragmentFields({ variant: 'catalog' }, 'catalog');
            const variantField = fields.find((f) => f.name === 'variant');
            expect(variantField).to.exist;
            expect(variantField.values).to.deep.equal(['catalog']);
        });

        it('maps title to cardTitle', () => {
            const fields = mapAIConfigToFragmentFields({ title: 'My Title' }, 'catalog');
            const titleField = fields.find((f) => f.name === 'cardTitle');
            expect(titleField).to.exist;
            expect(titleField.values).to.deep.equal(['My Title']);
            expect(titleField.type).to.equal('text');
        });

        it('maps osi field', () => {
            const fields = mapAIConfigToFragmentFields({ osi: 'abc123' }, 'catalog');
            const osiField = fields.find((f) => f.name === 'osi');
            expect(osiField).to.exist;
            expect(osiField.values).to.deep.equal(['abc123']);
        });

        it('skips null/empty values', () => {
            const fields = mapAIConfigToFragmentFields({ title: '', description: null }, 'catalog');
            expect(fields.length).to.equal(1);
            expect(fields[0].name).to.equal('variant');
        });

        it('skips variant in iteration', () => {
            const fields = mapAIConfigToFragmentFields({ variant: 'catalog' }, 'catalog');
            const variantFields = fields.filter((f) => f.name === 'variant');
            expect(variantFields.length).to.equal(1);
        });

        it('throws for unknown variant', () => {
            expect(() => mapAIConfigToFragmentFields({}, 'nonexistent-variant-xyz')).to.throw('No fragment mapping');
        });

        it('maps mnemonics array to icon/alt/link fields', () => {
            const fields = mapAIConfigToFragmentFields(
                {
                    mnemonics: [
                        { icon: 'ps.svg', alt: 'Photoshop', link: '/ps' },
                        { icon: 'ai.svg', alt: 'Illustrator', link: '/ai' },
                    ],
                },
                'catalog',
            );
            const iconField = fields.find((f) => f.name === 'mnemonicIcon');
            const altField = fields.find((f) => f.name === 'mnemonicAlt');
            const linkField = fields.find((f) => f.name === 'mnemonicLink');
            expect(iconField.values).to.deep.equal(['ps.svg', 'ai.svg']);
            expect(altField.values).to.deep.equal(['Photoshop', 'Illustrator']);
            expect(linkField.values).to.deep.equal(['/ps', '/ai']);
        });

        it('maps empty mnemonics to nothing', () => {
            const fields = mapAIConfigToFragmentFields({ mnemonics: [] }, 'catalog');
            expect(fields.find((f) => f.name === 'mnemonicIcon')).to.be.undefined;
        });

        it('maps badge object to merch-badge HTML', () => {
            const fields = mapAIConfigToFragmentFields(
                {
                    badge: { text: 'Best Value', backgroundColor: '#000' },
                },
                'catalog',
            );
            const badgeField = fields.find((f) => f.name === 'badge');
            expect(badgeField).to.exist;
            expect(badgeField.type).to.equal('long-text');
            expect(badgeField.values[0]).to.include('merch-badge');
            expect(badgeField.values[0]).to.include('Best Value');
            expect(badgeField.values[0]).to.include('background-color="#000"');
        });

        it('skips badge with no text', () => {
            const fields = mapAIConfigToFragmentFields({ badge: { backgroundColor: '#000' } }, 'catalog');
            expect(fields.find((f) => f.name === 'badge')).to.be.undefined;
        });
    });

    describe('validateAIConfig', () => {
        it('returns error when variant is missing', () => {
            const result = validateAIConfig({}, null);
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Variant is required');
        });

        it('returns error for unknown variant config', () => {
            const result = validateAIConfig({ variant: 'bad' }, null);
            expect(result.valid).to.be.false;
            expect(result.errors.some((e) => e.includes('Unknown variant'))).to.be.true;
        });

        it('returns error for missing required fields', () => {
            const config = { variant: 'catalog' };
            const variantConfig = { requiredFields: ['title', 'ctas'] };
            const result = validateAIConfig(config, variantConfig);
            expect(result.valid).to.be.false;
            expect(result.errors.some((e) => e.includes('title'))).to.be.true;
            expect(result.errors.some((e) => e.includes('ctas'))).to.be.true;
        });

        it('returns valid when all required fields present', () => {
            const config = { variant: 'catalog', title: 'Hello', ctas: '<a>Buy</a>' };
            const variantConfig = { requiredFields: ['title', 'ctas'] };
            const result = validateAIConfig(config, variantConfig);
            expect(result.valid).to.be.true;
            expect(result.errors).to.have.length(0);
        });

        it('warns on CTA style mismatch', () => {
            const config = { variant: 'catalog', ctas: '<a class="wrong">Buy</a>' };
            const variantConfig = { ctaStyle: 'accent' };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('CTA style'))).to.be.true;
        });

        it('warns on missing slot', () => {
            const config = { variant: 'catalog', description: '<p>hello</p>' };
            const variantConfig = {
                mapping: {
                    description: { slot: 'body-xs', tag: 'div' },
                },
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('slot="body-xs"'))).to.be.true;
        });

        it('warns on wrong tag', () => {
            const config = { variant: 'catalog', description: '<p slot="body-xs">hello</p>' };
            const variantConfig = {
                mapping: {
                    description: { slot: 'body-xs', tag: 'div' },
                },
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('<div>'))).to.be.true;
        });
    });

    describe('createFragmentDataForAEM', () => {
        it('returns object with modelId, title, name, parentPath, and fields', () => {
            const data = createFragmentDataForAEM({ title: 'Test' }, 'catalog', {
                title: 'My Card',
                name: 'my-card',
                parentPath: '/content/dam/mas/acom/en_US',
            });
            expect(data.modelId).to.be.a('string');
            expect(data.title).to.equal('My Card');
            expect(data.name).to.equal('my-card');
            expect(data.parentPath).to.equal('/content/dam/mas/acom/en_US');
            expect(data.fields).to.be.an('array');
        });

        it('uses extracted title from config when no title option', () => {
            const data = createFragmentDataForAEM({ title: 'Card Title' }, 'catalog', {});
            expect(data.title).to.equal('Card Title');
        });
    });
});
