import { expect } from '@open-wc/testing';
import {
    buildCardsDeepLink,
    generateCodeToUse,
    generateFieldLink,
    getFragmentPartsToUse,
    camelToTitle,
    stripHtml,
    previewValue,
    parseStudioDeepLinksFromText,
    hasNonEmptyCompareChart,
    matchesContentTypeFilter,
    resolveContentTypeFilters,
    createKeyedAsyncLoader,
    getCreateProjectErrorMessage,
} from '../src/utils.js';
import {
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    COMPARE_CHART_FIELD,
    TAG_MERCH_CARD,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from '../src/constants.js';

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

describe('generateCodeToUse', () => {
    function mockFragment(modelPath, id = 'frag-123', fields = {}) {
        return {
            id,
            model: { path: modelPath },
            title: 'Test Collection',
            getField: (name) => {
                const valuesByField = {
                    name: { values: ['card-name'] },
                    cardTitle: { values: ['Creative Cloud'] },
                    variant: { values: ['plans'] },
                    ...fields,
                };
                return valuesByField[name] || null;
            },
            getTagTitle: () => null,
        };
    }

    it('uses mas-compare-chart as content type for compare chart fragments', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH, 'chart-123', {
            [COMPARE_CHART_FIELD]: { values: ['<mas-compare-chart></mas-compare-chart>'] },
        });
        const result = generateCodeToUse(fragment, '/acom', 'content');
        expect(result.href).to.include('content-type=mas-compare-chart');
        expect(result.href).to.include('query=chart-123');
    });

    it('keeps merch-card-collection as content type for regular collection fragments', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH);
        const result = generateCodeToUse(fragment, '/acom', 'content');
        expect(result.href).to.include('content-type=merch-card-collection');
    });

    it('keeps merch-card-collection when the compareChart field exists but is empty', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH, 'frag-789', {
            [COMPARE_CHART_FIELD]: { values: [''] },
        });
        const result = generateCodeToUse(fragment, '/acom', 'content');
        expect(result.href).to.include('content-type=merch-card-collection');
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

    it('parses a mas-compare-chart entry', () => {
        const text = hashLine('mas-compare-chart', '99999999-9999-4999-8999-999999999999');
        const parsed = parseStudioDeepLinksFromText(text);
        expect(parsed).to.have.length(1);
        expect(parsed[0]).to.deep.equal({
            contentType: 'mas-compare-chart',
            fragmentId: '99999999-9999-4999-8999-999999999999',
        });
    });

    it('parses space-separated URLs (single-line input paste)', () => {
        const url1 = `https://mas.adobe.com/studio.html#content-type=merch-card&query=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
        const url2 = `https://mas.adobe.com/studio.html#content-type=merch-card-collection&query=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`;
        const parsed = parseStudioDeepLinksFromText(`${url1} ${url2}`);
        expect(parsed).to.have.length(2);
        expect(parsed[0]).to.deep.equal({ contentType: 'merch-card', fragmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
        expect(parsed[1]).to.deep.equal({
            contentType: 'merch-card-collection',
            fragmentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        });
    });
});

