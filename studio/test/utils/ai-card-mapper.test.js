import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    mapAIConfigToFragmentFields,
    createFragmentFromAIConfig,
    validateAIConfig,
    createFragmentDataForAEM,
    applyDualOsiToCtas,
} from '../../src/utils/ai-card-mapper.js';
import { TAG_MODEL_ID_MAPPING, CARD_MODEL_PATH } from '../../src/constants.js';

const MERCH_CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];

const MOCK_FRAGMENT_MAPPING = {
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { tag: 'div', slot: 'footer' },
    prices: { tag: 'span', slot: 'price' },
    badge: { default: '#EDCC2D' },
    mnemonics: {},
    osi: {},
};

function stubMerchCard(mapping = MOCK_FRAGMENT_MAPPING) {
    sinon.stub(window.customElements, 'get').callsFake((name) => {
        if (name === 'merch-card') {
            return { getFragmentMapping: () => mapping };
        }
        if (name === 'aem-fragment') return undefined;
        return undefined;
    });
}

describe('ai-card-mapper', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        sinon.restore();
    });

    describe('mapAIConfigToFragmentFields', () => {
        it('should throw when variant has no fragment mapping', () => {
            sinon.stub(window.customElements, 'get').returns(undefined);
            expect(() => mapAIConfigToFragmentFields({}, 'nonexistent')).to.throw(
                'No fragment mapping found for variant: nonexistent',
            );
        });

        it('should always include a variant field', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({}, 'catalog');
            const variantField = fields.find((f) => f.name === 'variant');
            expect(variantField).to.deep.equal({ name: 'variant', type: 'text', values: ['catalog'] });
        });

        it('should map title to cardTitle using VARIANT_TO_AEM_FIELD_MAPPING', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ title: '<h3>Test</h3>' }, 'catalog');
            const titleField = fields.find((f) => f.name === 'cardTitle');
            expect(titleField).to.exist;
            expect(titleField.type).to.equal('text');
            expect(titleField.values).to.deep.equal(['<h3>Test</h3>']);
        });

        it('should map description as long-text when mapping has tag/slot', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ description: '<div>Some text</div>' }, 'catalog');
            const descField = fields.find((f) => f.name === 'description');
            expect(descField).to.exist;
            expect(descField.type).to.equal('long-text');
            expect(descField.values).to.deep.equal(['<div>Some text</div>']);
        });

        it('should map osi field as text', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ osi: 'abc123' }, 'catalog');
            const osiField = fields.find((f) => f.name === 'osi');
            expect(osiField).to.deep.equal({ name: 'osi', type: 'text', values: ['abc123'] });
        });

        it('should skip fields with falsy values', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ title: '', description: null, osi: undefined }, 'catalog');
            expect(fields).to.have.lengthOf(1);
            expect(fields[0].name).to.equal('variant');
        });

        it('should skip variant key in aiConfig entries', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ variant: 'catalog' }, 'catalog');
            const variantFields = fields.filter((f) => f.name === 'variant');
            expect(variantFields).to.have.lengthOf(1);
        });

        it('should skip fields not in fragment mapping', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ unknownField: 'value' }, 'catalog');
            expect(fields).to.have.lengthOf(1);
            expect(fields[0].name).to.equal('variant');
        });

        it('should auto-inject showSecureLabel=true for plans variants', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ title: '<h3>Creative Cloud</h3>' }, 'plans');
            const secureLabelField = fields.find((f) => f.name === 'showSecureLabel');
            expect(secureLabelField).to.deep.equal({
                name: 'showSecureLabel',
                type: 'text',
                values: ['true'],
            });
        });

        it('should auto-inject showSecureLabel=true for plans sub-variants (plans-education, plans-students)', () => {
            stubMerchCard();
            const eduFields = mapAIConfigToFragmentFields({}, 'plans-education');
            const studentsFields = mapAIConfigToFragmentFields({}, 'plans-students');
            expect(eduFields.find((f) => f.name === 'showSecureLabel')?.values).to.deep.equal(['true']);
            expect(studentsFields.find((f) => f.name === 'showSecureLabel')?.values).to.deep.equal(['true']);
        });

        it('should not auto-inject showSecureLabel for non-plans variants', () => {
            stubMerchCard();
            const catalogFields = mapAIConfigToFragmentFields({ title: '<h3>Photoshop</h3>' }, 'catalog');
            expect(catalogFields.find((f) => f.name === 'showSecureLabel')).to.be.undefined;
        });

        it('should respect an explicit showSecureLabel from aiConfig for plans variants', () => {
            stubMerchCard({ ...MOCK_FRAGMENT_MAPPING, showSecureLabel: {} });
            const fields = mapAIConfigToFragmentFields({ showSecureLabel: 'false' }, 'plans');
            const secureLabelFields = fields.filter((f) => f.name === 'showSecureLabel');
            expect(secureLabelFields).to.have.lengthOf(1);
            expect(secureLabelFields[0].values).to.deep.equal(['false']);
        });

        it('should stamp distinct data-wcs-osi onto buy-now and free-trial anchors for plans variants', () => {
            stubMerchCard();
            const ctas =
                '<p slot="footer">' +
                '<a class="con-button primary-outline" data-analytics-id="buy-now">Buy now</a>' +
                '<a class="con-button primary-outline" data-analytics-id="free-trial">Free trial</a>' +
                '</p>';
            const fields = mapAIConfigToFragmentFields({ ctas, osi: 'base-osi-123', trialOsi: 'trial-osi-456' }, 'plans');
            const ctasField = fields.find((f) => f.name === 'ctas');
            expect(ctasField).to.exist;
            const html = ctasField.values[0];
            expect(html).to.include('data-analytics-id="buy-now"');
            expect(html).to.include('data-analytics-id="free-trial"');
            expect(html).to.match(
                /data-analytics-id="buy-now"[^>]*data-wcs-osi="base-osi-123"|data-wcs-osi="base-osi-123"[^>]*data-analytics-id="buy-now"/,
            );
            expect(html).to.match(
                /data-analytics-id="free-trial"[^>]*data-wcs-osi="trial-osi-456"|data-wcs-osi="trial-osi-456"[^>]*data-analytics-id="free-trial"/,
            );
        });

        it('should emit both osi and trialOsi as top-level fields for plans variants', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ osi: 'base-osi-123', trialOsi: 'trial-osi-456' }, 'plans');
            const osiField = fields.find((f) => f.name === 'osi');
            const trialOsiField = fields.find((f) => f.name === 'trialOsi');
            expect(osiField).to.deep.equal({ name: 'osi', type: 'text', values: ['base-osi-123'] });
            expect(trialOsiField).to.deep.equal({ name: 'trialOsi', type: 'text', values: ['trial-osi-456'] });
        });

        it('should drop the free-trial anchor entirely when trialOsi is missing for plans variants', () => {
            stubMerchCard();
            const ctas =
                '<p slot="footer">' +
                '<a class="con-button primary-outline" data-analytics-id="buy-now">Buy now</a> ' +
                '<a class="con-button primary-outline" data-analytics-id="free-trial">Free trial</a>' +
                '</p>';
            const fields = mapAIConfigToFragmentFields({ ctas, osi: 'base-osi-only' }, 'plans');
            const ctasField = fields.find((f) => f.name === 'ctas');
            const html = ctasField.values[0];
            expect(html).to.include('data-analytics-id="buy-now"');
            expect(html).to.not.include('data-analytics-id="free-trial"');
            expect(html).to.not.include('Free trial');
            expect(fields.find((f) => f.name === 'trialOsi')).to.be.undefined;
        });

        it('should leave anchors without data-analytics-id untouched', () => {
            stubMerchCard();
            const ctas = '<p slot="footer"><a class="con-button">Click me</a></p>';
            const fields = mapAIConfigToFragmentFields({ ctas, osi: 'base', trialOsi: 'trial' }, 'plans');
            const html = fields.find((f) => f.name === 'ctas').values[0];
            expect(html).to.equal(ctas);
        });

        it('should not rewrite ctas for non-plans variants even when trialOsi is provided', () => {
            stubMerchCard();
            const ctas =
                '<p slot="footer"><a data-analytics-id="buy-now">Buy</a><a data-analytics-id="free-trial">Trial</a></p>';
            const fields = mapAIConfigToFragmentFields({ ctas, osi: 'base', trialOsi: 'trial' }, 'catalog');
            const html = fields.find((f) => f.name === 'ctas').values[0];
            expect(html).to.equal(ctas);
            expect(html).to.not.include('data-wcs-osi');
        });

        describe('applyDualOsiToCtas helper', () => {
            it('returns the input unchanged for non-string values', () => {
                expect(applyDualOsiToCtas(null, 'a', 'b')).to.equal(null);
                expect(applyDualOsiToCtas(undefined, 'a', 'b')).to.equal(undefined);
                expect(applyDualOsiToCtas('', 'a', 'b')).to.equal('');
            });

            it('returns the input unchanged when no recognised anchors are present', () => {
                const html = '<p><a>Click</a></p>';
                expect(applyDualOsiToCtas(html, 'a', 'b')).to.equal(html);
            });

            it('stamps both OSIs when both anchors are present', () => {
                const html = '<p><a data-analytics-id="buy-now">Buy</a><a data-analytics-id="free-trial">Trial</a></p>';
                const out = applyDualOsiToCtas(html, 'X', 'Y');
                expect(out).to.include('data-wcs-osi="X"');
                expect(out).to.include('data-wcs-osi="Y"');
            });

            it('removes the trial anchor when trialOsi is missing', () => {
                const html = '<p><a data-analytics-id="buy-now">Buy</a> <a data-analytics-id="free-trial">Trial</a></p>';
                const out = applyDualOsiToCtas(html, 'X');
                expect(out).to.include('data-analytics-id="buy-now"');
                expect(out).to.not.include('free-trial');
                expect(out).to.not.include('Trial');
            });
        });

        it('should map a complete config with multiple fields', () => {
            stubMerchCard();
            const config = {
                title: '<h3>Photoshop</h3>',
                description: '<div>Edit photos</div>',
                ctas: '<div><a href="#">Buy now</a></div>',
                osi: 'offer123',
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            expect(fields.length).to.be.greaterThan(1);
            expect(fields.find((f) => f.name === 'variant')).to.exist;
            expect(fields.find((f) => f.name === 'cardTitle')).to.exist;
            expect(fields.find((f) => f.name === 'description')).to.exist;
            expect(fields.find((f) => f.name === 'ctas')).to.exist;
            expect(fields.find((f) => f.name === 'osi')).to.exist;
        });
    });

    describe('mapMnemonics (via mapAIConfigToFragmentFields)', () => {
        it('should map mnemonic array to three fields', () => {
            stubMerchCard();
            const config = {
                mnemonics: [
                    { icon: 'photoshop-icon', alt: 'Photoshop', link: '/photoshop' },
                    { icon: 'lightroom-icon', alt: 'Lightroom', link: '/lightroom' },
                ],
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            const iconField = fields.find((f) => f.name === 'mnemonicIcon');
            const altField = fields.find((f) => f.name === 'mnemonicAlt');
            const linkField = fields.find((f) => f.name === 'mnemonicLink');

            expect(iconField.values).to.deep.equal(['photoshop-icon', 'lightroom-icon']);
            expect(altField.values).to.deep.equal(['Photoshop', 'Lightroom']);
            expect(linkField.values).to.deep.equal(['/photoshop', '/lightroom']);
        });

        it('should handle mnemonics with missing properties', () => {
            stubMerchCard();
            const config = {
                mnemonics: [{ icon: 'ps-icon' }],
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            const altField = fields.find((f) => f.name === 'mnemonicAlt');
            const linkField = fields.find((f) => f.name === 'mnemonicLink');
            expect(altField.values).to.deep.equal(['']);
            expect(linkField.values).to.deep.equal(['']);
        });

        it('should produce no mnemonic fields for empty array', () => {
            stubMerchCard();
            const config = { mnemonics: [] };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            expect(fields.find((f) => f.name === 'mnemonicIcon')).to.be.undefined;
        });
    });

    describe('mapBadge (via mapAIConfigToFragmentFields)', () => {
        it('should map badge with text and background color', () => {
            stubMerchCard();
            const config = {
                badge: { text: 'Best Value', backgroundColor: '#FF0000' },
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            const badgeField = fields.find((f) => f.name === 'badge');
            expect(badgeField).to.exist;
            expect(badgeField.type).to.equal('long-text');
            expect(badgeField.values[0]).to.include('Best Value');
            expect(badgeField.values[0]).to.include('background-color="#FF0000"');
        });

        it('should use default background color from mapping config when none provided', () => {
            stubMerchCard();
            const config = {
                badge: { text: 'Popular' },
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            const badgeField = fields.find((f) => f.name === 'badge');
            expect(badgeField.values[0]).to.include('background-color="#EDCC2D"');
        });

        it('should produce no badge field when badge has no text', () => {
            stubMerchCard();
            const config = {
                badge: { backgroundColor: '#FF0000' },
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            expect(fields.find((f) => f.name === 'badge')).to.be.undefined;
        });

        it('should produce merch-badge HTML element', () => {
            stubMerchCard();
            const config = {
                badge: { text: 'New', backgroundColor: '#00FF00' },
            };
            const fields = mapAIConfigToFragmentFields(config, 'catalog');
            const badgeField = fields.find((f) => f.name === 'badge');
            expect(badgeField.values[0]).to.match(/^<merch-badge.*>New<\/merch-badge>$/);
        });
    });

    describe('validateAIConfig', () => {
        const variantConfig = {
            requiredFields: ['title', 'description'],
            ctaStyle: 'accent',
            mapping: {
                description: { tag: 'div', slot: 'body-xs' },
                ctas: { tag: 'div', slot: 'footer' },
            },
        };

        it('should return valid for a complete config', () => {
            const config = {
                variant: 'catalog',
                title: '<h3>Title</h3>',
                description: '<div slot="body-xs">Desc</div>',
                ctas: '<div slot="footer"><a class="accent">Buy</a></div>',
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.valid).to.be.true;
            expect(result.errors).to.have.lengthOf(0);
        });

        it('should report error when variant is missing', () => {
            const result = validateAIConfig({}, variantConfig);
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Variant is required');
        });

        it('should report error when variantConfig is null', () => {
            const result = validateAIConfig({ variant: 'unknown' }, null);
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Unknown variant: unknown');
        });

        it('should report errors for missing required fields', () => {
            const config = { variant: 'catalog' };
            const result = validateAIConfig(config, variantConfig);
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Required field missing: title');
            expect(result.errors).to.include('Required field missing: description');
        });

        it('should warn when CTA style does not match', () => {
            const config = {
                variant: 'catalog',
                title: 'T',
                description: 'D',
                ctas: '<a class="primary">Buy</a>',
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('CTA style mismatch'))).to.be.true;
        });

        it('should not warn when CTA style matches', () => {
            const config = {
                variant: 'catalog',
                title: 'T',
                description: 'D',
                ctas: '<a class="accent">Buy</a>',
            };
            const result = validateAIConfig(config, variantConfig);
            const ctaWarnings = result.warnings.filter((w) => w.includes('CTA style'));
            expect(ctaWarnings).to.have.lengthOf(0);
        });

        it('should warn when slot attribute is missing from field value', () => {
            const config = {
                variant: 'catalog',
                title: 'T',
                description: '<div>No slot</div>',
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('slot="body-xs"'))).to.be.true;
        });

        it('should warn when tag does not match expected element', () => {
            const config = {
                variant: 'catalog',
                title: 'T',
                description: '<span slot="body-xs">Wrong tag</span>',
            };
            const result = validateAIConfig(config, variantConfig);
            expect(result.warnings.some((w) => w.includes('<div>'))).to.be.true;
        });

        it('should skip slot/tag validation for non-string values', () => {
            const config = {
                variant: 'catalog',
                title: 'T',
                description: 123,
            };
            const result = validateAIConfig(config, variantConfig);
            const slotWarnings = result.warnings.filter((w) => w.includes('slot='));
            expect(slotWarnings).to.have.lengthOf(0);
        });

        it('should handle variantConfig with no requiredFields', () => {
            const config = { variant: 'simple' };
            const result = validateAIConfig(config, { mapping: {} });
            expect(result.valid).to.be.true;
        });

        it('should handle variantConfig with no mapping', () => {
            const config = { variant: 'simple', title: 'T' };
            const result = validateAIConfig(config, { requiredFields: ['title'] });
            expect(result.valid).to.be.true;
            expect(result.warnings).to.have.lengthOf(0);
        });
    });

    describe('createFragmentDataForAEM', () => {
        it('should return object with modelId, title, fields', () => {
            stubMerchCard();
            const config = { title: 'Test Card', osi: 'o1' };
            const result = createFragmentDataForAEM(config, 'catalog', {
                title: 'My Card',
                name: 'my-card',
                parentPath: '/content/dam/mas',
            });

            expect(result.modelId).to.equal(MERCH_CARD_MODEL_ID);
            expect(result.title).to.equal('My Card');
            expect(result.name).to.equal('my-card');
            expect(result.parentPath).to.equal('/content/dam/mas');
            expect(result.fields).to.be.an('array');
        });

        it('should extract title from config when options.title not provided', () => {
            stubMerchCard();
            const config = { title: '<h3>Photoshop</h3>' };
            const result = createFragmentDataForAEM(config, 'catalog');
            expect(result.title).to.equal('Photoshop');
        });

        it('should fallback to cardTitle field', () => {
            stubMerchCard();
            const config = { cardTitle: 'Illustrator' };
            const result = createFragmentDataForAEM(config, 'catalog');
            expect(result.title).to.equal('Illustrator');
        });

        it('should fallback to name field', () => {
            stubMerchCard();
            const config = { name: 'My Product' };
            const result = createFragmentDataForAEM(config, 'catalog');
            expect(result.title).to.equal('My Product');
        });

        it('should fallback to default title when no title-like fields exist', () => {
            stubMerchCard();
            const result = createFragmentDataForAEM({}, 'catalog');
            expect(result.title).to.equal('AI Generated Card');
        });

        it('should handle empty options', () => {
            stubMerchCard();
            const result = createFragmentDataForAEM({ title: 'T' }, 'catalog');
            expect(result.name).to.be.undefined;
            expect(result.parentPath).to.be.undefined;
        });
    });

    describe('createFragmentFromAIConfig', () => {
        it('should return a Fragment instance', () => {
            stubMerchCard();
            const config = { title: '<h3>Card</h3>', osi: 'o1' };
            const fragment = createFragmentFromAIConfig(config, 'catalog', {
                id: 'test-id',
                title: 'Test Card',
            });
            expect(fragment).to.exist;
            expect(fragment.id).to.equal('test-id');
        });

        it('should generate a temp id when none provided', () => {
            stubMerchCard();
            const fragment = createFragmentFromAIConfig({}, 'catalog');
            expect(fragment.id).to.match(/^temp-ai-/);
        });

        it('should set model path and id on fragment', () => {
            stubMerchCard();
            const fragment = createFragmentFromAIConfig({}, 'catalog');
            expect(fragment.model.path).to.equal(CARD_MODEL_PATH);
            expect(fragment.model.id).to.equal(MERCH_CARD_MODEL_ID);
        });

        it('should default status to DRAFT', () => {
            stubMerchCard();
            const fragment = createFragmentFromAIConfig({}, 'catalog');
            expect(fragment.status).to.equal('DRAFT');
        });

        it('should use provided status', () => {
            stubMerchCard();
            const fragment = createFragmentFromAIConfig({}, 'catalog', { status: 'PUBLISHED' });
            expect(fragment.status).to.equal('PUBLISHED');
        });

        it('should include mapped fields on the fragment', () => {
            stubMerchCard();
            const config = { title: '<h3>PS</h3>', osi: 'abc' };
            const fragment = createFragmentFromAIConfig(config, 'catalog');
            const variantField = fragment.fields.find((f) => f.name === 'variant');
            const osiField = fragment.fields.find((f) => f.name === 'osi');
            expect(variantField.values).to.deep.equal(['catalog']);
            expect(osiField.values).to.deep.equal(['abc']);
        });

        it('should use provided tags', () => {
            stubMerchCard();
            const tags = ['mas:plan_type/abm'];
            const fragment = createFragmentFromAIConfig({}, 'catalog', { tags });
            expect(fragment.tags).to.deep.equal(tags);
        });
    });
});
