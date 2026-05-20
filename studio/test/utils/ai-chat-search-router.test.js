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

        it('classifies UUID + variations anchor as variations-lookup (not id-lookup)', () => {
            const result = classifySearchIntent(`find all variations of ${UUID}`);
            expect(result.intent).to.equal('variations-lookup');
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'get_variations',
                mcpParams: { id: UUID },
            });
        });

        it('classifies "grouped variations from parent <UUID>" as variations-lookup', () => {
            const result = classifySearchIntent(`Find all grouped variations from parent ${UUID}`);
            expect(result.intent).to.equal('variations-lookup');
            expect(result.dispatch.mcpTool).to.equal('get_variations');
            expect(result.dispatch.mcpParams.id).to.equal(UUID);
        });

        it('falls back to id-lookup for bare UUID (no variations anchor)', () => {
            const result = classifySearchIntent(`open ${UUID}`);
            expect(result.intent).to.equal('id-lookup');
            expect(result.dispatch.mcpTool).to.equal('get_card');
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

        it('does NOT misclassify "usages of \\"X\\"" as title-search (real bug)', () => {
            // Reported failure: 'Find all usages of "get 20+ apps" within a
            // card\'s description' silently routed to titleSearch:true and
            // returned 0 because no card's title contains the phrase. The
            // CONTENT_QUOTED path must win first, OR the QUOTED_TITLE path
            // must abstain when a content-signal verb is present.
            const phrases = [
                'Find all usages of "get 20+ apps" within a card\'s description',
                'Find all usages of "get 20+ apps"',
                'find occurrences of "get 20+ apps"',
                'find instances of "Get 20+ apps"',
                'find mentions of "20+ apps"',
                'find references to "get 20+ apps"',
            ];
            for (const msg of phrases) {
                const result = classifySearchIntent(msg, { currentSurface: 'acom' });
                // Either dispatches as content-search OR abstains entirely.
                // It must NOT dispatch a title-search (which always returns 0
                // for content phrases that don't appear in card titles).
                if (result.dispatch) {
                    expect(result.dispatch.mcpParams.titleSearch, `Failed for: ${msg}`).to.not.equal(true);
                }
            }
        });

        it('classifies \'usages of "X"\' as content-search with the quoted phrase as query', () => {
            const result = classifySearchIntent('Find all usages of "get 20+ apps"', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('content-search');
            expect(result.dispatch.mcpParams.query).to.equal('get 20+ apps');
            expect(result.dispatch.mcpParams.titleSearch).to.equal(undefined);
        });

        it('abstains on "within a card\'s description" (field-scope)', () => {
            // The "within a card's description" qualifier is field-scope,
            // even though the quoted phrase itself would be content. Either
            // route is acceptable; we just must NOT title-search.
            const result = classifySearchIntent('Find all usages of "get 20+ apps" within a card\'s description', {
                currentSurface: 'acom',
            });
            // The CONTENT_QUOTED path fires first (HIGH_CONFIDENCE) and
            // captures "get 20+ apps" as a clean content query, which is
            // the right outcome — content-search across all fields will
            // include the description.
            expect(result.intent).to.be.oneOf(['content-search', 'unknown']);
            if (result.dispatch) {
                expect(result.dispatch.mcpParams.titleSearch).to.not.equal(true);
            }
        });

        it('handles "find cards with fragment title X in all locales" (use case 1)', () => {
            const msg =
                'Find all cards with fragment title "CC Plans Merch Card: Firefly Pro Plus: Individuals: 50-percent-promo" in all locales';
            const result = classifySearchIntent(msg, { currentSurface: 'acom' });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.query).to.equal(
                'CC Plans Merch Card: Firefly Pro Plus: Individuals: 50-percent-promo',
            );
            expect(result.dispatch.mcpParams.titleSearch).to.equal(true);
            expect(result.dispatch.mcpParams.locale).to.equal('all');
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

    describe('Variant / template search', () => {
        it('classifies "cards with template plans" with surface in context', () => {
            const result = classifySearchIntent("I'm looking for cards with template Plans", {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('variant-search');
            expect(result.confidence).to.equal(0.85);
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: { variant: 'plans', surface: 'acom', locale: 'en_US' },
            });
        });

        it('classifies "template plans in ACOM" and strips the trailing surface from the variant token', () => {
            const result = classifySearchIntent("I'm looking for cards with template Plans in ACOM");
            expect(result.intent).to.equal('variant-search');
            expect(result.slots.variant).to.equal('plans');
        });

        it('classifies anchor-after phrasing ("Plans template")', () => {
            const result = classifySearchIntent('show me Plans template cards', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('plans');
        });

        it('classifies "of type fries" phrasing', () => {
            const result = classifySearchIntent('find cards of type fries', {
                currentSurface: 'commerce',
            });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('fries');
        });

        it('matches multi-word dashed variants like plans-students', () => {
            const result = classifySearchIntent('show me plans-students template cards', {
                currentSurface: 'acom',
            });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('plans-students');
        });

        it('is case-insensitive on the anchor and the variant', () => {
            const result = classifySearchIntent('TEMPLATE PLANS', { currentSurface: 'acom' });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('plans');
        });

        it('asks for surface when no context surface', () => {
            const result = classifySearchIntent('cards with template Plans');
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch).to.equal(null);
            expect(result.missingSlot.slot).to.equal('surface');
            expect(result.slots.variant).to.equal('plans');
        });

        it('abstains when the user did not use an anchor word ("show Plans cards")', () => {
            // Without an explicit anchor word like "template" or "variant",
            // this is ambiguous with a title search. Router should NOT hijack —
            // LLM gets the next shot.
            const result = classifySearchIntent('show Plans cards', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains when the named template is not in the known set ("template frumple")', () => {
            const result = classifySearchIntent('cards with template frumple', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('does not hijack a title search ("find cards titled Plans")', () => {
            const result = classifySearchIntent('find cards titled Plans', { currentSurface: 'acom' });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch.mcpParams.query).to.equal('Plans');
            expect(result.dispatch.mcpParams.titleSearch).to.equal(true);
        });

        it('beats content-search when the message ends with a template anchor ("find cards with Plans template")', () => {
            // CONTENT_VERB_RE would otherwise capture "Plans template" as a
            // free-text query and return every card whose text contains that
            // phrase. The variant detector must win for this phrasing.
            const result = classifySearchIntent('find cards with Plans template', { currentSurface: 'acom' });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('plans');
        });

        it('beats content-search for "show cards with the Plans template"', () => {
            const result = classifySearchIntent('show cards with the Plans template', { currentSurface: 'acom' });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.variant).to.equal('plans');
        });

        it('honors trailing "in <surface>" as an override of currentSurface', () => {
            const result = classifySearchIntent('find cards with Plans template in commerce', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch.mcpParams.surface).to.equal('commerce');
            expect(result.dispatch.mcpParams.variant).to.equal('plans');
        });

        it('falls back to currentSurface when no trailing "in <surface>"', () => {
            const result = classifySearchIntent('find cards with Plans template', { currentSurface: 'sandbox' });
            expect(result.dispatch.mcpParams.surface).to.equal('sandbox');
        });

        it('still asks for surface slot-fill when trailing in <unknown>', () => {
            const result = classifySearchIntent('find cards with Plans template in mars');
            expect(result.intent).to.equal('variant-search');
            expect(result.missingSlot?.slot).to.equal('surface');
        });

        it('honors trailing "in <surface>" even with trailing punctuation', () => {
            // Real user inputs end with sentence punctuation often: '.', '?',
            // '!', stray quotes from copy/paste. The override regex must
            // tolerate these.
            const inputs = [
                'find cards with Plans template in acom.',
                'find cards with Plans template in acom?',
                'find cards with Plans template in acom!',
                'find cards with Plans template in acom"',
                "find cards with Plans template in acom'",
                'find cards with Plans template in acom...',
            ];
            for (const msg of inputs) {
                const result = classifySearchIntent(msg, { currentSurface: 'sandbox' });
                expect(result.dispatch?.mcpParams?.surface, `Failed for: ${msg}`).to.equal('acom');
            }
        });

        it('honors trailing "in <SURFACE>" in any case', () => {
            const result = classifySearchIntent('find cards with Plans template in ACOM', { currentSurface: 'sandbox' });
            expect(result.dispatch.mcpParams.surface).to.equal('acom');
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

        it('completes a variant-search dispatch with the surface reply', () => {
            const pendingVariant = {
                intent: 'variant-search',
                slots: { variant: 'plans', locale: 'en_US' },
                confidence: 0.85,
                missingSlot: { slot: 'surface', prompt: 'Which surface should I search? ...' },
                dispatch: null,
            };
            const result = resumeWithSlot('acom', pendingVariant);
            expect(result.intent).to.equal('variant-search');
            expect(result.dispatch).to.deep.equal({
                mcpTool: 'search_cards',
                mcpParams: { variant: 'plans', surface: 'acom', locale: 'en_US' },
            });
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

        it('abstains on PLURAL "PA codes" phrasing (singular regex missed it)', () => {
            // Real bug: 'can you show me PA codes of "Firefly Pro Plus"' was
            // hijacked by QUOTED_TITLE_RE because TAG_KEYWORD_RE only matched
            // singular "PA code".
            const result = classifySearchIntent('can you show me PA codes of "Firefly Pro Plus"', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on complex-scope qualifiers (field scope, exclusion, sorting, date)', () => {
            // These phrasings exceed the router's vocabulary. Dispatching a
            // simplified version returns wrong results silently. The router
            // bails so the LLM can compose a richer dispatch or ask a
            // clarifying question.
            const phrases = [
                'search for cards with "photoshop" in the description field',
                'find cards with photoshop in description',
                'find cards that contain "Get 20+ apps" in the description',
                'find cards with photoshop in the description',
                'find cards with photoshop in the title',
                'find cards with photoshop in the body',
                'find cards with photoshop in CTAs',
                'find cards with photoshop only in title',
                'find cards with photoshop but not promo',
                'show cards newer than 2025',
                'find first 5 cards titled foo',
                'sort cards by date',
                'find cards excluding plans',
            ];
            for (const msg of phrases) {
                const result = classifySearchIntent(msg, { currentSurface: 'acom' });
                expect(result.intent, `Failed for: ${msg}`).to.equal('unknown');
                expect(result.dispatch, `Failed for: ${msg}`).to.equal(null);
            }
        });

        it('sanity gate: rejects captured query with unmatched quote', () => {
            // QUOTED_TITLE_RE could in principle capture across a stray quote;
            // the gate stops dispatching obvious garbage.
            const result = classifySearchIntent('find cards titled "Photoshop in some weird"context', {
                currentSurface: 'acom',
            });
            // Either abstains entirely, OR dispatches a clean (no-quote) query
            // — but never dispatches a query containing an unbalanced quote.
            if (result.dispatch) {
                const q = result.dispatch.mcpParams.query;
                expect((q.match(/"/g) || []).length % 2, `Odd quote count in: ${q}`).to.equal(0);
            }
        });

        it('sanity gate: rejects captured query that starts with stop-word', () => {
            // Manufactured scenario — the regexes shouldn't produce this, but
            // the gate is the catch-all if they do.
            const result = classifySearchIntent('find cards with and the of', { currentSurface: 'acom' });
            // Should abstain rather than dispatch "and the of" as a query.
            expect(result.intent).to.equal('unknown');
        });

        it('abstains on plural "product codes", "arrangement codes", "tags"', () => {
            const phrases = [
                'show me product codes for Firefly Pro Plus',
                'list arrangement codes for Photoshop',
                'cards with tags Photoshop',
                'find cards by tags photoshop',
                'group by market segments',
                'list customer segments',
            ];
            for (const msg of phrases) {
                const result = classifySearchIntent(msg, { currentSurface: 'acom' });
                expect(result.intent, `Failed for: ${msg}`).to.equal('unknown');
            }
        });

        it('abstains on "as a tag" / "as the tag" / "as grouped variation tag" phrasings', () => {
            // The 6-use-case spec includes:
            //   - "containing 'Personalization' as a tag"
            //   - "containing 'Id_id' as grouped variation tag"
            // These should route to LLM for tag-namespace resolution.
            const phrases = [
                "Find all fragments containing 'Personalization' as a tag",
                "Find all fragments containing 'Id_id' as grouped variation tag",
                "show cards with 'Firefly' as the product tag",
                "find cards with 'Premium' as a grouped variation",
            ];
            for (const msg of phrases) {
                const result = classifySearchIntent(msg, { currentSurface: 'acom' });
                expect(result.intent, `Failed for: ${msg}`).to.equal('unknown');
            }
        });
    });

    describe('Offers vs cards abstain', () => {
        it('abstains on "show me all offers for \\"X\\"" (quoted product, no card mention)', () => {
            const result = classifySearchIntent('can you show me all offers for "Firefly Pro Plus"?', {
                currentSurface: 'acom',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "list offers for X"', () => {
            const result = classifySearchIntent('list offers for Photoshop', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
        });

        it('abstains on bare "offer" mentions without "card"', () => {
            const result = classifySearchIntent('what offers exist for CC Pro?', { currentSurface: 'acom' });
            expect(result.intent).to.equal('unknown');
        });

        it('does NOT abstain when message mentions both "offers" and "cards"', () => {
            const result = classifySearchIntent('find cards with offer Firefly', { currentSurface: 'acom' });
            // "with offer" → content-search; both keywords present so router can act.
            expect(result.intent).to.equal('content-search');
        });

        it('does NOT abstain on legitimate OSI lookup ("offer selector" keyword)', () => {
            const osi = 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8';
            const result = classifySearchIntent(`find cards with offer selector ${osi}`, {
                currentSurface: 'acom',
            });
            // "cards" present → router fires (OSI lookup), abstain doesn't trigger
            expect(result.intent).to.equal('osi-lookup');
        });
    });

    describe('Mutation intent abstain', () => {
        // The router must NOT dispatch a search when the message describes
        // a mutation (update / change / publish / delete / etc.). Before
        // this guard, "cards"/"fragments" as the OBJECT of a mutation verb
        // tripped SEARCH_NOUN_RE, and any quoted value (e.g. the new
        // description) was treated as a title-search query.
        it('abstains on "update the description of the 2 cards to \\"X\\""', () => {
            const result = classifySearchIntent('update the description of the 2 cards to "testing testing"', {
                currentSurface: 'sandbox',
                currentLocale: 'en_US',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "change the title of these cards to \\"X\\""', () => {
            const result = classifySearchIntent('change the title of these cards to "New Title"', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "publish the cards"', () => {
            const result = classifySearchIntent('publish the cards', { currentSurface: 'sandbox' });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "delete those fragments"', () => {
            const result = classifySearchIntent('delete those fragments', { currentSurface: 'sandbox' });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('abstains on "replace 20+ apps with 30+ apps in those cards"', () => {
            const result = classifySearchIntent('replace 20+ apps with 30+ apps in those cards', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('unknown');
            expect(result.dispatch).to.equal(null);
        });

        it('still dispatches a search when no mutation verb is present', () => {
            const result = classifySearchIntent('find cards titled "Firefly"', {
                currentSurface: 'sandbox',
            });
            expect(result.intent).to.equal('title-search');
            expect(result.dispatch).to.not.equal(null);
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
