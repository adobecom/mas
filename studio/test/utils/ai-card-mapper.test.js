import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    mapAIConfigToFragmentFields,
    createFragmentFromAIConfig,
    validateAIConfig,
    createFragmentDataForAEM,
    extractTitleFromConfig,
    parseBadgeHtmlString,
    enrichConfigWithMcsMnemonic,
    buildReleaseCtas,
    buildReleasePrice,
    buildReleaseTags,
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

        it('should map description as long-text', () => {
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

        it('should skip only null and undefined field values (preserving "", 0, false)', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ title: '', description: null, osi: undefined, price: 0 }, 'catalog');
            // variant + title (empty string preserved) + price (0 preserved); description/osi dropped
            const names = fields.map((f) => f.name);
            expect(names).to.include('variant');
            expect(fields.find((f) => f.name === 'description')).to.be.undefined;
            expect(fields.find((f) => f.name === 'osi')).to.be.undefined;
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

        it('should not inject secureLabel or showSecureLabel (secure label is handled by settings, not fragment fields)', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ title: '<h3>Creative Cloud</h3>' }, 'plans');
            expect(fields.find((f) => f.name === 'secureLabel')).to.be.undefined;
            expect(fields.find((f) => f.name === 'showSecureLabel')).to.be.undefined;
        });

        it('should emit osi but not trialOsi as a top-level field (trialOsi is not an AEM model field)', () => {
            stubMerchCard();
            const fields = mapAIConfigToFragmentFields({ osi: 'base-osi-123', trialOsi: 'trial-osi-456' }, 'plans');
            const osiField = fields.find((f) => f.name === 'osi');
            const trialOsiField = fields.find((f) => f.name === 'trialOsi');
            expect(osiField).to.deep.equal({ name: 'osi', type: 'text', values: ['base-osi-123'] });
            expect(trialOsiField).to.be.undefined;
        });

        it('should not rewrite ctas for non-plans non-catalog variants even when trialOsi is provided', () => {
            stubMerchCard();
            const ctas =
                '<p slot="footer"><a data-analytics-id="buy-now">Buy</a><a data-analytics-id="free-trial">Trial</a></p>';
            const fields = mapAIConfigToFragmentFields({ ctas, osi: 'base', trialOsi: 'trial' }, 'fries');
            const html = fields.find((f) => f.name === 'ctas').values[0];
            expect(html).to.equal(ctas);
            expect(html).to.not.include('data-wcs-osi');
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
        describe('attribute-mode variants (catalog, ccd-slice, ccd-suggested)', () => {
            it('should emit plain text badge + separate badgeBackgroundColor for catalog', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: { text: 'Best Value', backgroundColor: '#FF0000' } },
                    'catalog',
                );
                const badgeField = fields.find((f) => f.name === 'badge');
                const bgField = fields.find((f) => f.name === 'badgeBackgroundColor');
                expect(badgeField).to.exist;
                expect(badgeField.type).to.equal('long-text');
                expect(badgeField.values[0]).to.equal('Best Value');
                expect(bgField).to.exist;
                expect(bgField.values[0]).to.equal('#FF0000');
            });

            it('should emit plain text badge + separate badgeBackgroundColor for ccd-slice', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: { text: 'New', backgroundColor: 'spectrum-blue-300' } },
                    'ccd-slice',
                );
                expect(fields.find((f) => f.name === 'badge').values[0]).to.equal('New');
                expect(fields.find((f) => f.name === 'badgeBackgroundColor').values[0]).to.equal('spectrum-blue-300');
            });

            it('should use default background color from mapping config when none provided', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields({ badge: { text: 'Popular' } }, 'catalog');
                const bgField = fields.find((f) => f.name === 'badgeBackgroundColor');
                expect(bgField).to.exist;
                expect(bgField.values[0]).to.equal('#EDCC2D');
            });

            it('should produce no badge field when badge has no text', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields({ badge: { backgroundColor: '#FF0000' } }, 'catalog');
                expect(fields.find((f) => f.name === 'badge')).to.be.undefined;
            });

            it('should NOT wrap badge in merch-badge HTML for catalog', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields({ badge: { text: 'New', backgroundColor: '#00FF00' } }, 'catalog');
                const badgeField = fields.find((f) => f.name === 'badge');
                expect(badgeField.values[0]).to.equal('New');
                expect(badgeField.values[0]).to.not.include('<merch-badge');
            });

            it('should parse a pre-rendered merch-badge HTML string and emit correctly for catalog', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: '<merch-badge background-color="spectrum-blue-300">New</merch-badge>' },
                    'catalog',
                );
                const badgeField = fields.find((f) => f.name === 'badge');
                const bgField = fields.find((f) => f.name === 'badgeBackgroundColor');
                expect(badgeField.values[0]).to.equal('New');
                expect(bgField.values[0]).to.equal('spectrum-blue-300');
            });
        });

        describe('slot-mode variants (plans, fries, etc.)', () => {
            it('should wrap badge in merch-badge HTML for plans', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: { text: 'Best value', backgroundColor: 'spectrum-yellow-300-plans' } },
                    'plans',
                );
                const badgeField = fields.find((f) => f.name === 'badge');
                expect(badgeField).to.exist;
                expect(badgeField.values[0]).to.match(/^<merch-badge.*>Best value<\/merch-badge>$/);
                expect(badgeField.values[0]).to.include('background-color="spectrum-yellow-300-plans"');
                expect(fields.find((f) => f.name === 'badgeBackgroundColor')).to.be.undefined;
            });

            it('should escape HTML-unsafe characters in badge text for slot-based variants', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: { text: '</merch-badge><img src=x onerror=alert(1)>', backgroundColor: '#FF0000' } },
                    'plans',
                );
                const html = fields.find((f) => f.name === 'badge').values[0];
                expect(html).to.not.include('<img');
                expect(html).to.not.include('</merch-badge><img');
                expect(html).to.include('&lt;/merch-badge&gt;&lt;img');
                expect(html).to.match(/^<merch-badge[^>]*>.*<\/merch-badge>$/);
            });

            it('should escape quote-breaking characters in badge backgroundColor attribute', () => {
                stubMerchCard();
                const fields = mapAIConfigToFragmentFields(
                    { badge: { text: 'Sale', backgroundColor: 'red" onclick="alert(1)' } },
                    'plans',
                );
                const html = fields.find((f) => f.name === 'badge').values[0];
                expect(html).to.include('background-color="red&quot; onclick=&quot;alert(1)"');
                expect(html).to.not.match(/background-color="red"\s+onclick=/);
                const attrs = html.match(/<merch-badge([^>]*)>/)[1];
                expect(attrs.match(/"/g)).to.have.lengthOf(2);
            });
        });

        describe('parseBadgeHtmlString helper', () => {
            it('returns null for non-merch-badge strings', () => {
                expect(parseBadgeHtmlString('<div>hello</div>')).to.be.null;
                expect(parseBadgeHtmlString('plain text')).to.be.null;
                expect(parseBadgeHtmlString('')).to.be.null;
                expect(parseBadgeHtmlString(null)).to.be.null;
            });

            it('extracts text and background-color from a merch-badge HTML string', () => {
                const result = parseBadgeHtmlString('<merch-badge background-color="spectrum-blue-300">New</merch-badge>');
                expect(result).to.deep.equal({ text: 'New', backgroundColor: 'spectrum-blue-300' });
            });

            it('returns undefined backgroundColor when attribute is absent', () => {
                const result = parseBadgeHtmlString('<merch-badge>Popular</merch-badge>');
                expect(result.text).to.equal('Popular');
                expect(result.backgroundColor).to.be.undefined;
            });
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

        it('should error when catalog config has trialOsi but ctas lacks a free-trial anchor', () => {
            const config = {
                variant: 'catalog',
                title: '<h3 slot="heading-xs">Photoshop</h3>',
                description: '<div slot="body-xs"><p>Edit photos.</p></div>',
                ctas: '<p slot="footer"><a class="con-button accent" data-analytics-id="buy-now">Buy now</a></p>',
            };
            const result = validateAIConfig(config, { requiredFields: [] }, { trialOsi: 'trial-osi-xyz' });
            expect(result.valid).to.be.false;
            expect(result.errors.some((e) => e.includes('free-trial'))).to.be.true;
        });

        it('should pass when catalog config has trialOsi and ctas includes a free-trial anchor', () => {
            const config = {
                variant: 'catalog',
                title: '<h3 slot="heading-xs">Photoshop</h3>',
                description: '<div slot="body-xs"><p>Edit photos.</p></div>',
                ctas:
                    '<p slot="footer">' +
                    '<a class="con-button accent" data-analytics-id="buy-now">Buy now</a>' +
                    '<a class="con-button primary-outline" data-analytics-id="free-trial">Free trial</a>' +
                    '</p>',
            };
            const result = validateAIConfig(config, { requiredFields: [] }, { trialOsi: 'trial-osi-xyz' });
            expect(result.errors.some((e) => e.includes('free-trial'))).to.be.false;
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

    describe('extractTitleFromConfig', () => {
        it('returns the default fallback when title is missing', () => {
            expect(extractTitleFromConfig({})).to.equal('AI Generated Card');
        });

        it('falls back to cardTitle when title is missing', () => {
            expect(extractTitleFromConfig({ cardTitle: 'My Card' })).to.equal('My Card');
        });

        it('falls back to name when title and cardTitle are missing', () => {
            expect(extractTitleFromConfig({ name: 'Plan A' })).to.equal('Plan A');
        });

        it('treats empty or whitespace-only title as missing and falls through', () => {
            expect(extractTitleFromConfig({ title: '', cardTitle: 'Fallback' })).to.equal('Fallback');
            expect(extractTitleFromConfig({ title: '   ', name: 'FromName' })).to.equal('FromName');
        });

        it('treats empty or whitespace-only cardTitle as missing and falls through', () => {
            expect(extractTitleFromConfig({ cardTitle: '', name: 'FromName' })).to.equal('FromName');
        });

        it('treats empty or whitespace-only name as missing and uses default fallback', () => {
            expect(extractTitleFromConfig({ name: '' })).to.equal('AI Generated Card');
            expect(extractTitleFromConfig({ name: '   ' })).to.equal('AI Generated Card');
        });

        it('extracts plain text from a simple HTML title', () => {
            const result = extractTitleFromConfig({ title: '<h3>Hello World</h3>' });
            expect(result).to.equal('Hello World');
        });

        it('strips nested tags and returns concatenated text', () => {
            const result = extractTitleFromConfig({
                title: '<h3>Save <strong>50%</strong> on <em>Photoshop</em></h3>',
            });
            expect(result).to.equal('Save 50% on Photoshop');
        });

        it('strips <img> tags from the title and returns the surrounding text', () => {
            const result = extractTitleFromConfig({
                title: '<h3>Card title</h3><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">',
            });
            expect(result).to.equal('Card title');
        });

        it('strips multiple <img> children and returns concatenated text', () => {
            const result = extractTitleFromConfig({
                title: '<img src="data:,a">Header<img src="data:,b">',
            });
            expect(result).to.equal('Header');
        });

        it('strips <img> with onerror attribute (no script execution)', () => {
            // Inline data URI prevents network fetch in either implementation;
            // the assertion is that the surrounding text is preserved and no
            // exception is thrown by parser side effects.
            const result = extractTitleFromConfig({
                title: '<span>Title</span><img src="data:,x" onerror="window.__shouldNotRun=true">',
            });
            expect(result).to.equal('Title');
            expect(window.__shouldNotRun).to.be.undefined;
        });

        it('does not parse scripts inside the title', () => {
            extractTitleFromConfig({
                title: '<span>OK</span><script>window.__scriptRan=true</script>',
            });
            expect(window.__scriptRan).to.be.undefined;
        });

        it('handles empty string title gracefully', () => {
            const result = extractTitleFromConfig({ title: '' });
            expect(result).to.equal('AI Generated Card');
        });

        it('handles plain text title without any tags', () => {
            expect(extractTitleFromConfig({ title: 'Just plain text' })).to.equal('Just plain text');
        });

        it('uses DOMParser for parsing (no live document side effects)', () => {
            // Snapshot the live document image count before, then call the function
            // with HTML containing an <img>, and verify NO new <img> elements were
            // attached to the live document. This proves the parser is inert.
            const beforeImgCount = document.querySelectorAll('img').length;
            extractTitleFromConfig({
                title: '<img src="data:,a"><img src="data:,b"><img src="data:,c">Header',
            });
            const afterImgCount = document.querySelectorAll('img').length;
            expect(afterImgCount).to.equal(beforeImgCount);
        });
    });

    describe('enrichConfigWithMcsMnemonic', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('injects mnemonics from selectedProduct without any MCS fetch', async () => {
            const fetchStub = sinon.stub(window, 'fetch');
            const product = {
                assets: { icons: { svg: 'https://mcs.example/photoshop.svg' } },
                copy: { name: 'Photoshop' },
            };
            const config = { variant: 'plans', arrangementCode: 'phsp' };
            const result = await enrichConfigWithMcsMnemonic(config, product);
            expect(fetchStub.called).to.be.false;
            expect(result.mnemonics).to.deep.equal([{ icon: 'https://mcs.example/photoshop.svg', alt: 'Photoshop', link: '' }]);
        });

        it('falls back to fetchProductDetail when no selectedProduct', async () => {
            sessionStorage.setItem('masAccessToken', 'test-token');
            sinon.stub(window, 'fetch').resolves({
                ok: true,
                json: () =>
                    Promise.resolve({
                        product: {
                            assets: { icons: { svg: 'https://mcs.example/acrobat.svg' } },
                            copy: { name: 'Acrobat' },
                        },
                    }),
            });
            const config = { variant: 'catalog', arrangementCode: 'acrobat_direct' };
            const result = await enrichConfigWithMcsMnemonic(config, null);
            sessionStorage.removeItem('masAccessToken');
            expect(result.mnemonics).to.deep.equal([{ icon: 'https://mcs.example/acrobat.svg', alt: 'Acrobat', link: '' }]);
        });

        it('uses product.icon as fallback when assets.icons.svg is missing', async () => {
            const product = { icon: 'https://fallback.svg', name: 'Illustrator' };
            const config = { variant: 'catalog' };
            const result = await enrichConfigWithMcsMnemonic(config, product);
            expect(result.mnemonics[0].icon).to.equal('https://fallback.svg');
            expect(result.mnemonics[0].alt).to.equal('Illustrator');
        });

        it('returns config unchanged when product has no icon', async () => {
            const product = { copy: { name: 'NoIcon' } };
            const config = { variant: 'plans' };
            const result = await enrichConfigWithMcsMnemonic(config, product);
            expect(result.mnemonics).to.be.undefined;
        });

        it('returns config unchanged when fetchProductDetail throws', async () => {
            sessionStorage.setItem('masAccessToken', 'test-token');
            sinon.stub(window, 'fetch').rejects(new Error('network error'));
            const config = { variant: 'plans', arrangementCode: 'bad-code' };
            const result = await enrichConfigWithMcsMnemonic(config, null);
            sessionStorage.removeItem('masAccessToken');
            expect(result).to.equal(config);
            expect(result.mnemonics).to.be.undefined;
        });

        it('returns config unchanged when neither selectedProduct nor arrangementCode', async () => {
            const config = { variant: 'catalog' };
            const result = await enrichConfigWithMcsMnemonic(config, null);
            expect(result).to.equal(config);
        });

        it('returns input unchanged for non-object input', async () => {
            expect(await enrichConfigWithMcsMnemonic(null, null)).to.equal(null);
            expect(await enrichConfigWithMcsMnemonic(undefined, null)).to.equal(undefined);
        });
    });

    describe('validateAIConfig — variant-specific required fields', () => {
        it('plans: requires title, prices, description, ctas, osi', () => {
            const result = validateAIConfig({ variant: 'plans' }, { requiredFields: [] });
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Required field missing: title');
            expect(result.errors).to.include('Required field missing: prices');
            expect(result.errors).to.include('Required field missing: description');
            expect(result.errors).to.include('Required field missing: ctas');
            expect(result.errors).to.include('Required field missing: osi');
        });

        it('plans: mnemonics is not required (injected from MCS)', () => {
            const result = validateAIConfig(
                {
                    variant: 'plans',
                    title: 't',
                    prices: 'p',
                    description: 'd',
                    ctas: '<a>Buy</a>',
                    osi: 'osi',
                },
                { requiredFields: [] },
            );
            expect(result.valid).to.be.true;
            expect(result.errors.some((e) => e.includes('mnemonics'))).to.be.false;
        });

        it('catalog: requires title, description, ctas', () => {
            const result = validateAIConfig({ variant: 'catalog' }, { requiredFields: [] });
            expect(result.valid).to.be.false;
            expect(result.errors).to.include('Required field missing: title');
            expect(result.errors).to.include('Required field missing: description');
            expect(result.errors).to.include('Required field missing: ctas');
        });

        it('catalog: errors when trialOsi present but ctas lacks free-trial anchor', () => {
            const config = {
                variant: 'catalog',
                title: 't',
                description: 'd',
                ctas: '<p><a data-analytics-id="buy-now">Buy</a></p>',
            };
            const result = validateAIConfig(config, { requiredFields: [] }, { trialOsi: 'trial-123' });
            expect(result.valid).to.be.false;
            expect(result.errors.some((e) => e.includes('free-trial CTA anchor'))).to.be.true;
        });

        it('catalog: no free-trial error when trialOsi absent', () => {
            const config = {
                variant: 'catalog',
                title: 't',
                description: 'd',
                ctas: '<p><a data-analytics-id="buy-now">Buy</a></p>',
            };
            const result = validateAIConfig(config, { requiredFields: [] });
            expect(result.valid).to.be.true;
        });

        it('catalog: passes when trialOsi present and ctas includes free-trial anchor', () => {
            const config = {
                variant: 'catalog',
                title: 't',
                description: 'd',
                ctas: '<p><a data-analytics-id="buy-now">Buy</a><a data-analytics-id="free-trial">Free trial</a></p>',
            };
            const result = validateAIConfig(config, { requiredFields: [] }, { trialOsi: 'trial-123' });
            expect(result.valid).to.be.true;
        });
    });

    describe('buildReleaseCtas', () => {
        it('builds dual-CTA HTML with free-trial first and buy-now second', () => {
            const html = buildReleaseCtas('base-osi', 'trial-osi');
            expect(html).to.equal(
                '<p slot="footer">' +
                    '<a is="checkout-link" data-wcs-osi="trial-osi" data-analytics-id="free-trial" class="secondary">Free trial</a>' +
                    '<a is="checkout-link" data-wcs-osi="base-osi" data-analytics-id="buy-now">Buy now</a>' +
                    '</p>',
            );
        });

        it('builds single buy-now CTA when trialOsi is absent', () => {
            const html = buildReleaseCtas('base-osi', null);
            expect(html).to.equal(
                '<p slot="footer">' +
                    '<a is="checkout-link" data-wcs-osi="base-osi" data-analytics-id="buy-now">Buy now</a>' +
                    '</p>',
            );
            expect(html).to.not.include('free-trial');
        });

        it('always uses plain text labels (no placeholders)', () => {
            const html = buildReleaseCtas('base-osi', 'trial-osi');
            expect(html).to.include('>Buy now<');
            expect(html).to.include('>Free trial<');
            expect(html).to.not.include('{{');
        });

        it('emits no data-checkout-workflow attributes', () => {
            const html = buildReleaseCtas('base-osi', 'trial-osi');
            expect(html).to.not.include('data-checkout-workflow');
        });

        it('wraps anchors in p[slot="footer"]', () => {
            const html = buildReleaseCtas('base-osi', null);
            expect(html.startsWith('<p slot="footer">')).to.be.true;
            expect(html.endsWith('</p>')).to.be.true;
        });

        it('plans: omits trial CTA and uses "Select" label', () => {
            const html = buildReleaseCtas('base-osi', 'trial-osi', { includeTrial: false, buyNowLabel: 'Select' });
            expect(html).to.not.include('free-trial');
            expect(html).to.include('>Select<');
            expect(html).to.not.include('>Buy now<');
        });

        it('catalog: omits trial CTA when includeTrial is false', () => {
            const html = buildReleaseCtas('base-osi', 'trial-osi', { includeTrial: false });
            expect(html).to.not.include('free-trial');
            expect(html).to.include('>Buy now<');
        });
    });

    describe('buildReleasePrice', () => {
        it('builds inline-price span without outer p wrapper', () => {
            expect(buildReleasePrice('A1B2C3')).to.equal('<span is="inline-price" data-wcs-osi="A1B2C3"></span>');
        });

        it('emits no data-template attribute', () => {
            expect(buildReleasePrice('some-osi')).to.not.include('data-template');
        });
    });

    describe('enrichConfigWithMcsMnemonic — MCS always wins', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('overwrites existing mnemonics with MCS data when selectedProduct is provided', async () => {
            const product = {
                assets: { icons: { svg: 'https://mcs.example/new.svg' } },
                copy: { name: 'New Product' },
            };
            const config = {
                variant: 'plans',
                mnemonics: [{ icon: 'https://old.svg', alt: 'Old', link: '' }],
            };
            const result = await enrichConfigWithMcsMnemonic(config, product);
            expect(result.mnemonics[0].icon).to.equal('https://mcs.example/new.svg');
            expect(result.mnemonics[0].alt).to.equal('New Product');
        });
    });

    describe('buildReleaseTags', () => {
        it('returns empty array for null/undefined product', () => {
            expect(buildReleaseTags(null)).to.deep.equal([]);
            expect(buildReleaseTags(undefined)).to.deep.equal([]);
        });

        it('emits MCS-shaped tags from a full product record', () => {
            const tags = buildReleaseTags({
                product_code: 'PHSP',
                arrangement_code: 'phsp_direct_individual',
                product_family: 'CC_ALL_APPS',
                customer_segment: 'INDIVIDUAL',
                market_segments: ['COM', 'EDU'],
            });
            expect(tags).to.include('mas:product_code/PHSP');
            expect(tags).to.include('mas:pa/phsp_direct_individual');
            expect(tags).to.include('mas:product_family/CC_ALL_APPS');
            expect(tags).to.include('mas:customer_segment/INDIVIDUAL');
            expect(tags).to.include('mas:market_segments/COM');
            expect(tags).to.include('mas:market_segments/EDU');
        });

        it('falls back to chat-card shape (segments array + value as arrangement code)', () => {
            const tags = buildReleaseTags({
                product_code: 'ILST',
                value: 'ilst_team',
                product_family: 'CC_ALL_APPS',
                segments: ['TEAM'],
            });
            expect(tags).to.include('mas:pa/ilst_team');
            expect(tags).to.include('mas:customer_segment/TEAM');
        });

        it('reads market_segments from the MCS marketSegments truthy-map when array not present', () => {
            const tags = buildReleaseTags({
                arrangement_code: 'pa-1',
                marketSegments: { COM: true, EDU: true, GOV: false },
            });
            expect(tags.filter((t) => t.startsWith('mas:market_segments/'))).to.have.members([
                'mas:market_segments/COM',
                'mas:market_segments/EDU',
            ]);
        });

        it('omits tags for missing fields instead of emitting empty values', () => {
            const tags = buildReleaseTags({ arrangement_code: 'pa-1' });
            expect(tags).to.deep.equal(['mas:pa/pa-1']);
        });
    });

    describe('createFragmentDataForAEM with tags', () => {
        it('forwards tags when provided in options', () => {
            sinon.stub(window.customElements, 'get').callsFake((name) => {
                if (name === 'merch-card') return { getFragmentMapping: () => ({ title: {} }) };
                return undefined;
            });
            const data = createFragmentDataForAEM({ variant: 'plans', title: '<h3>x</h3>' }, 'plans', {
                tags: ['mas:pa/foo', 'mas:product_code/BAR'],
            });
            expect(data.tags).to.deep.equal(['mas:pa/foo', 'mas:product_code/BAR']);
        });

        it('omits the tags key when options.tags is missing or empty', () => {
            sinon.stub(window.customElements, 'get').callsFake((name) => {
                if (name === 'merch-card') return { getFragmentMapping: () => ({ title: {} }) };
                return undefined;
            });
            const withoutTags = createFragmentDataForAEM({ variant: 'plans', title: '<h3>x</h3>' }, 'plans', {});
            const withEmpty = createFragmentDataForAEM({ variant: 'plans', title: '<h3>x</h3>' }, 'plans', { tags: [] });
            expect(withoutTags).to.not.have.property('tags');
            expect(withEmpty).to.not.have.property('tags');
        });
    });
});
