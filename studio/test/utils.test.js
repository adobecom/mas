import { expect } from '@open-wc/testing';
import {
    buildCardsDeepLink,
    generateCodeToUse,
    generateFieldLink,
    camelToTitle,
    stripHtml,
    previewValue,
    parseStudioDeepLinksFromText,
} from '../src/utils.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../src/constants.js';

function mockFragmentForCode(modelPath, id = 'frag-123', title = 'CC Plans Merch Card: CC Pro: Business') {
    return {
        id,
        model: { path: modelPath },
        title,
        getField: (name) => {
            const fields = {
                name: { values: ['card-name'] },
                cardTitle: { values: ['Creative Cloud'] },
                variant: { values: ['plans'] },
            };
            return fields[name] || null;
        },
        getTagTitle: () => null,
    };
}

describe('generateCodeToUse', () => {
    it('appends fragment title to richText link text for cards', () => {
        const fragment = mockFragmentForCode(CARD_MODEL_PATH);
        const { authorPath, richText, href } = generateCodeToUse(fragment, 'acom', 'content');
        expect(authorPath).to.not.include('CC Plans Merch Card');
        expect(richText).to.include(`${authorPath} : ${fragment.title}`);
        expect(richText).to.include(href);
    });

    it('appends fragment title to richText link text for collections', () => {
        const fragment = mockFragmentForCode(COLLECTION_MODEL_PATH, 'frag-456', 'My Collection Title');
        const { authorPath, richText } = generateCodeToUse(fragment, 'acom', 'content');
        expect(authorPath).to.include('My Collection Title');
        expect(richText).to.include(`${authorPath} : ${fragment.title}`);
    });

    it('leaves richText unchanged when fragment has no title', () => {
        const fragment = mockFragmentForCode(CARD_MODEL_PATH, 'frag-123', '');
        const { authorPath, richText, href } = generateCodeToUse(fragment, 'acom', 'content');
        expect(richText).to.equal(`<a href="${href}" target="_blank">${authorPath}</a>`);
    });
});

describe('generateFieldLink', () => {
    function mockFragment(modelPath, id = 'frag-123') {
        return mockFragmentForCode(modelPath, id, 'Test Collection');
    }

    it('returns null for unknown model path', () => {
        const fragment = mockFragment('/unknown/model');
        expect(generateFieldLink(fragment, '/acom', 'prices')).to.be.null;
    });

    it('generates correct link for a card fragment', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'prices');
        expect(result).to.not.be.null;
        expect(result.displayText).to.include('prices');
        expect(result.displayText).to.include('→');
        expect(result.href).to.include('content-type=merch-card');
        expect(result.href).to.include('page=content');
        expect(result.href).to.include('path=%2Facom');
        expect(result.href).to.include('query=frag-123');
        expect(result.href).to.include('field=prices');
        expect(result.richText).to.include('<a href=');
        expect(result.richText).to.include(result.displayText);
    });

    it('generates correct link for a collection fragment', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'description');
        expect(result).to.not.be.null;
        expect(result.href).to.include('content-type=merch-card-collection');
        expect(result.href).to.include('query=frag-123');
        expect(result.href).to.include('field=description');
    });

    it('uses mas-field display text and includes field name', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'cardTitle');
        expect(result.displayText).to.include('mas-field:');
        expect(result.displayText).to.include('cardTitle');
    });

    it('defaults page to content for backward-compatible call signature', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'prices');
        expect(result).to.not.be.null;
        expect(result.href).to.include('page=content');
        expect(result.href).to.include('field=prices');
    });

    it('returns null when fragment is null', () => {
        expect(generateFieldLink(null, '/acom', 'prices')).to.be.null;
    });
});

describe('camelToTitle', () => {
    it('converts camelCase to title case', () => {
        expect(camelToTitle('cardTitle')).to.equal('Card Title');
    });

    it('handles multiple camelCase boundaries', () => {
        expect(camelToTitle('borderColor')).to.equal('Border Color');
    });

    it('capitalizes a single word', () => {
        expect(camelToTitle('badge')).to.equal('Badge');
    });

    it('handles consecutive transitions', () => {
        expect(camelToTitle('mnemonicIcon')).to.equal('Mnemonic Icon');
    });
});

describe('stripHtml', () => {
    it('strips HTML tags and returns text content', () => {
        expect(stripHtml('<p>Hello <strong>world</strong></p>')).to.equal('Hello world');
    });

    it('returns empty string for empty input', () => {
        expect(stripHtml('')).to.equal('');
    });

    it('returns plain text unchanged', () => {
        expect(stripHtml('no tags here')).to.equal('no tags here');
    });
});

describe('previewValue', () => {
    it('returns empty string for null/undefined values', () => {
        expect(previewValue(null)).to.equal('');
        expect(previewValue(undefined)).to.equal('');
        expect(previewValue([])).to.equal('');
    });

    it('returns empty string when first value is empty', () => {
        expect(previewValue([''])).to.equal('');
    });

    it('returns plain text as-is for short values', () => {
        expect(previewValue(['Creative Cloud Pro'])).to.equal('Creative Cloud Pro');
    });

    it('preserves full text without truncation', () => {
        const longText = 'A'.repeat(80);
        const result = previewValue([longText]);
        expect(result).to.equal(longText);
    });

    it('strips HTML from values containing angle brackets', () => {
        const htmlValue = '<p>Save 50% on <strong>all apps</strong></p>';
        const result = previewValue([htmlValue]);
        expect(result).to.equal('Save 50% on all apps');
        expect(result).to.not.include('<');
    });

    it('converts non-string values to string', () => {
        expect(previewValue([42])).to.equal('42');
        expect(previewValue([true])).to.equal('true');
    });
});