describe('content-type-utils', () => {
    describe('hasNonEmptyCompareChart', () => {
        it('reads via getFieldValues, getField().values, and fields[]', () => {
            expect(hasNonEmptyCompareChart({ getFieldValues: (n) => (n === COMPARE_CHART_FIELD ? ['<table>'] : []) })).to.be
                .true;
            expect(hasNonEmptyCompareChart({ getField: (n) => (n === COMPARE_CHART_FIELD ? { values: ['<table>'] } : null) }))
                .to.be.true;
            expect(hasNonEmptyCompareChart({ fields: [{ name: COMPARE_CHART_FIELD, values: ['<table>'] }] })).to.be.true;
        });

        it('is false for empty, missing, or whitespace-only values', () => {
            expect(hasNonEmptyCompareChart(undefined)).to.be.false;
            expect(hasNonEmptyCompareChart({ fields: [] })).to.be.false;
            expect(hasNonEmptyCompareChart({ fields: [{ name: COMPARE_CHART_FIELD, values: ['   '] }] })).to.be.false;
        });
    });

    describe('matchesContentTypeFilter', () => {
        it('passes everything when no content-type filter is set', () => {
            expect(matchesContentTypeFilter([], { model: { path: '/whatever' } })).to.be.true;
        });

        it('classifies a card by model path', () => {
            const card = { model: { path: CARD_MODEL_PATH } };
            expect(matchesContentTypeFilter([TAG_MERCH_CARD], card)).to.be.true;
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], card)).to.be.false;
        });

        it('distinguishes compare-chart collections from plain collections', () => {
            const compareChart = {
                model: { path: COLLECTION_MODEL_PATH },
                fields: [{ name: COMPARE_CHART_FIELD, values: ['<table>'] }],
            };
            const collection = { model: { path: COLLECTION_MODEL_PATH }, fields: [] };
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], compareChart)).to.be.true;
            expect(matchesContentTypeFilter([TAG_MERCH_CARD_COLLECTION], compareChart)).to.be.false;
            expect(matchesContentTypeFilter([TAG_MERCH_CARD_COLLECTION], collection)).to.be.true;
            expect(matchesContentTypeFilter([TAG_COMPARE_CHART], collection)).to.be.false;
        });

        it('rejects unknown model paths', () => {
            expect(matchesContentTypeFilter([TAG_MERCH_CARD], { model: { path: '/unknown' } })).to.be.false;
        });
    });

    describe('resolveContentTypeFilters', () => {
        it('keeps only content-type tags', () => {
            const { contentTypes } = resolveContentTypeFilters([TAG_MERCH_CARD, 'mas:variant/catalog', 'mas:custom/x']);
            expect(contentTypes).to.deep.equal([TAG_MERCH_CARD]);
        });

        it('maps compare-chart to the collection model id and de-dupes', () => {
            const { modelIds } = resolveContentTypeFilters([TAG_COMPARE_CHART, TAG_MERCH_CARD_COLLECTION]);
            expect(modelIds).to.deep.equal([TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION]]);
        });

        it('maps merch-card to its own model id', () => {
            const { modelIds } = resolveContentTypeFilters([TAG_MERCH_CARD]);
            expect(modelIds).to.deep.equal([TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD]]);
        });

        it('returns empty for no content-type tags', () => {
            expect(resolveContentTypeFilters(['mas:variant/x', 'mas:custom/y'])).to.deep.equal({
                contentTypes: [],
                modelIds: [],
            });
        });
    });
});

describe('createKeyedAsyncLoader', () => {
    it('loads and applies the result on first call', async () => {
        const runIfNeeded = createKeyedAsyncLoader();
        let applied = null;

        await runIfNeeded({
            guard: () => true,
            computeKey: () => 'a',
            load: async () => 'loaded-value',
            apply: (value) => {
                applied = value;
            },
        });

        expect(applied).to.equal('loaded-value');
    });

    it('does not reload when the key is unchanged', async () => {
        const runIfNeeded = createKeyedAsyncLoader();
        let loadCount = 0;

        const run = () =>
            runIfNeeded({
                guard: () => true,
                computeKey: () => 'same-key',
                load: async () => {
                    loadCount += 1;
                    return loadCount;
                },
                apply: () => {},
            });

        await run();
        await run();

        expect(loadCount).to.equal(1);
    });

    it('reloads when the key changes', async () => {
        const runIfNeeded = createKeyedAsyncLoader();
        let loadCount = 0;
        let key = 'first';

        const run = () =>
            runIfNeeded({
                guard: () => true,
                computeKey: () => key,
                load: async () => {
                    loadCount += 1;
                    return loadCount;
                },
                apply: () => {},
            });

        await run();
        key = 'second';
        await run();

        expect(loadCount).to.equal(2);
    });

    it('calls reset and does not call load when guard is false', async () => {
        const runIfNeeded = createKeyedAsyncLoader();
        let loadCalled = false;
        let resetCalled = false;

        await runIfNeeded({
            guard: () => false,
            computeKey: () => 'a',
            load: async () => {
                loadCalled = true;
                return 'x';
            },
            apply: () => {},
            reset: () => {
                resetCalled = true;
            },
        });

        expect(loadCalled).to.be.false;
        expect(resetCalled).to.be.true;
    });

    it('reloads for the same key after a guard-false call reset the tracked key', async () => {
        const runIfNeeded = createKeyedAsyncLoader();
        let loadCount = 0;
        let guardValue = true;

        const run = () =>
            runIfNeeded({
                guard: () => guardValue,
                computeKey: () => 'same-key',
                load: async () => {
                    loadCount += 1;
                    return loadCount;
                },
                apply: () => {},
            });

        await run();
        guardValue = false;
        await run();
        guardValue = true;
        await run();

        expect(loadCount).to.equal(2);
    });
});

