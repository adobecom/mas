import { expect, fixture, html } from '@open-wc/testing';
import '../src/mas-operation-result.js';

function createFragment(overrides = {}) {
    return {
        id: 'frag-123',
        title: 'Test Card',
        path: '/content/dam/mas/acom/en_US/cards/test-card',
        status: 'DRAFT',
        modified: new Date(Date.now() - 3600000).toISOString(),
        published: null,
        tags: [{ id: 'mas:studio/variant/catalog' }],
        fields: [
            { name: 'variant', values: ['catalog'], multiple: false },
            { name: 'cardTitle', values: ['My Card Title'], multiple: false },
            { name: 'description', values: ['<p>A test description</p>'], multiple: false },
            { name: 'prices', values: ['<span>$9.99/mo</span>'], multiple: false },
            { name: 'ctas', values: ['<a href="#">Buy Now</a>'], multiple: false },
            { name: 'osi', values: ['abc123'], multiple: false },
            { name: 'size', values: ['super-wide'], multiple: false },
        ],
        ...overrides,
    };
}

function createOfferResult(overrides = {}) {
    return {
        offerSelectorId: 'osi-abc-123',
        offers: [
            {
                offerId: 'offer-id-123456789012',
                productArrangementCode: 'PHOTOSHOP',
                commitment: 'YEAR',
                term: 'MONTHLY',
                planType: 'P3Y',
                customer_segment: 'INDIVIDUAL',
                market_segment: 'COM',
                priceDetails: {
                    price: 22.99,
                    currency: 'USD',
                    annualized: { annualizedPrice: 275.88 },
                },
            },
        ],
        checkoutUrl: 'https://commerce.adobe.com/checkout',
        ...overrides,
    };
}