describe('buildCardsDeepLink', () => {
    const uuid = '00000000-0000-4000-8000-000000000001';

    it('builds merch-card URL', () => {
        const href = buildCardsDeepLink({ id: uuid, model: { path: CARD_MODEL_PATH } }, 'sandbox', 'content');
        expect(href).to.include('content-type=merch-card');
        expect(href).to.include(`query=${uuid}`);
        expect(href).to.include('path=sandbox');
    });

    it('builds merch-card-collection URL', () => {
        const href = buildCardsDeepLink({ id: uuid, model: { path: COLLECTION_MODEL_PATH } }, 'sandbox', 'content');
        expect(href).to.include('content-type=merch-card-collection');
        expect(href).to.include(`query=${uuid}`);
    });

    it('returns null when fragment id is missing', () => {
        expect(buildCardsDeepLink({ model: { path: CARD_MODEL_PATH } }, 'sandbox', 'content')).to.be.null;
    });

    it('returns null when model path is not mapped', () => {
        expect(
            buildCardsDeepLink(
                { id: uuid, model: { path: '/conf/mas/settings/dam/cfm/models/unknown' } },
                'sandbox',
                'content',
            ),
        ).to.be.null;
    });

    it('yields no copy lines when linkable-shaped fragments lack id', () => {
        const linkable = [{ model: { path: CARD_MODEL_PATH } }, { model: { path: COLLECTION_MODEL_PATH } }];
        const lines = linkable.map((f) => buildCardsDeepLink(f, 'sandbox', 'content')).filter(Boolean);
        expect(lines).to.deep.equal([]);
    });
});

describe('parseStudioDeepLinksFromText', () => {
    /** Same shape as the hash segment after `#` in Studio; parser only reads from `#`. */
    function hashLine(contentType, fragmentUuid, extra = '&page=content&path=test') {
        return `#content-type=${contentType}${extra}&query=${fragmentUuid}`;
    }

    it('parses a merch-card and a merch-card-collection line', () => {
        const text = [
            hashLine('merch-card', '00000000-0000-4000-8000-000000000001'),
            hashLine('merch-card-collection', '11111111-1111-4111-9111-111111111111'),
        ].join('\n');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(2);
        expect(parsed[0]).to.deep.equal({
            contentType: 'merch-card',
            fragmentId: '00000000-0000-4000-8000-000000000001',
        });
        expect(parsed[1]).to.deep.equal({
            contentType: 'merch-card-collection',
            fragmentId: '11111111-1111-4111-9111-111111111111',
        });
    });

    it('returns empty array for empty, whitespace-only, or non-string input', () => {
        expect(parseStudioDeepLinksFromText('')).to.deep.equal([]);
        expect(parseStudioDeepLinksFromText('   \n  \t  ')).to.deep.equal([]);
        expect(parseStudioDeepLinksFromText(/** @type {any} */ (null))).to.deep.equal([]);
        expect(parseStudioDeepLinksFromText(/** @type {any} */ (undefined))).to.deep.equal([]);
        expect(parseStudioDeepLinksFromText(/** @type {any} */ (42))).to.deep.equal([]);
    });

    it('skips lines without hash fragment', () => {
        const text = ['noise-without-hash', hashLine('merch-card', '22222222-2222-4222-8222-222222222222')].join('\n');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(1);
        expect(parsed[0].fragmentId).to.equal('22222222-2222-4222-8222-222222222222');
    });

    it('skips unsupported content-type', () => {
        const text = [
            hashLine('merch-card', '33333333-3333-4333-8333-333333333333'),
            hashLine('translation-project', '44444444-4444-4444-8444-444444444444'),
        ].join('\n');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(1);
        expect(parsed[0].contentType).to.equal('merch-card');
    });

    it('skips query that is not a UUID', () => {
        const text = [
            hashLine('merch-card', 'not-a-uuid'),
            hashLine('merch-card', '55555555-5555-4555-8555-555555555555'),
        ].join('\n');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(1);
        expect(parsed[0].fragmentId).to.equal('55555555-5555-4555-8555-555555555555');
    });

    it('skips lines with missing query param', () => {
        const raw = hashLine('merch-card', '66666666-6666-4666-8666-666666666666');
        const parsed = parseStudioDeepLinksFromText(raw.replace('query=', 'other='));
        expect(parsed).to.deep.equal([]);
    });

    it('parses valid entries from mixed noise and blank lines', () => {
        const text = [
            'ignored-plain-text',
            '',
            hashLine('merch-card', '77777777-7777-4777-8777-777777777777'),
            '\r',
            '#content-type=merch-card&query=88888888-8888-4888-8888-888888888888',
        ].join('\n');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(2);
        expect(parsed.map((e) => e.fragmentId)).to.deep.equal([
            '77777777-7777-4777-8777-777777777777',
            '88888888-8888-4888-8888-888888888888',
        ]);
    });
});