describe('getFragmentPartsToUse', () => {
    function makeCard({ variantCode = 'catalog', cardTitle = 'My Card', getTagTitle = () => null, getCurrentTagTitle } = {}) {
        return {
            model: { path: CARD_MODEL_PATH },
            title: cardTitle,
            getField: (name) => {
                const fields = {
                    name: { values: ['card-slug'] },
                    cardTitle: { values: [cardTitle] },
                    variant: { values: [variantCode] },
                };
                return fields[name] || null;
            },
            getTagTitle,
            getCurrentTagTitle: getCurrentTagTitle || (() => null),
        };
    }

    it('returns surface + variant label for a catalog card', () => {
        const fragment = makeCard({ variantCode: 'catalog' });
        const { fragmentParts, title } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.equal('ACOM / Catalog');
        expect(title).to.equal('My Card');
    });

    it('returns surface + variant label for a plans card', () => {
        const fragment = makeCard({ variantCode: 'plans' });
        const { fragmentParts } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.include('ACOM');
        expect(fragmentParts).to.include('Plans');
    });

    it('appends customerSegment and marketSegment when present', () => {
        const fragment = makeCard({
            getTagTitle: (prefix) => {
                if (prefix === 'customer_segment') return 'Teams';
                if (prefix === 'market_segment') return 'SMB';
                return null;
            },
        });
        const { fragmentParts } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.include('Teams');
        expect(fragmentParts).to.include('SMB');
    });

    it('appends promotion label when getCurrentTagTitle returns one', () => {
        const fragment = makeCard({
            getCurrentTagTitle: () => 'Summer Sale',
        });
        const { fragmentParts } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.include('Summer Sale');
    });

    it('falls back to getTagTitle for product_code when getCurrentTagTitle returns null', () => {
        const fragment = makeCard({
            getCurrentTagTitle: (prefix) => (prefix === 'mas:product_code/' ? null : null),
            getTagTitle: (prefix) => (prefix === 'mas:product/' ? 'acrobat' : null),
        });
        const { fragmentParts } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.include('acrobat');
    });

    it('returns surface / title for a collection fragment', () => {
        const fragment = {
            model: { path: COLLECTION_MODEL_PATH },
            title: 'Creative Suite',
            getField: () => null,
            getTagTitle: () => null,
        };
        const { fragmentParts, title } = getFragmentPartsToUse(fragment, 'ccd');
        expect(fragmentParts).to.equal('CCD / Creative Suite');
        expect(title).to.equal('Creative Suite');
    });

    it('returns empty strings for an unknown model path', () => {
        const fragment = { model: { path: '/unknown/path' }, title: 'Irrelevant' };
        const { fragmentParts, title } = getFragmentPartsToUse(fragment, 'acom');
        expect(fragmentParts).to.equal('');
        expect(title).to.equal('');
    });

    it('handles null fragment gracefully', () => {
        const { fragmentParts, title } = getFragmentPartsToUse(null, 'acom');
        expect(fragmentParts).to.equal('');
        expect(title).to.equal('');
    });

    it('uppercases the path for the surface label', () => {
        const fragment = makeCard();
        const { fragmentParts } = getFragmentPartsToUse(fragment, 'accom');
        expect(fragmentParts.startsWith('ACCOM')).to.be.true;
    });
});

describe('getCreateProjectErrorMessage', () => {
    it('returns the duplicate-name message for a 409 conflict', () => {
        const error = new Error('Failed to create fragment: 409 Conflict');
        expect(getCreateProjectErrorMessage(error)).to.equal('Project with this name already exists.');
    });

    it('matches a 409 conflict regardless of the HTTP reason phrase', () => {
        const error = new Error('Failed to create fragment: 409 ');
        expect(getCreateProjectErrorMessage(error)).to.equal('Project with this name already exists.');
    });

    it('returns the generic message for a non-409 error', () => {
        const error = new Error('Failed to create fragment: 500 Internal Server Error');
        expect(getCreateProjectErrorMessage(error)).to.equal('Failed to create project.');
    });

    it('returns the generic message when error has no message', () => {
        expect(getCreateProjectErrorMessage(new Error())).to.equal('Failed to create project.');
    });

    it('returns the generic message when error is undefined', () => {
        expect(getCreateProjectErrorMessage(undefined)).to.equal('Failed to create project.');
    });
});