describe('MasOperationResult', () => {
    describe('renderGetResult', () => {
        it('shows "No fragment data" when fragment is missing', async () => {
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{}}></mas-operation-result>
            `);
            expect(el.textContent).to.include('No fragment data');
        });

        it('renders fragment title and variant badge', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            expect(el.querySelector('.fragment-preview h4').textContent).to.equal('Test Card');
            const badges = el.querySelectorAll('.fragment-meta sp-badge');
            expect(badges[0].textContent).to.equal('catalog');
        });

        it('renders surface and locale badges from path', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const badges = el.querySelectorAll('.fragment-meta sp-badge');
            const badgeTexts = Array.from(badges).map((b) => b.textContent);
            expect(badgeTexts).to.include('acom');
            expect(badgeTexts).to.include('en_US');
        });

        it('renders fragment ID as copyable code', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const codeEl = el.querySelector('code.copyable');
            expect(codeEl).to.exist;
            expect(codeEl.textContent).to.equal('frag-123');
            expect(codeEl.getAttribute('tabindex')).to.equal('0');
            expect(codeEl.getAttribute('role')).to.equal('button');
        });

        it('renders OSI field when present', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const labels = el.querySelectorAll('.card-detail-grid .field-label');
            const labelTexts = Array.from(labels).map((l) => l.textContent);
            expect(labelTexts).to.include('OSI');
        });

        it('hides OSI field when not present', async () => {
            const fragment = createFragment({
                fields: [{ name: 'variant', values: ['catalog'], multiple: false }],
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const labels = el.querySelectorAll('.card-detail-grid .field-label');
            const labelTexts = Array.from(labels).map((l) => l.textContent);
            expect(labelTexts).to.not.include('OSI');
        });

        it('renders relative modified time', async () => {
            const fragment = createFragment({
                modified: new Date(Date.now() - 7200000).toISOString(),
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const values = el.querySelectorAll('.card-detail-grid .field-value');
            const texts = Array.from(values).map((v) => v.textContent);
            expect(texts.some((t) => t.includes('hour'))).to.be.true;
        });

        it('renders "Never" for unpublished fragments', async () => {
            const fragment = createFragment({ published: null });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const values = el.querySelectorAll('.card-detail-grid .field-value');
            const texts = Array.from(values).map((v) => v.textContent);
            expect(texts).to.include('Never');
        });

        it('shows size when not default "wide"', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const labels = el.querySelectorAll('.card-detail-grid .field-label');
            const labelTexts = Array.from(labels).map((l) => l.textContent);
            expect(labelTexts).to.include('Size');
        });

        it('hides size when it is "wide"', async () => {
            const fragment = createFragment({
                fields: [
                    { name: 'variant', values: ['catalog'], multiple: false },
                    { name: 'size', values: ['wide'], multiple: false },
                ],
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const labels = el.querySelectorAll('.card-detail-grid .field-label');
            const labelTexts = Array.from(labels).map((l) => l.textContent);
            expect(labelTexts).to.not.include('Size');
        });

        it('renders card fields section with stripped HTML', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const details = el.querySelector('.card-fields-section');
            expect(details).to.exist;
            const fieldValues = details.querySelectorAll('.field-value');
            const texts = Array.from(fieldValues).map((v) => v.textContent);
            expect(texts.some((t) => t.includes('A test description'))).to.be.true;
            expect(texts.some((t) => t.includes('<p>'))).to.be.false;
        });

        it('renders mnemonics count when present', async () => {
            const fragment = createFragment({
                fields: [
                    { name: 'variant', values: ['catalog'], multiple: false },
                    {
                        name: 'mnemonicIcon',
                        values: ['https://example.com/ps.svg', 'https://example.com/ai.svg'],
                        multiple: true,
                    },
                ],
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const details = el.querySelector('.card-fields-section');
            expect(details).to.exist;
            expect(details.textContent).to.include('2 icons');
        });

        it('renders Open in Editor and Copy ID buttons', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const buttons = el.querySelectorAll('.card-detail-actions sp-button');
            expect(buttons.length).to.equal(2);
            expect(buttons[0].textContent.trim()).to.include('Open in Editor');
            expect(buttons[1].textContent.trim()).to.include('Copy ID');
        });

        it('handles object-style fields', async () => {
            const fragment = createFragment({
                fields: {
                    variant: 'catalog',
                    cardTitle: 'Object Title',
                    osi: 'osi-456',
                },
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const labels = el.querySelectorAll('.card-detail-grid .field-label');
            const labelTexts = Array.from(labels).map((l) => l.textContent);
            expect(labelTexts).to.include('OSI');
        });

        it('truncates path to last 3 segments', async () => {
            const fragment = createFragment({
                path: '/content/dam/mas/acom/en_US/deep/nested/card-name',
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get_card'} .result=${{ fragment }}></mas-operation-result>
            `);
            const pathValue = el.querySelector('.card-detail-grid .field-value');
            expect(pathValue.textContent).to.include('…/');
            expect(pathValue.textContent).to.include('card-name');
        });
    });

    describe('renderOfferSelectorResult', () => {
        it('shows empty state when no offers', async () => {
            const el = await fixture(html`
                <mas-operation-result
                    .operationType=${'resolve_offer_selector'}
                    .result=${{ offerSelectorId: 'osi-1', offers: [] }}
                ></mas-operation-result>
            `);
            expect(el.textContent).to.include('No offers found');
        });

        it('renders primary offer details', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            expect(el.textContent).to.include('PHOTOSHOP');
            expect(el.textContent).to.include('YEAR');
        });

        it('renders customer and market segment badges', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const badges = el.querySelectorAll('.offer-info-grid sp-badge');
            const badgeTexts = Array.from(badges).map((b) => b.textContent);
            expect(badgeTexts).to.include('INDIVIDUAL');
            expect(badgeTexts).to.include('COM');
        });

        it('renders camelCase segment properties', async () => {
            const result = createOfferResult();
            result.offers[0].customer_segment = undefined;
            result.offers[0].market_segment = undefined;
            result.offers[0].customerSegment = 'TEAM';
            result.offers[0].marketSegment = 'EDU';
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const badges = el.querySelectorAll('.offer-info-grid sp-badge');
            const badgeTexts = Array.from(badges).map((b) => b.textContent);
            expect(badgeTexts).to.include('TEAM');
            expect(badgeTexts).to.include('EDU');
        });

        it('does not show multi-offer badge for single offer', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const headerBadge = el.querySelector('.result-header sp-badge');
            expect(headerBadge).to.be.null;
        });

        it('shows multi-offer badge and additional offers table', async () => {
            const result = createOfferResult();
            result.offers.push({
                offerId: 'offer-id-second-offer',
                commitment: 'MONTH',
                priceDetails: { price: 34.99, currency: 'USD' },
            });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const headerBadge = el.querySelector('.result-header sp-badge');
            expect(headerBadge).to.exist;
            expect(headerBadge.textContent).to.include('1 of 2');

            const additionalSection = el.querySelector('.additional-offers');
            expect(additionalSection).to.exist;
            expect(additionalSection.textContent).to.include('1 Additional Offer');
        });

        it('renders copyable OSI and offer ID with keyboard support', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const copyables = el.querySelectorAll('.offer-ids code.copyable');
            expect(copyables.length).to.equal(2);
            copyables.forEach((code) => {
                expect(code.getAttribute('tabindex')).to.equal('0');
                expect(code.getAttribute('role')).to.equal('button');
            });
        });

        it('renders Copy OSI button', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const buttons = el.querySelectorAll('.offer-actions sp-button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent.trim());
            expect(buttonTexts.some((t) => t.includes('Copy OSI'))).to.be.true;
        });

        it('renders checkout button when URL present', async () => {
            const result = createOfferResult();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const buttons = el.querySelectorAll('.offer-actions sp-button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent.trim());
            expect(buttonTexts.some((t) => t.includes('Open Checkout'))).to.be.true;
        });

        it('hides checkout button when no URL', async () => {
            const result = createOfferResult({ checkoutUrl: null });
            const el = await fixture(html`
                <mas-operation-result .operationType=${'resolve_offer_selector'} .result=${result}></mas-operation-result>
            `);
            const buttons = el.querySelectorAll('.offer-actions sp-button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent.trim());
            expect(buttonTexts.some((t) => t.includes('Open Checkout'))).to.be.false;
        });
    });

    describe('formatRelativeTime', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-operation-result></mas-operation-result>`);
        });

        it('returns "just now" for recent timestamps', () => {
            const now = new Date().toISOString();
            expect(el.formatRelativeTime(now)).to.equal('just now');
        });

        it('returns minutes for times under an hour', () => {
            const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
            expect(el.formatRelativeTime(fiveMinAgo)).to.equal('5 min ago');
        });

        it('returns hours for times under a day', () => {
            const threeHoursAgo = new Date(Date.now() - 10800000).toISOString();
            expect(el.formatRelativeTime(threeHoursAgo)).to.equal('3 hours ago');
        });

        it('returns "1 hour ago" singular', () => {
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            expect(el.formatRelativeTime(oneHourAgo)).to.equal('1 hour ago');
        });

        it('returns days for times under 30 days', () => {
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
            expect(el.formatRelativeTime(twoDaysAgo)).to.equal('2 days ago');
        });

        it('returns formatted date for times over 30 days', () => {
            const oldDate = new Date(Date.now() - 90 * 86400000).toISOString();
            const result = el.formatRelativeTime(oldDate);
            expect(result).to.match(/\d+\/\d+\/\d+/);
        });

        it('returns "Unknown" for null', () => {
            expect(el.formatRelativeTime(null)).to.equal('Unknown');
        });
    });

    describe('truncatePath', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-operation-result></mas-operation-result>`);
        });

        it('returns full path when 4 or fewer segments', () => {
            expect(el.truncatePath('/a/b/c')).to.equal('/a/b/c');
        });

        it('truncates long paths', () => {
            expect(el.truncatePath('/content/dam/mas/acom/en_US/cards/card-1')).to.equal('…/en_US/cards/card-1');
        });

        it('returns empty string for null', () => {
            expect(el.truncatePath(null)).to.equal('');
        });
    });

    describe('getFieldValues', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-operation-result></mas-operation-result>`);
        });

        it('handles array-style fields', () => {
            const fragment = {
                fields: [
                    { name: 'variant', values: ['catalog'], multiple: false },
                    { name: 'mnemonicIcon', values: ['a.svg', 'b.svg'], multiple: true },
                ],
            };
            const result = el.getFieldValues(fragment);
            expect(result.variant).to.equal('catalog');
            expect(result.mnemonicIcon).to.deep.equal(['a.svg', 'b.svg']);
        });

        it('handles object-style fields', () => {
            const fragment = { fields: { variant: 'catalog', osi: 'abc' } };
            const result = el.getFieldValues(fragment);
            expect(result.variant).to.equal('catalog');
            expect(result.osi).to.equal('abc');
        });

        it('returns empty object when fields missing', () => {
            expect(el.getFieldValues({})).to.deep.equal({});
        });
    });

    describe('extractVariant', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-operation-result></mas-operation-result>`);
        });

        it('extracts variant from tags', () => {
            const fragment = { tags: [{ id: 'mas:studio/variant/catalog' }] };
            expect(el.extractVariant(fragment)).to.equal('catalog');
        });

        it('extracts variant from array fields', () => {
            const fragment = {
                tags: [],
                fields: [{ name: 'variant', values: ['special-offers'] }],
            };
            expect(el.extractVariant(fragment)).to.equal('special-offers');
        });

        it('extracts variant from object fields', () => {
            const fragment = { tags: [], fields: { variant: 'plans' } };
            expect(el.extractVariant(fragment)).to.equal('plans');
        });

        it('returns "unknown" when no variant found', () => {
            const fragment = { tags: [], fields: {} };
            expect(el.extractVariant(fragment)).to.equal('unknown');
        });
    });

    describe('handleCopyKeydown', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-operation-result></mas-operation-result>`);
        });

        it('calls copyToClipboard on Enter', () => {
            let copiedText = null;
            el.copyToClipboard = (text) => {
                copiedText = text;
            };
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            el.handleCopyKeydown(event, 'test-id');
            expect(copiedText).to.equal('test-id');
        });

        it('calls copyToClipboard on Space', () => {
            let copiedText = null;
            el.copyToClipboard = (text) => {
                copiedText = text;
            };
            const event = new KeyboardEvent('keydown', { key: ' ' });
            el.handleCopyKeydown(event, 'test-id');
            expect(copiedText).to.equal('test-id');
        });

        it('does not call copyToClipboard on other keys', () => {
            let called = false;
            el.copyToClipboard = () => {
                called = true;
            };
            const event = new KeyboardEvent('keydown', { key: 'Tab' });
            el.handleCopyKeydown(event, 'test-id');
            expect(called).to.be.false;
        });
    });

    describe('render routing', () => {
        it('renders search results for "search_cards"', async () => {
            const el = await fixture(html`
                <mas-operation-result .operationType=${'search_cards'} .result=${{ results: [] }}></mas-operation-result>
            `);
            expect(el.querySelector('.search-result')).to.exist;
        });

        it('renders get result for "get"', async () => {
            const fragment = createFragment();
            const el = await fixture(html`
                <mas-operation-result .operationType=${'get'} .result=${{ fragment }}></mas-operation-result>
            `);
            expect(el.querySelector('.get-result')).to.exist;
        });

        it('renders default for unknown type', async () => {
            const el = await fixture(html`
                <mas-operation-result .operationType=${'unknown_op'} .result=${{ message: 'Done' }}></mas-operation-result>
            `);
            expect(el.textContent).to.include('Done');
        });

        it('renders "No result data" when result is null', async () => {
            const el = await fixture(html`<mas-operation-result .operationType=${'get'}></mas-operation-result>`);
            expect(el.textContent).to.include('No result data');
        });
    });
});
