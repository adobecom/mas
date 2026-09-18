import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    DICTIONARY_ENTRY_MODEL_ID,
    ROOT_PATH,
    SURFACES,
    TAG_MERCH_CARD,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from '../../src/constants.js';
import {
    REFERENCE_CHECK_PROCEED_THRESHOLD_MS,
    buildPlaceholderReferenceScopes,
    matchesPlaceholderKey,
    findPlaceholderReferences,
} from '../../src/placeholders/placeholder-references.js';

function makeCursor(pages) {
    return (async function* () {
        for (const page of pages) yield page;
    })();
}

describe('placeholder-references', () => {
    describe('buildPlaceholderReferenceScopes', () => {
        it('returns the surface scope plus the ACOM fallback scope', () => {
            expect(buildPlaceholderReferenceScopes({ surface: 'sandbox', locale: 'en_US' })).to.deep.equal([
                `${ROOT_PATH}/sandbox/en_US`,
                `${ROOT_PATH}/${SURFACES.ACOM.name}/en_US`,
            ]);
        });

        it('returns a single scope when the surface is already ACOM', () => {
            expect(buildPlaceholderReferenceScopes({ surface: SURFACES.ACOM.name, locale: 'en_US' })).to.deep.equal([
                `${ROOT_PATH}/${SURFACES.ACOM.name}/en_US`,
            ]);
        });

        it('returns an empty array without a surface or a locale', () => {
            expect(buildPlaceholderReferenceScopes({ surface: '', locale: 'en_US' })).to.deep.equal([]);
            expect(buildPlaceholderReferenceScopes({ surface: 'sandbox', locale: '' })).to.deep.equal([]);
        });
    });

    describe('matchesPlaceholderKey', () => {
        it('matches {{key}} and {{ key }} but not a different key', () => {
            expect(matchesPlaceholderKey({ fields: [{ values: ['Buy {{buy-now}} now'] }] }, 'buy-now')).to.be.true;
            expect(matchesPlaceholderKey({ fields: [{ values: ['Buy {{ buy-now }} now'] }] }, 'buy-now')).to.be.true;
            expect(matchesPlaceholderKey({ fields: [{ values: ['{{other-key}}'] }] }, 'buy-now')).to.be.false;
        });

        it('returns false without a key', () => {
            expect(matchesPlaceholderKey({ fields: [{ values: ['{{buy-now}}'] }] }, '')).to.be.false;
        });
    });

    describe('findPlaceholderReferences', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => sandbox.restore());

        function createAem(pagesByPath) {
            return {
                sites: {
                    cf: {
                        fragments: {
                            search: sandbox.stub().callsFake(async (options) => makeCursor(pagesByPath(options.path) || [])),
                        },
                    },
                },
            };
        }

        it('searches exactly the surface path and the ACOM fallback path, filtered to the expected modelIds', async () => {
            const aem = createAem(() => []);
            await findPlaceholderReferences(aem, { key: 'buy-now', surface: 'sandbox', locale: 'en_US' });

            const calls = aem.sites.cf.fragments.search.getCalls();
            expect(calls).to.have.lengthOf(2);
            expect(calls.map((call) => call.args[0].path)).to.have.members([
                `${ROOT_PATH}/sandbox/en_US`,
                `${ROOT_PATH}/${SURFACES.ACOM.name}/en_US`,
            ]);
            for (const call of calls) {
                expect(call.args[0].modelIds).to.have.members([
                    TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
                    TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
                    DICTIONARY_ENTRY_MODEL_ID,
                ]);
            }
        });

        it('keeps items with an exact {{key}} token and filters out unrelated matches', async () => {
            const surfaceScope = `${ROOT_PATH}/sandbox/en_US`;
            const aem = createAem((path) =>
                path === surfaceScope
                    ? [
                          [
                              { path: '/content/dam/mas/sandbox/en_US/cards/a', fields: [{ values: ['{{buy-now}}'] }] },
                              { path: '/content/dam/mas/sandbox/en_US/cards/b', fields: [{ values: ['{{ buy-now }}'] }] },
                              { path: '/content/dam/mas/sandbox/en_US/cards/c', fields: [{ values: ['{{other-key}}'] }] },
                          ],
                      ]
                    : [],
            );

            const { references } = await findPlaceholderReferences(aem, {
                key: 'buy-now',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(references.map((r) => r.path)).to.deep.equal([
                '/content/dam/mas/sandbox/en_US/cards/a',
                '/content/dam/mas/sandbox/en_US/cards/b',
            ]);
        });

        it('excludes the checked placeholder fragment itself', async () => {
            const surfaceScope = `${ROOT_PATH}/sandbox/en_US`;
            const selfPath = '/content/dam/mas/sandbox/en_US/dictionary/buy-now';
            const aem = createAem((path) =>
                path === surfaceScope ? [[{ path: selfPath, fields: [{ values: ['{{buy-now}}'] }] }]] : [],
            );

            const { references } = await findPlaceholderReferences(aem, {
                key: 'buy-now',
                surface: 'sandbox',
                locale: 'en_US',
                excludePath: selfPath,
            });
            expect(references).to.deep.equal([]);
        });

        it('computes allowProceed against the 15s threshold using elapsed time', async () => {
            const fastClock = sandbox.useFakeTimers();
            const fastAem = {
                sites: {
                    cf: {
                        fragments: {
                            search: sandbox.stub().callsFake(async () => {
                                fastClock.tick(100);
                                return makeCursor([]);
                            }),
                        },
                    },
                },
            };
            const fast = await findPlaceholderReferences(fastAem, { key: 'buy-now', surface: 'sandbox', locale: 'en_US' });
            expect(fast.allowProceed).to.be.true;
            fastClock.restore();

            const slowClock = sandbox.useFakeTimers();
            const slowAem = {
                sites: {
                    cf: {
                        fragments: {
                            search: sandbox.stub().callsFake(async () => {
                                slowClock.tick(REFERENCE_CHECK_PROCEED_THRESHOLD_MS);
                                return makeCursor([]);
                            }),
                        },
                    },
                },
            };
            const slow = await findPlaceholderReferences(slowAem, { key: 'buy-now', surface: 'sandbox', locale: 'en_US' });
            expect(slow.allowProceed).to.be.false;
            expect(slow.durationMs).to.be.at.least(REFERENCE_CHECK_PROCEED_THRESHOLD_MS);
            slowClock.restore();
        });
    });
});
