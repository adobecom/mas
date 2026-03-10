import { expect, fixture, html } from '@open-wc/testing';
import { MasChatMessage } from '../src/mas-chat-message.js';

describe('MasChatMessage', () => {
    describe('formatTimestamp', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-chat-message></mas-chat-message>`);
        });

        it('formats a valid timestamp to locale string', () => {
            const result = el.formatTimestamp('2025-06-15T14:30:00Z');
            expect(result).to.be.a('string');
            expect(result).to.include('Jun');
            expect(result).to.include('15');
        });

        it('returns empty string for null', () => {
            expect(el.formatTimestamp(null)).to.equal('');
        });

        it('returns empty string for undefined', () => {
            expect(el.formatTimestamp(undefined)).to.equal('');
        });
    });

    describe('getOfferProductName', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-chat-message></mas-chat-message>`);
        });

        it('returns offer.productName when present', () => {
            expect(el.getOfferProductName({ productName: 'Photoshop', name: 'PS' })).to.equal('Photoshop');
        });

        it('falls back to offer.name', () => {
            expect(el.getOfferProductName({ name: 'Illustrator' })).to.equal('Illustrator');
        });

        it('returns "Unknown Product" when neither present', () => {
            expect(el.getOfferProductName({})).to.equal('Unknown Product');
        });

        it('returns empty string for null offer', () => {
            expect(el.getOfferProductName(null)).to.equal('');
        });
    });

    describe('getOfferIcon', () => {
        let el;

        beforeEach(async () => {
            el = await fixture(html`<mas-chat-message></mas-chat-message>`);
        });

        it('returns offer.icon when present', () => {
            expect(el.getOfferIcon({ icon: 'ps.svg', iconUrl: 'ps-alt.svg' })).to.equal('ps.svg');
        });

        it('falls back to offer.iconUrl', () => {
            expect(el.getOfferIcon({ iconUrl: 'ai.svg' })).to.equal('ai.svg');
        });

        it('returns empty string when neither present', () => {
            expect(el.getOfferIcon({})).to.equal('');
        });

        it('returns empty string for null offer', () => {
            expect(el.getOfferIcon(null)).to.equal('');
        });
    });

    describe('FOLLOW_UP_MAP and DEFAULT_FOLLOW_UPS', () => {
        it('contains expected keys in FOLLOW_UP_MAP', () => {
            const keys = Object.keys(MasChatMessage.FOLLOW_UP_MAP);
            expect(keys).to.include('search_cards');
            expect(keys).to.include('publish_card');
            expect(keys).to.include('delete_card');
            expect(keys).to.include('bulk_update_cards');
            expect(keys).to.include('get_card');
        });

        it('has a non-empty DEFAULT_FOLLOW_UPS array', () => {
            expect(MasChatMessage.DEFAULT_FOLLOW_UPS).to.be.an('array');
            expect(MasChatMessage.DEFAULT_FOLLOW_UPS.length).to.be.greaterThan(0);
        });
    });

    describe('handleCardAction', () => {
        it('dispatches card-action event with correct detail', async () => {
            const el = await fixture(html`
                <mas-chat-message
                    .message=${{
                        cardConfig: { variant: 'catalog' },
                        fragmentId: 'frag-1',
                        fragmentTitle: 'Test Card',
                    }}
                ></mas-chat-message>
            `);

            let detail;
            el.addEventListener('card-action', (e) => {
                detail = e.detail;
            });

            el.handleCardAction('edit');

            expect(detail).to.deep.equal({
                action: 'edit',
                config: { variant: 'catalog' },
                fragmentId: 'frag-1',
                fragmentTitle: 'Test Card',
            });
        });
    });

    describe('handleOperationAction', () => {
        it('dispatches operation-action with operation data', async () => {
            const operation = { type: 'publish', target: 'card-1' };
            const el = await fixture(html` <mas-chat-message .message=${{ operation }}></mas-chat-message> `);

            let detail;
            el.addEventListener('operation-action', (e) => {
                detail = e.detail;
            });

            el.handleOperationAction('confirm');

            expect(detail.action).to.equal('confirm');
            expect(detail.operation).to.deep.equal(operation);
        });

        it('dispatches operation-action with mcpOperation data when present', async () => {
            const mcpOperation = { mcpTool: 'search', mcpParams: { query: 'test' } };
            const el = await fixture(html` <mas-chat-message .message=${{ mcpOperation }}></mas-chat-message> `);

            let detail;
            el.addEventListener('operation-action', (e) => {
                detail = e.detail;
            });

            el.handleOperationAction('execute');

            expect(detail.action).to.equal('execute');
            expect(detail.operation).to.deep.equal({
                type: 'mcp_operation',
                mcpTool: 'search',
                mcpParams: { query: 'test' },
            });
        });
    });

    describe('handleCollectionAction', () => {
        it('dispatches collection-action event with correct detail', async () => {
            const collectionConfig = { name: 'My Collection', cards: ['c1', 'c2'] };
            const el = await fixture(html` <mas-chat-message .message=${{ collectionConfig }}></mas-chat-message> `);

            let detail;
            el.addEventListener('collection-action', (e) => {
                detail = e.detail;
            });

            el.handleCollectionAction('create');

            expect(detail).to.deep.equal({
                action: 'create',
                config: collectionConfig,
            });
        });
    });
});
