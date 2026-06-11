import { expect } from '@esm-bundle/chai';
import Store from '../../src/store.js';
import {
    classifyPromotionPathsForSelection,
    countDistinctPromoCodesForOffer,
    addPromotionOfferFromOst,
    buildPromotionOfferCacheEntry,
    buildPromotionOfferTags,
    applyPromotionItemSelectionToFragment,
    buildPromotionOfferCacheEntryFromSnapshot,
    buildPromotionOffersFieldValues,
    hydratePromotionOfferCacheFromSelectorIds,
    resolvePromotionOfferCacheEntry,
    parsePromotionOfferCacheLines,
    upsertPromotionFragmentsField,
    upsertPromotionOffersField,
    serializePromotionOfferCacheLine,
    applyPromotionOfferProductTagsToSearch,
    collectPromotionOfferProductTags,
    pruneOrphanedPromotionSelectionAfterOfferRemoval,
    getPromotionItemsRemovedByOfferRemoval,
    buildRemoveOfferConfirmationMessage,
    groupCountriesByPromoCode,
    groupCountriesByPromoCodeForOffer,
    promotionOfferCacheEntryHasDisplayName,
    normalizePromotionOfferData,
    resolvePromotionOfferMnemonicIconUrl,
    getEffectivePromoCode,
    isPromotionItemSelectionDirty,
    isPromotionOffersSelectionDirty,
    getPromotionRequiredFieldsValidation,
    normalizePromotionSearchInput,
    parseCountriesFromGeos,
    parsePromoCodeExceptions,
    parseOfferSubstitutions,
    parsePromotionOffersField,
    parseSelectedOfferIdsFromOffersField,
    parsePromotionSurfacesFieldValues,
    getEffectiveSubstituteOffer,
    groupOfferSubstitutionsForOffer,
    serializePromotionSurfacesForAem,
    serializePromoCodeExceptions,
    serializePromotionOffersField,
    splitPromotionTagsFieldValues,
} from '../../src/promotions/promotion-editor-utils.js';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';

const resolved = '/content/dam/mas/promotions/test-items/resolved-card-fragment';
const fetchFailed = '/content/dam/mas/promotions/test-items/fetch-failed-card-fragment';

function makePromotionLike({ fragments = [], collections, offers } = {}) {
    return {
        getField: (name) => {
            if (name === 'collections') return collections !== undefined;
            if (name === 'offers') return offers !== undefined;
            return null;
        },
        getFieldValues: (name) => {
            if (name === 'fragments') return fragments;
            if (name === 'collections') return collections ?? [];
            if (name === 'offers') return offers ?? [];
            return [];
        },
    };
}

