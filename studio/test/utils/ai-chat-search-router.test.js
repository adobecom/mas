import { expect } from '@esm-bundle/chai';
import { classifySearchIntent, resumeWithSlot } from '../../src/utils/ai-chat-search-router.js';

const UUID = '12345678-90ab-cdef-1234-567890abcdef';
const REAL_OSI = 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8';
const SHORT_OSI = 'K79yhO4';
const OFFER_ID = '09A8B74E1F31D62DDC7AB18167D3CA67';

describe('ai-chat-search-router', () => {
    describe('classifySearchIntent — empty / unknown inputs', () => {
        it('returns unknown for null / undefined / empty / whitespace', () => {
            for (const input of [null, undefined, '', '   ', 0, {}]) {
                const result = classifySearchIntent(input);
                expect(result.intent).to.equal('unknown');
                expect(result.dispatch).to.equal(null);
                expect(result.confidence).to.equal(0);
            }
        });

        it('returns unknown for plain conversational asks', () => {
            const result = classifySearchIntent('what should I do today?');
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });
    });

    describe('UUID detection (id-lookup)', () => {
        it('classifies a bare UUID at confidence 0.99', () => {
            const result = classifySearchIntent(UUID);
            expect(result.intent).to.equal('id-lookup');
            expect(result.confidence).to.equal(0.99);
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'get_card',
                mcpParams: { id: UUID },
            });
        });

        it('classifies an embedded UUID', () => {
            const result = classifySearchIntent(`open card ${UUID} please`);
            expect(result.intent).to.equal('id-lookup');
            expect(result.dispatch.mcpParams.id).to.equal(UUID);
        });

        it('falls back to unknown when multiple UUIDs are present', () => {
            const result = classifySearchIntent(`compare ${UUID} and ${UUID.replace('1', 'a')}`);
            expect(result.intent).to.equal('unknown');
            expect(result.confidence).to.equal(0.7);
        });
    });

    describe('OSI detection (osi-lookup)', () => {
        it('classifies a real-shape OSI when message contains "osi" keyword', () => {
            const result = classifySearchIntent(`find cards using osi ${REAL_OSI}`, {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('osi-lookup');
            expect(result.confidence).to.equal(0.95);
            expect(result.dispatch.mcpTool).to.equal('search_cards');
            expect(result.dispatch.mcpParams).to.deep.equal({
                osi: REAL_OSI,
                surface: 'acom',
                locale: 'en_US',
            });
        });

        it('omits surface from mcpParams when no surface in context', () => {
            const result = classifySearchIntent(`look up cards by osi ${SHORT_OSI}`);
            expect(result.intent).to.equal('osi-lookup');
            expect(result.dispatch.mcpParams).to.deep.equal({ osi: SHORT_OSI });
        });

        it('classifies a bare OSI-shaped token alone (medium confidence)', () => {
            const result = classifySearchIntent(REAL_OSI);
            expect(result.intent).to.equal('osi-lookup');
            expect(result.confidence).to.be.at.least(0.5);
            expect(result.confidence).to.be.below(0.85);
            expect(result.dispatch.mcpParams.osi).to.equal(REAL_OSI);
        });

        it('does not classify a bare OSI-shaped token inside a sentence', () => {
            const result = classifySearchIntent(`is ${SHORT_OSI} something I should worry about`);
            expect(result.intent).to.equal('unknown');
        });
    });

    describe('Offer ID detection', () => {
        it('classifies a 32-hex token with offer keyword as osi-shape lookup', () => {
            const result = classifySearchIntent(`find cards using offer id ${OFFER_ID}`, {
                currentSurface: 'commerce',
            });
            expect(result.intent).to.equal('offer-id-lookup');
            expect(result.confidence).to.equal(0.9);
            expect(result.dispatch.mcpTool).to.equal('search_cards');
            expect(result.dispatch.mcpParams.osi).to.equal(OFFER_ID);
            expect(result.dispatch.mcpParams.surface).to.equal('commerce');
        });

        it('does not classify a 32-hex token without offer keyword', () => {
            const result = classifySearchIntent(`is ${OFFER_ID} a thing`);
            expect(result.intent).to.equal('unknown');
        });
    });

    describe('Locale resolution', () => {
        it('sets locale=all when message contains "in all locales"', () => {
            const result = classifySearchIntent('find cards titled "Wide Card" in all locales', {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.locale).to.equal('all');
            expect(result.dispatch.mcpParams.surface).to.equal('acom');
        });

        it('sets locale=all when message contains "across all locales"', () => {
            const result = classifySearchIntent('find cards titled "Promo" across all locales', {
                currentSurface: 'acom',
            });
            expect(result.dispatch.mcpParams.locale).to.equal('all');
        });

        it('sets locale=all when message contains "across every locale"', () => {
            const result = classifySearchIntent('find cards titled "Promo" across every locale', {
                currentSurface: 'acom',
            });
            expect(result.dispatch.mcpParams.locale).to.equal('all');
        });

        it('uses an explicit locale code from the message', () => {
            const result = classifySearchIntent('find cards titled "Promo" in fr_FR', {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.dispatch.mcpParams.locale).to.equal('fr_FR');
        });

        it('falls back to currentLocale when no locale phrasing is present', () => {
            const result = classifySearchIntent('find cards titled "Promo"', {
                currentSurface: 'acom',
                currentLocale: 'de_DE',
            });
            expect(result.dispatch.mcpParams.locale).to.equal('de_DE');
        });
    });

    describe('Title search (titled-verb pattern)', () => {
        it('classifies "find cards titled X" with surface in context', () => {
            const result = classifySearchIntent('find cards titled Photoshop plan', {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.confidence).to.equal(0.8);
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: {
                    query: 'Photoshop plan',
                    surface: 'acom',
                    locale: 'en_US',
                    titleSearch: true,
                },
            });
        });

        it('asks for surface when no context surface', () => {
            const result = classifySearchIntent('find cards titled Photoshop plan');
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch).to.equal(null);
            expect(result.missingSlot).to.deep.equal({
                slot: 'surface',
                prompt: 'Which surface should I search? acom, commerce, ccd, or sandbox?',
            });
            expect(result.slots.query).to.equal('Photoshop plan');
        });

        it('handles "show me cards named X" phrasing', () => {
            const result = classifySearchIntent('show me cards named Promo Q4', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.query).to.equal('Promo Q4');
        });

        it('handles trailing "in <surface>" gracefully', () => {
            const result = classifySearchIntent('find cards titled Promo in acom', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.query).to.equal('Promo');
        });
    });

    describe('Content search (content-verb pattern)', () => {
        it('classifies "search for cards containing X" as content-search', () => {
            const result = classifySearchIntent('search for cards containing firefly', {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.confidence).to.equal(0.8);
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: { query: 'firefly', surface: 'acom', locale: 'en_US' },
            });
            expect(result.dispatch.mcpParams.titleSearch).to.equal(undefined);
        });

        it('handles "find cards mentioning X" phrasing', () => {
            const result = classifySearchIntent('find cards mentioning Photoshop', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch.mcpParams.query).to.equal('Photoshop');
        });

        it('handles "show all cards with X" phrasing', () => {
            const result = classifySearchIntent('show all cards with Premium', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch.mcpParams.query).to.equal('Premium');
        });

        it('handles "list cards about X" phrasing', () => {
            const result = classifySearchIntent('list cards about firefly', {
                currentSurface: 'commerce',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch.mcpParams.query).to.equal('firefly');
        });

        it('asks for surface when none in context for content-search', () => {
            const result = classifySearchIntent('search for cards containing firefly');
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch).to.equal(null);
            expect(result.missingSlot.slot).to.equal('surface');
            expect(result.slots.query).to.equal('firefly');
        });

        it('content-search honors locale phrasing', () => {
            const result = classifySearchIntent('find cards containing promo in all locales', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch.mcpParams.locale).to.equal('all');
        });
    });

    describe('Quoted title pattern', () => {
        it('classifies a quoted title with a search verb', () => {
            const result = classifySearchIntent('find "Photoshop plan"', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.confidence).to.be.at.least(0.85);
            expect(result.dispatch.mcpParams.query).to.equal('Photoshop plan');
        });

        it('classifies a quoted title with the noun "cards"', () => {
            const result = classifySearchIntent("which cards have 'Premium tier' in them?", {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.query).to.equal('Premium tier');
        });

        it('does not classify a casual quoted phrase without anchor', () => {
            const result = classifySearchIntent("I'm not sure 'about' anything");
            expect(result.intent).to.equal('unknown');
        });
    });

    describe('resumeWithSlot', () => {
        const pendingTitleSearch = {
            intent: 'title-search',
            slots: { query: 'Promo Q4', locale: 'en_US', titleSearch: true },
            confidence: 0.8,
            missingSlot: {
                slot: 'surface',
                prompt: 'Which surface should I search? acom, commerce, ccd, or sandbox?',
            },
            dispatch: null,
        };

        it('completes the dispatch when reply is a known surface', () => {
            const result = resumeWithSlot('acom', pendingTitleSearch);
            expect(result.intent).to.equal('title-search');
            expect(result.missingSlot).to.equal(null);
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: {
                    query: 'Promo Q4',
                    surface: 'acom',
                    locale: 'en_US',
                    titleSearch: true,
                },
            });
        });

        it('normalizes case and whitespace on the surface reply', () => {
            const result = resumeWithSlot('  ACOM ', pendingTitleSearch);
            expect(result.dispatch.mcpParams.surface).to.equal('acom');
        });

        it('completes a content-search dispatch (no titleSearch flag)', () => {
            const pendingContent = {
                intent: 'content-search',
                slots: { query: 'firefly', locale: 'en_US' },
                confidence: 0.8,
                missingSlot: { slot: 'surface', prompt: 'Which surface should I search? ...' },
                dispatch: null,
            };
            const result = resumeWithSlot('acom', pendingContent);
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: { query: 'firefly', surface: 'acom', locale: 'en_US' },
            });
            expect(result.dispatch.mcpParams.titleSearch).to.equal(undefined);
        });

        it('returns unknown for an unrecognized reply', () => {
            const result = resumeWithSlot('whatever', pendingTitleSearch);
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('returns unknown when no missing slot is pending', () => {
            const result = resumeWithSlot('acom', { ...pendingTitleSearch, missingSlot: null });
            expect(result.intent).to.equal('unknown');
        });

        it('returns unknown for empty / null reply', () => {
            expect(resumeWithSlot('', pendingTitleSearch).intent).to.equal('unknown');
            expect(resumeWithSlot(null, pendingTitleSearch).intent).to.equal('unknown');
        });
    });

    describe('Tag / product-code abstain', () => {
        it('abstains on "with X as the product code"', () => {
            const result = classifySearchIntent('get a list of fragment IDs with Firefly Pro as the product code', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "tagged with X"', () => {
            const result = classifySearchIntent('show cards tagged with Photoshop', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('unknown');
        });

        it('abstains on "find cards with product code X"', () => {
            const result = classifySearchIntent('find cards with product code firefly-pro', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('unknown');
        });

        it('abstains on PA code references', () => {
            const result = classifySearchIntent('find cards for PA-2114', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
        });

        it('abstains on market segment references', () => {
            const result = classifySearchIntent('cards by market segment NAM', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
        });

        it('does NOT abstain on benign "with" phrasing (still content-search)', () => {
            const result = classifySearchIntent('find cards with firefly', { currentSurface: 'acom' });
            expect(result.intent).to.equal('content-search');
        });
    });

    describe('Adversarial inputs', () => {
        it('handles a UUID inside a markdown link', () => {
            const result = classifySearchIntent(`[card](https://example.com/${UUID})`);
            expect(result.intent).to.equal('id-lookup');
            expect(result.dispatch.mcpParams.id).to.equal(UUID);
        });

        it('returns unknown when a 32-hex looks like a hash but no offer keyword', () => {
            const result = classifySearchIntent(`commit hash ${OFFER_ID}`);
            expect(result.intent).to.equal('unknown');
        });

        it('UUID wins over a quoted title in the same message', () => {
            const result = classifySearchIntent(`look at "Photoshop" card ${UUID}`);
            expect(result.intent).to.equal('id-lookup');
        });

        it('does not pick a surface name as an OSI candidate', () => {
            const result = classifySearchIntent('show me the sandbox folder');
            expect(result.intent).to.equal('unknown');
        });
    });
});