describe('promotion-editor-utils', () => {
    describe('isPromotionItemSelectionDirty', () => {
        it('returns false when promotion is missing', () => {
            expect(isPromotionItemSelectionDirty(null, ['/a'], [])).to.be.false;
        });

        it('returns false when merged paths match selection', () => {
            const p = makePromotionLike({ fragments: ['/b', '/a'], collections: [] });
            expect(isPromotionItemSelectionDirty(p, ['/a'], ['/b'])).to.be.false;
        });

        it('returns true when selection adds a path', () => {
            const p = makePromotionLike({ fragments: ['/a'] });
            expect(isPromotionItemSelectionDirty(p, ['/a', '/x'], [])).to.be.true;
        });

        it('uses empty collections when getField returns falsy', () => {
            const p = {
                getField: () => null,
                getFieldValues: (name) => (name === 'fragments' ? ['/a'] : []),
            };
            expect(isPromotionItemSelectionDirty(p, ['/a'], ['/b'])).to.be.true;
        });

        it('returns false when store includes all saved paths after failed-fetch fallback', () => {
            const p = makePromotionLike({ fragments: [resolved, fetchFailed] });
            expect(isPromotionItemSelectionDirty(p, [resolved, fetchFailed], [])).to.be.false;
        });

        it('returns true when a saved path is missing from store selection', () => {
            const p = makePromotionLike({ fragments: [resolved, fetchFailed] });
            expect(isPromotionItemSelectionDirty(p, [resolved], [])).to.be.true;
        });
    });

    describe('isPromotionOffersSelectionDirty', () => {
        it('returns false when saved offer ids match selection', () => {
            const p = makePromotionLike({ offers: ['osi-1', 'osi-2'] });
            expect(isPromotionOffersSelectionDirty(p, ['osi-1', 'osi-2'])).to.be.false;
        });

        it('returns true when selection adds an offer id', () => {
            const p = makePromotionLike({ offers: ['osi-1'] });
            expect(isPromotionOffersSelectionDirty(p, ['osi-1', 'osi-2'])).to.be.true;
        });

        it('ignores promo exception and substitution lines when comparing saved offers', () => {
            const p = makePromotionLike({ offers: ['osi-1', 'osi-1:CODE:US', 'substitute:osi-1:osi-2:CA_en'] });
            expect(isPromotionOffersSelectionDirty(p, ['osi-1'])).to.be.false;
            expect(isPromotionOffersSelectionDirty(p, ['osi-1', 'osi-2'])).to.be.true;
        });
    });

    describe('buildPromotionOffersFieldValues', () => {
        it('preserves promo exceptions and substitutions while updating selected offer ids', () => {
            const p = makePromotionLike({
                offers: ['osi-1', 'osi-1:CODE:US', 'substitute:osi-1:osi-2:CA_en'],
            });
            const values = buildPromotionOffersFieldValues(p, ['osi-1', 'osi-3']);
            expect(values).to.include('osi-1');
            expect(values).to.include('osi-3');
            expect(values).to.include('osi-1:CODE:US');
            expect(values).to.include('substitute:osi-1:osi-2:CA_en');
        });

        it('persists offer display metadata as offer-cache lines', () => {
            const p = makePromotionLike({ offers: [] });
            const cache = new Map([
                [
                    'osi-abc',
                    buildPromotionOfferCacheEntry(
                        'osi-abc',
                        { product_code: 'Acrobat Pro Subs CC', offer_type: 'BASE', plan_type: 'PUF' },
                        'PA-1386',
                    ),
                ],
            ]);
            const values = buildPromotionOffersFieldValues(p, ['osi-abc'], cache);
            expect(values).to.include('osi-abc');
            expect(values.some((line) => line.startsWith('offer-cache::'))).to.be.true;
            const restored = parsePromotionOfferCacheLines(values).get('osi-abc');
            expect(restored?.product_code).to.equal('Acrobat Pro Subs CC');
            expect(restored?.product_arrangement_code).to.equal('PA-1386');
            const entry = buildPromotionOfferCacheEntryFromSnapshot('osi-abc', restored);
            expect(entry.tags.find(({ id }) => id.startsWith('mas:product_code/'))?.title).to.equal('Acrobat Pro Subs CC');
            const { promoExceptions, offerSubstitutions } = parsePromotionOffersField(values);
            expect(promoExceptions.size).to.equal(0);
            expect(offerSubstitutions.size).to.equal(0);
            expect(parseSelectedOfferIdsFromOffersField(values)).to.deep.equal(['osi-abc']);
        });
    });

    describe('applyPromotionItemSelectionToFragment', () => {
        it('upserts fragments with content-fragment metadata and selected offer ids', () => {
            const fragment = {
                hasChanges: false,
                fields: [{ name: 'offers', type: 'text', multiple: true, values: ['osi-1:CODE:US'] }],
                getField(name) {
                    return this.fields.find((field) => field.name === name);
                },
                getFieldValues(name) {
                    return this.getField(name)?.values ?? [];
                },
            };
            const changed = applyPromotionItemSelectionToFragment(fragment, {
                selectedCards: ['/content/dam/card-a'],
                selectedCollections: [],
                selectedOfferIds: ['osi-1'],
            });
            expect(changed).to.be.true;
            expect(fragment.hasChanges).to.be.true;
            expect(fragment.getField('fragments')).to.deep.include({
                name: 'fragments',
                type: 'content-fragment',
                multiple: true,
            });
            expect(fragment.getFieldValues('fragments')).to.deep.equal(['/content/dam/card-a']);
            expect(fragment.getFieldValues('offers')).to.include('osi-1');
            expect(fragment.getFieldValues('offers')).to.include('osi-1:CODE:US');
        });
    });

    describe('upsertPromotionFragmentsField', () => {
        it('creates fragments field when missing', () => {
            const fragment = {
                fields: [],
                getField(name) {
                    return this.fields.find((field) => field.name === name);
                },
            };
            expect(upsertPromotionFragmentsField(fragment, ['/path/a'])).to.be.true;
            expect(fragment.fields[0]).to.deep.equal({
                name: 'fragments',
                type: 'content-fragment',
                multiple: true,
                values: ['/path/a'],
            });
        });
    });

    describe('upsertPromotionOffersField', () => {
        it('creates offers field with text multiple metadata', () => {
            const fragment = {
                fields: [],
                getField(name) {
                    return this.fields.find((field) => field.name === name);
                },
            };
            expect(upsertPromotionOffersField(fragment, ['osi-abc'])).to.be.true;
            expect(fragment.fields[0]).to.deep.equal({
                name: 'offers',
                type: 'text',
                multiple: true,
                values: ['osi-abc'],
            });
        });
    });

    describe('serializePromotionSurfacesForAem', () => {
        it('returns empty array for non-array or empty input', () => {
            expect(serializePromotionSurfacesForAem()).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem(null)).to.deep.equal([]);
            expect(serializePromotionSurfacesForAem([])).to.deep.equal([]);
        });

        it('normalizes comma and newline separated tokens into separate AEM values', () => {
            expect(serializePromotionSurfacesForAem([' a , b\n c , a '])).to.deep.equal(['a', 'b', 'c']);
        });
    });

    describe('parsePromotionSurfacesFieldValues', () => {
        it('returns empty array for non-array or empty input', () => {
            expect(parsePromotionSurfacesFieldValues()).to.deep.equal([]);
            expect(parsePromotionSurfacesFieldValues(null)).to.deep.equal([]);
            expect(parsePromotionSurfacesFieldValues([])).to.deep.equal([]);
        });

        it('returns unique lowercase surface keys', () => {
            expect(parsePromotionSurfacesFieldValues(['NALA, sandbox', 'nala'])).to.deep.equal(['nala', 'sandbox']);
        });
    });

    describe('classifyPromotionPathsForSelection', () => {
        it('returns empty buckets for empty paths', async () => {
            const out = await classifyPromotionPathsForSelection([], () => Promise.resolve({}));
            expect(out).to.deep.equal({ cards: [], cols: [] });
        });

        it('classifies collection model as collections and others as cards', async () => {
            const getFragmentByPath = (path) => {
                if (path === '/col') return Promise.resolve({ model: { path: COLLECTION_MODEL_PATH } });
                return Promise.resolve({ model: { path: '/other' } });
            };
            const out = await classifyPromotionPathsForSelection(['/card', '/col'], getFragmentByPath);
            expect(out.cards).to.deep.equal(['/card']);
            expect(out.cols).to.deep.equal(['/col']);
        });

        it('falls back to cards for rejected fetches', async () => {
            const out = await classifyPromotionPathsForSelection([fetchFailed], () => Promise.reject(new Error('x')));
            expect(out.cards).to.deep.equal([fetchFailed]);
            expect(out.cols).to.deep.equal([]);
        });

        it('falls back to cards for fulfilled fragments without model path', async () => {
            const out = await classifyPromotionPathsForSelection(['/no-model'], () => Promise.resolve(null));
            expect(out.cards).to.deep.equal(['/no-model']);
            expect(out.cols).to.deep.equal([]);
        });

        it('respects custom collection model path', async () => {
            const custom = '/custom/collection';
            const getFragmentByPath = () => Promise.resolve({ model: { path: custom } });
            const out = await classifyPromotionPathsForSelection(['/p'], getFragmentByPath, custom);
            expect(out.cols).to.deep.equal(['/p']);
            expect(out.cards).to.deep.equal([]);
        });
    });

    describe('normalizePromotionSearchInput', () => {
        it('returns empty for non-string or blank', () => {
            expect(normalizePromotionSearchInput()).to.equal('');
            expect(normalizePromotionSearchInput(null)).to.equal('');
            expect(normalizePromotionSearchInput('  \n')).to.equal('');
        });

        it('returns bare UUID unchanged', () => {
            const id = '00000000-1111-2222-3333-444444444444';
            expect(normalizePromotionSearchInput(`  ${id}  `)).to.equal(id);
        });

        it('extracts fragment id from a Studio merch-card deep link', () => {
            const id = '00000000-1111-2222-3333-444444444444';
            const line = `https://mas.adobe.com/studio.html#content-type=merch-card&query=${id}`;
            expect(normalizePromotionSearchInput(line)).to.equal(id);
        });

        it('strips query/hash from pasted full DAM path', () => {
            const path = '/content/dam/mas/surface/en_US/foo';
            expect(normalizePromotionSearchInput(`${path}?x=1`)).to.equal(path);
            expect(normalizePromotionSearchInput(`https://example.com${path}#edit`)).to.equal(path);
        });
    });

    describe('splitPromotionTagsFieldValues', () => {
        it('splits mas:promotion tags from other tag ids', () => {
            const out = splitPromotionTagsFieldValues([
                'mas:promotion/sale',
                'mas:status/published',
                '/content/cq:tags/mas/promotion/path-format',
            ]);
            expect(out.promotion).to.deep.equal(['mas:promotion/sale', '/content/cq:tags/mas/promotion/path-format']);
            expect(out.retained).to.deep.equal(['mas:status/published']);
        });

        it('promotion slice is the picker value set (non-promotion tags excluded)', () => {
            const { promotion } = splitPromotionTagsFieldValues(['mas:promotion/a', 'mas:status/draft', 'mas:promotion/b']);
            expect(promotion).to.deep.equal(['mas:promotion/a', 'mas:promotion/b']);
        });

        it('promotion slice is empty when no mas:promotion tag', () => {
            expect(splitPromotionTagsFieldValues(['mas:status/published']).promotion).to.deep.equal([]);
        });
    });

    describe('getPromotionRequiredFieldsValidation', () => {
        const baseFragment = () => ({
            getFieldValue: (name) => {
                const map = {
                    title: 'T',
                    promoCode: 'PROMO',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                };
                return map[name];
            },
            getFieldValues: (name) => {
                if (name === 'geos') return ['us'];
                if (name === 'tags') return ['mas:promotion/test'];
                if (name === 'surfaces') return ['sandbox'];
                return [];
            },
        });

        it('returns null when all required fields are present', () => {
            expect(getPromotionRequiredFieldsValidation(baseFragment(), 1)).to.be.null;
        });

        it('returns a message for the first missing field in form order', () => {
            const f = {
                ...baseFragment(),
                getFieldValues: (name) => {
                    if (name === 'tags') return ['mas:promotion/test'];
                    if (name === 'geos') return ['us'];
                    if (name === 'surfaces') return [];
                    return [];
                },
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please add at least one Surface.');
        });

        it('returns a fragments message when item count is zero', () => {
            expect(getPromotionRequiredFieldsValidation(baseFragment(), 0)).to.equal(
                'Please add at least one fragment or collection.',
            );
        });

        it('returns a message when promo code is missing', () => {
            const f = {
                ...baseFragment(),
                getFieldValue: (name) => (name === 'promoCode' ? '' : baseFragment().getFieldValue(name)),
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please enter a Promo Code.');
        });

        it('returns a message when start date is missing', () => {
            const f = {
                ...baseFragment(),
                getFieldValue: (name) => (name === 'startDate' ? '' : baseFragment().getFieldValue(name)),
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please set a Start Date.');
        });

        it('returns a message when end date is missing', () => {
            const f = {
                ...baseFragment(),
                getFieldValue: (name) => (name === 'endDate' ? '' : baseFragment().getFieldValue(name)),
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please set an End Date.');
        });

        it('returns a message when title is missing', () => {
            const f = {
                ...baseFragment(),
                getFieldValue: (name) => (name === 'title' ? '' : baseFragment().getFieldValue(name)),
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please enter a Title.');
        });

        it('returns a message when geos are missing', () => {
            const f = {
                ...baseFragment(),
                getFieldValues: (name) => {
                    if (name === 'tags') return ['mas:promotion/test'];
                    if (name === 'surfaces') return ['sandbox'];
                    return [];
                },
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please add at least one Geo.');
        });

        it('returns a message when no promotion classification tag', () => {
            const f = {
                ...baseFragment(),
                getFieldValues: (name) => {
                    if (name === 'geos') return ['us'];
                    if (name === 'surfaces') return ['sandbox'];
                    if (name === 'tags') return ['mas:status/published'];
                    return [];
                },
            };
            expect(getPromotionRequiredFieldsValidation(f, 1)).to.equal('Please add at least one Promotion tag.');
        });
    });

    describe('promo code exceptions', () => {
        it('parsePromoCodeExceptions builds offer+country keyed map', () => {
            const map = parsePromoCodeExceptions(['offer-1:OVERRIDE:CA_en', 'offer-2:ALT:US']);
            expect(map.get('offer-1|CA_en')).to.equal('OVERRIDE');
            expect(map.get('offer-2|US')).to.equal('ALT');
        });

        it('serializePromoCodeExceptions round-trips parsed values', () => {
            const map = parsePromoCodeExceptions(['offer-1:OVERRIDE:CA_en']);
            expect(serializePromoCodeExceptions(map)).to.deep.equal(['offer-1:OVERRIDE:CA_en']);
        });

        it('getEffectivePromoCode falls back to default when no exception', () => {
            const exceptions = parsePromoCodeExceptions(['offer-1:OVERRIDE:CA_en']);
            expect(getEffectivePromoCode(exceptions, 'offer-1', 'CA_en', 'DEFAULT')).to.equal('OVERRIDE');
            expect(getEffectivePromoCode(exceptions, 'offer-1', 'US', 'DEFAULT')).to.equal('DEFAULT');
        });

        it('countDistinctPromoCodesForOffer counts unique codes across geos', () => {
            const exceptions = parsePromoCodeExceptions(['offer-1:OVERRIDE:CA_en']);
            const count = countDistinctPromoCodesForOffer(exceptions, 'offer-1', ['CA_en', 'US'], 'DEFAULT');
            expect(count).to.equal(2);
        });

        it('parsePromotionOffersField splits promo and offer substitution lines', () => {
            const { promoExceptions, offerSubstitutions } = parsePromotionOffersField([
                'offer-1:OVERRIDE:CA_en',
                'substitute:offer-1:regional-osi:US',
            ]);
            expect(promoExceptions.get('offer-1|CA_en')).to.equal('OVERRIDE');
            expect(offerSubstitutions.get('offer-1|US')).to.equal('regional-osi');
        });

        it('parsePromoCodeExceptions ignores offer substitution lines', () => {
            const map = parsePromoCodeExceptions(['substitute:offer-1:regional-osi:US', 'offer-1:CODE:CA_en']);
            expect(map.size).to.equal(1);
            expect(map.get('offer-1|CA_en')).to.equal('CODE');
        });

        it('serializePromotionOffersField round-trips promo and substitution maps', () => {
            const promo = new Map([['offer-1|CA_en', 'OVERRIDE']]);
            const subs = new Map([['offer-1|US', 'regional-osi']]);
            const lines = serializePromotionOffersField(promo, subs);
            const parsed = parsePromotionOffersField(lines);
            expect(parsed.promoExceptions.get('offer-1|CA_en')).to.equal('OVERRIDE');
            expect(parsed.offerSubstitutions.get('offer-1|US')).to.equal('regional-osi');
        });

        it('serializePromotionOffersField includes selected offer ids as bare lines', () => {
            const promo = new Map([['osi-1|CA_en', 'OVERRIDE']]);
            const subs = new Map();
            const lines = serializePromotionOffersField(promo, subs, ['osi-1', 'osi-2']);
            expect(lines).to.include('osi-1');
            expect(lines).to.include('osi-2');
            expect(lines).to.include('osi-1:OVERRIDE:CA_en');
        });

        it('parseSelectedOfferIdsFromOffersField extracts bare selectorId lines', () => {
            const ids = parseSelectedOfferIdsFromOffersField(['osi-1', 'osi-2:OVERRIDE:CA_en', 'osi-3']);
            expect(ids).to.deep.equal(['osi-1', 'osi-3']);
        });

        it('parseSelectedOfferIdsFromOffersField ignores exception and substitution lines', () => {
            const ids = parseSelectedOfferIdsFromOffersField(['osi-1:CODE:CA_en', 'substitute:osi-1:osi-2:US']);
            expect(ids).to.deep.equal([]);
        });

        it('parseSelectedOfferIdsFromOffersField round-trips with serializePromotionOffersField', () => {
            const promo = new Map([['osi-1|CA_en', 'OVERRIDE']]);
            const selectedIds = ['osi-1', 'osi-2'];
            const lines = serializePromotionOffersField(promo, new Map(), selectedIds);
            const parsed = parseSelectedOfferIdsFromOffersField(lines);
            expect(parsed).to.deep.equal(['osi-1', 'osi-2']);
        });

        it('getEffectiveSubstituteOffer returns substitute selector id', () => {
            const subs = parseOfferSubstitutions(['substitute:offer-1:regional-osi:IN']);
            expect(getEffectiveSubstituteOffer(subs, 'offer-1', 'IN')).to.equal('regional-osi');
            expect(getEffectiveSubstituteOffer(subs, 'offer-1', 'US')).to.be.null;
        });

        it('groupOfferSubstitutionsForOffer groups countries by substitute label', () => {
            const subs = parseOfferSubstitutions([
                'substitute:offer-1:regional-osi:IN',
                'substitute:offer-1:regional-osi:CA_en',
            ]);
            const groups = groupOfferSubstitutionsForOffer(subs, ['offer-1'], ['IN', 'CA_en', 'US'], (id) =>
                id === 'regional-osi' ? 'Regional CC Pro' : id,
            );
            expect(groups).to.deep.equal([
                { offerLabel: 'Regional CC Pro', countries: ['IN', 'CA_en'], countriesLabel: 'IN, CA_en' },
            ]);
        });
    });

    describe('geo display helpers', () => {
        it('parseCountriesFromGeos extracts country suffixes', () => {
            expect(parseCountriesFromGeos(['mas:locale/CA_en', 'mas:locale/US'])).to.deep.equal(['CA_en', 'US']);
        });

        it('parseCountriesFromGeos includes pzn country tags alongside locale tags', () => {
            expect(parseCountriesFromGeos(['mas:locale/id_ID', 'mas:pzn/country/id', 'mas:pzn/country/co'])).to.deep.equal([
                'id_ID',
                'id',
                'co',
            ]);
        });

        it('parseCountriesFromGeos skips non-country pzn tags', () => {
            expect(parseCountriesFromGeos(['mas:locale/CA_en', 'mas:pzn/TEAMS'])).to.deep.equal(['CA_en']);
        });
    });

    describe('buildRemoveOfferConfirmationMessage', () => {
        it('uses singular fragment copy for one fragment removal', () => {
            expect(buildRemoveOfferConfirmationMessage(1)).to.equal(
                '1 fragment was selected with this offer and will be removed from the list. Are you sure you want to delete the offer?',
            );
        });

        it('uses plural fragments copy for multiple fragment removals', () => {
            expect(buildRemoveOfferConfirmationMessage(2)).to.include('2 fragments were selected');
        });

        it('lists fragments and collections separately in the confirmation copy', () => {
            expect(buildRemoveOfferConfirmationMessage(2, 1)).to.equal(
                '2 fragments and 1 collection were selected with this offer and will be removed from the list. Are you sure you want to delete the offer?',
            );
        });
    });

    describe('getPromotionItemsRemovedByOfferRemoval', () => {
        const ffsaCard = '/content/dam/mas/ffsa-card';
        const phspCard = '/content/dam/mas/phsp-card';
        const offerCache = new Map([
            ['ffsa-osi', buildPromotionOfferCacheEntry('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' })],
            ['phsp-osi', buildPromotionOfferCacheEntry('phsp-osi', { product_code: 'PHSP', offer_id: 'wcs-2' })],
        ]);
        const cardsByPaths = new Map([
            [ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }],
            [phspCard, { path: phspCard, tags: [{ id: 'mas:product_code/phsp', title: 'PHSP' }] }],
        ]);

        it('returns only items tied to the removed offer product code', () => {
            const removed = getPromotionItemsRemovedByOfferRemoval({
                offerSelectorId: 'ffsa-osi',
                selectedOffers: ['ffsa-osi', 'phsp-osi'],
                selectedCards: [ffsaCard, phspCard],
                selectedCollections: [],
                offerDataCache: offerCache,
                cardsByPaths,
                collectionsByPaths: new Map(),
            });
            expect(removed.removedCards).to.deep.equal([ffsaCard]);
            expect(removed.removedCollections).to.deep.equal([]);
        });
    });

    describe('pruneOrphanedPromotionSelectionAfterOfferRemoval', () => {
        const ffsaCard = '/content/dam/mas/ffsa-card';
        const phspCard = '/content/dam/mas/phsp-card';
        const ffsaCol = '/content/dam/mas/ffsa-col';
        const offerCache = new Map([
            ['ffsa-osi', buildPromotionOfferCacheEntry('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' })],
            ['phsp-osi', buildPromotionOfferCacheEntry('phsp-osi', { product_code: 'PHSP', offer_id: 'wcs-2' })],
        ]);
        const cardsByPaths = new Map([
            [ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }],
            [phspCard, { path: phspCard, tags: [{ id: 'mas:product_code/phsp', title: 'PHSP' }] }],
        ]);
        const collectionsByPaths = new Map([
            [ffsaCol, { path: ffsaCol, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }],
        ]);

        it('clears all fragments and collections when the last offer is removed', () => {
            const result = pruneOrphanedPromotionSelectionAfterOfferRemoval({
                selectedCards: [ffsaCard, phspCard],
                selectedCollections: [ffsaCol],
                remainingSelectedOfferIds: [],
                offerDataCache: offerCache,
                cardsByPaths,
                collectionsByPaths,
            });
            expect(result.selectedCards).to.deep.equal([]);
            expect(result.selectedCollections).to.deep.equal([]);
        });

        it('keeps only fragments matching remaining offer product codes', () => {
            const result = pruneOrphanedPromotionSelectionAfterOfferRemoval({
                selectedCards: [ffsaCard, phspCard],
                selectedCollections: [ffsaCol],
                remainingSelectedOfferIds: ['phsp-osi'],
                offerDataCache: offerCache,
                cardsByPaths,
                collectionsByPaths,
            });
            expect(result.selectedCards).to.deep.equal([phspCard]);
            expect(result.selectedCollections).to.deep.equal([]);
        });

        it('prunes unclassified card paths when some offers remain', () => {
            const unclassifiedCard = '/content/dam/mas/missing-card';
            const result = pruneOrphanedPromotionSelectionAfterOfferRemoval({
                selectedCards: [ffsaCard, unclassifiedCard],
                selectedCollections: [],
                remainingSelectedOfferIds: ['phsp-osi'],
                offerDataCache: offerCache,
                cardsByPaths,
                collectionsByPaths,
            });
            expect(result.selectedCards).to.deep.equal([]);
        });

        it('keeps all items when remaining offers exist but offer cache has no product tags', () => {
            const result = pruneOrphanedPromotionSelectionAfterOfferRemoval({
                selectedCards: [ffsaCard, phspCard],
                selectedCollections: [ffsaCol],
                remainingSelectedOfferIds: ['ffsa-osi'],
                offerDataCache: new Map(),
                cardsByPaths,
                collectionsByPaths,
            });
            expect(result.selectedCards).to.deep.equal([ffsaCard, phspCard]);
            expect(result.selectedCollections).to.deep.equal([ffsaCol]);
        });
    });

    describe('buildPromotionOfferTags', () => {
        it('maps OST offer fields to mas tag ids and display titles', () => {
            const tags = buildPromotionOfferTags(
                {
                    product_code: 'FFSA',
                    offer_type: 'BASE',
                    planType: 'ABM',
                    customer_segment: 'INDIVIDUAL',
                    market_segments: 'COM',
                },
                'PA-2511',
            );
            expect(tags).to.deep.include({ id: 'mas:product_code/ffsa', title: 'FFSA' });
            expect(tags).to.deep.include({ id: 'mas:product_arrangement/pa-2511', title: 'PA-2511' });
            expect(tags).to.deep.include({ id: 'mas:offer_type/base', title: 'BASE' });
            expect(tags).to.deep.include({ id: 'mas:plan_type/abm', title: 'ABM' });
            expect(tags).to.deep.include({ id: 'mas:customer_segment/individual', title: 'INDIVIDUAL' });
            expect(tags).to.deep.include({ id: 'mas:market_segment/com', title: 'COM' });
        });

        it('uses product_name for product_code tag title when present', () => {
            const tags = buildPromotionOfferTags({ product_code: 'ilst', product_name: 'Illustrator' });
            expect(tags).to.deep.include({ id: 'mas:product_code/ilst', title: 'Illustrator' });
        });
    });

    describe('normalizePromotionOfferData', () => {
        it('normalizes offer_id to offerId and product arrangement code', () => {
            const data = normalizePromotionOfferData(
                { product_code: 'PHSP', offer_id: 'wcs-123', productArrangementCode: 'PA-9' },
                'phsp-osi',
                undefined,
            );
            expect(data.offerId).to.equal('wcs-123');
            expect(data.offer_id).to.be.undefined;
            expect(data.product_arrangement_code).to.equal('PA-9');
        });
    });

    describe('resolvePromotionOfferMnemonicIconUrl', () => {
        it('returns offer icon when present on OST payload', () => {
            expect(resolvePromotionOfferMnemonicIconUrl({ icon: 'https://example.com/icon.svg' })).to.equal(
                'https://example.com/icon.svg',
            );
        });
    });

    describe('groupCountriesByPromoCodeForOffer', () => {
        it('groups countries by effective promo code using OSI or WCS offer id keys', () => {
            const exceptions = parsePromoCodeExceptions(['osi-1:SPECIAL:US', 'osi-1:SPECIAL:CA_en', 'wcs-2:OTHER:pt_BR']);
            const groups = groupCountriesByPromoCodeForOffer(
                exceptions,
                ['osi-1', 'wcs-2'],
                ['US', 'CA_en', 'pt_BR'],
                'DEFAULT',
            );
            expect(groups).to.deep.equal([
                { promoCode: 'OTHER', countries: ['pt_BR'], countriesLabel: 'pt_BR' },
                { promoCode: 'SPECIAL', countries: ['US', 'CA_en'], countriesLabel: 'US, CA_en' },
            ]);
        });
    });

    describe('buildPromotionOfferCacheEntry', () => {
        it('exposes getTagTitle for offer table columns', () => {
            const entry = buildPromotionOfferCacheEntry(
                'phsp-osi',
                {
                    product_code: 'PHSP',
                    offer_type: 'BASE',
                    planType: 'ABM',
                    customer_segment: 'INDIVIDUAL',
                    market_segments: 'COM',
                    offer_id: 'wcs-123',
                },
                'PA-2511',
            );
            expect(entry.getTagTitle('offer_type')).to.equal('BASE');
            expect(entry.getTagTitle('plan_type')).to.equal('ABM');
            expect(entry.getTagTitle('customer_segment')).to.equal('INDIVIDUAL');
            expect(entry.getTagTitle('market_segment')).to.equal('COM');
            expect(entry.getTagTitle('product_arrangement')).to.equal('PA-2511');
            expect(entry.offerData.offerId).to.equal('wcs-123');
        });

        it('stores mnemonicIcon field when offer icon is present', () => {
            const entry = buildPromotionOfferCacheEntry(
                'phsp-osi',
                { product_code: 'PHSP', icon: 'https://example.com/phsp.svg' },
                'PA-1',
            );
            expect(entry.getFieldValue('mnemonicIcon')).to.equal('https://example.com/phsp.svg');
        });
    });

    describe('addPromotionOfferFromOst', () => {
        it('adds offer id and caches offer data with product tags', () => {
            const selectedOffers = {
                value: [],
                set(value) {
                    this.value = value;
                },
            };
            const offerDataCache = new Map();
            const offer = { product_code: 'PHSP', offer_id: 'offer-1' };
            const added = addPromotionOfferFromOst('phsp-osi', offer, selectedOffers, offerDataCache);
            expect(added).to.be.true;
            expect(selectedOffers.value).to.deep.equal(['phsp-osi']);
            expect(offerDataCache.get('phsp-osi')?.offerData?.offerId).to.equal('offer-1');
            expect(offerDataCache.get('phsp-osi')?.tags[0].id).to.equal('mas:product_code/phsp');
            expect(offerDataCache.get('phsp-osi')?.getTagTitle('offer_type')).to.be.undefined;
        });

        it('caches full offer metadata when OST payload includes segment fields', () => {
            const selectedOffers = {
                value: [],
                set(value) {
                    this.value = value;
                },
            };
            const offerDataCache = new Map();
            const offer = {
                product_code: 'FFSA',
                offer_type: 'BASE',
                planType: 'ABM',
                customer_segment: 'INDIVIDUAL',
                market_segments: 'COM',
                offer_id: 'wcs-offer-1',
                product_arrangement_code: 'PA-2511',
            };
            addPromotionOfferFromOst('ffsa-osi', offer, selectedOffers, offerDataCache);
            const cached = offerDataCache.get('ffsa-osi');
            expect(cached.getTagTitle('offer_type')).to.equal('BASE');
            expect(cached.getTagTitle('plan_type')).to.equal('ABM');
            expect(cached.getTagTitle('customer_segment')).to.equal('INDIVIDUAL');
            expect(cached.getTagTitle('market_segment')).to.equal('COM');
            expect(cached.offerData.offerId).to.equal('wcs-offer-1');
        });

        it('returns false for duplicate offer ids', () => {
            const selectedOffers = {
                value: ['phsp-osi'],
                set(value) {
                    this.value = value;
                },
            };
            const offerDataCache = new Map();
            const added = addPromotionOfferFromOst('phsp-osi', { product_code: 'PHSP' }, selectedOffers, offerDataCache);
            expect(added).to.be.false;
            expect(selectedOffers.value).to.deep.equal(['phsp-osi']);
        });

        it('returns false when offerSelectorId is missing', () => {
            const selectedOffers = {
                value: [],
                set(value) {
                    this.value = value;
                },
            };
            const offerDataCache = new Map();
            expect(addPromotionOfferFromOst('', { product_code: 'PHSP' }, selectedOffers, offerDataCache)).to.be.false;
        });
    });

    describe('collectPromotionOfferProductTags', () => {
        it('returns unique product_code tags from selected offers in cache', () => {
            const cache = new Map([
                [
                    'fpsa-osi',
                    {
                        tags: [
                            { id: 'mas:product_code/fpsa', title: 'FPSA' },
                            { id: 'mas:offer_type/base', title: 'BASE' },
                        ],
                    },
                ],
                ['stel-osi', { tags: [{ id: 'mas:product_code/stel', title: 'STEL' }] }],
            ]);
            expect(collectPromotionOfferProductTags(cache, ['fpsa-osi', 'stel-osi'])).to.deep.equal([
                'mas:product_code/fpsa',
                'mas:product_code/stel',
            ]);
        });

        it('deduplicates product_code tags shared by multiple offers', () => {
            const cache = new Map([
                ['a', { tags: [{ id: 'mas:product_code/phsp', title: 'PHSP' }] }],
                ['b', { tags: [{ id: 'mas:product_code/phsp', title: 'PHSP' }] }],
            ]);
            expect(collectPromotionOfferProductTags(cache, ['a', 'b'])).to.deep.equal(['mas:product_code/phsp']);
        });

        it('returns empty array when no offers are selected', () => {
            expect(collectPromotionOfferProductTags(new Map(), [])).to.deep.equal([]);
        });
    });

    describe('applyPromotionOfferProductTagsToSearch', () => {
        afterEach(() => {
            Store.filters.set((prev) => ({ ...prev, tags: undefined }));
        });

        it('writes comma-separated product tags to Store.filters', () => {
            const cache = new Map([
                ['fpsa-osi', { tags: [{ id: 'mas:product_code/fpsa', title: 'FPSA' }] }],
                ['stel-osi', { tags: [{ id: 'mas:product_code/stel', title: 'STEL' }] }],
            ]);
            applyPromotionOfferProductTagsToSearch(cache, ['fpsa-osi', 'stel-osi']);
            expect(Store.filters.get().tags).to.equal('mas:product_code/fpsa,mas:product_code/stel');
        });

        it('clears tags when no offers are selected', () => {
            Store.filters.set((prev) => ({ ...prev, tags: 'mas:product_code/phsp' }));
            applyPromotionOfferProductTagsToSearch(new Map(), []);
            expect(Store.filters.get().tags).to.be.undefined;
        });
    });

    describe('groupCountriesByPromoCode', () => {
        it('returns empty array when countries is empty', () => {
            expect(groupCountriesByPromoCode(new Map(), ['osi-1'], [], 'DEFAULT')).to.deep.equal([]);
        });

        it('groups all countries under default code when no exceptions', () => {
            const result = groupCountriesByPromoCode(new Map(), ['osi-1'], ['US', 'CA'], 'PROMO10');
            expect(result).to.have.length(1);
            expect(result[0].promoCode).to.equal('PROMO10');
            expect(result[0].countries).to.deep.equal(['US', 'CA']);
        });

        it('splits countries into separate groups when exceptions differ', () => {
            const exceptions = new Map([['osi-1|US', 'SAVE20']]);
            const result = groupCountriesByPromoCode(exceptions, ['osi-1'], ['US', 'CA'], 'PROMO10');
            expect(result).to.have.length(2);
            const codes = result.map((g) => g.promoCode).sort();
            expect(codes).to.include('PROMO10');
            expect(codes).to.include('SAVE20');
        });

        it('sorts groups by promoCode', () => {
            const exceptions = new Map([['osi-1|US', 'ZZZ']]);
            const result = groupCountriesByPromoCode(exceptions, ['osi-1'], ['US', 'CA'], 'AAA');
            expect(result[0].promoCode).to.equal('AAA');
            expect(result[1].promoCode).to.equal('ZZZ');
        });
    });

    describe('serializePromotionOfferCacheLine', () => {
        it('returns empty string when offerSelectorId is missing', () => {
            expect(serializePromotionOfferCacheLine('', { product_code: 'PHSP' })).to.equal('');
        });

        it('returns empty string when snapshot is null', () => {
            expect(serializePromotionOfferCacheLine('osi-1', null)).to.equal('');
        });

        it('produces an offer-cache:: line that round-trips through parsePromotionOfferCacheLines', () => {
            const line = serializePromotionOfferCacheLine('osi-abc', {
                product_code: 'PHSP',
                offer_id: 'wcs-1',
            });
            expect(line).to.match(/^offer-cache::/);
            const parsed = parsePromotionOfferCacheLines([line]);
            const snapshot = parsed.get('osi-abc');
            expect(snapshot?.product_code).to.equal('PHSP');
            expect(snapshot?.offer_id).to.equal('wcs-1');
        });
    });

    describe('resolvePromotionOfferCacheEntry', () => {
        it('returns null for empty offerSelectorId', async () => {
            expect(await resolvePromotionOfferCacheEntry('')).to.be.null;
        });

        it('returns a fallback cache entry when commerce service is unavailable', async () => {
            const entry = await resolvePromotionOfferCacheEntry('osi-unknown');
            expect(entry?.id).to.equal('osi-unknown');
        });
    });

    describe('hydratePromotionOfferCacheFromSelectorIds', () => {
        it('does nothing for an empty ids array', async () => {
            const cache = new Map();
            await hydratePromotionOfferCacheFromSelectorIds([], cache);
            expect(cache.size).to.equal(0);
        });

        it('skips ids whose cache entry already has a display name', async () => {
            const existing = buildPromotionOfferCacheEntry('osi-1', { product_code: 'PHSP' }, 'PA-1');
            expect(promotionOfferCacheEntryHasDisplayName(existing)).to.be.true;
            const cache = new Map([['osi-1', existing]]);
            await hydratePromotionOfferCacheFromSelectorIds(['osi-1'], cache);
            expect(cache.get('osi-1')).to.equal(existing);
        });

        it('adds a fallback entry for uncached ids when commerce service is unavailable', async () => {
            const cache = new Map();
            await hydratePromotionOfferCacheFromSelectorIds(['osi-unknown'], cache);
            expect(cache.has('osi-unknown')).to.be.true;
            expect(cache.get('osi-unknown').id).to.equal('osi-unknown');
        });
    });
});
