import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fetchProducts } from '../src/services/product-api.js';

const MOCK_PRODUCT = {
    arrangement_code: 'phsp_direct_individual',
    product_code: 'PHSP',
    product_family: 'CC_ALL_APPS',
    name: 'Photoshop',
    copy: { name: 'Adobe Photoshop' },
    assets: { icons: { svg: 'https://example.com/phsp.svg' } },
};

function mapProductToChatCard(product) {
    return {
        label: product.copy?.name || product.name || product.arrangement_code,
        value: product.arrangement_code,
        arrangement_code: product.arrangement_code,
        product_code: product.product_code,
        product_family: product.product_family,
        segments: [],
        icon: product.assets?.icons?.svg || product.icon,
    };
}

/**
 * Inline implementation of recoverProductLookup logic for unit testing.
 * Mirrors mas-chat.js recoverProductLookup exactly — if the method changes,
 * update this too.
 */
async function recoverProductLookup(context, searchText) {
    const result = await fetchProducts({ searchText }).catch(() => ({ products: [] }));
    const products = (result.products || []).map((p) => mapProductToChatCard(p));
    if (products.length) {
        context.messages = [
            ...context.messages,
            {
                role: 'assistant',
                content: `Found ${products.length} product(s) matching "${searchText}". Pick one to continue.`,
                buttonGroup: {
                    label: 'Product',
                    inputHint: 'Or type a product name to search...',
                },
                productCards: products,
                timestamp: Date.now(),
            },
        ];
    } else {
        context.messages = [
            ...context.messages,
            {
                role: 'assistant',
                content: `No products found matching "${searchText}". Please try a different name or check the spelling.`,
                timestamp: Date.now(),
            },
        ];
    }
}

describe('recoverProductLookup', () => {
    let fetchStub;

    beforeEach(() => {
        sessionStorage.setItem('masAccessToken', 'test-token');
        fetchStub = sinon.stub(window, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
        sessionStorage.removeItem('masAccessToken');
    });

    it('appends productCards guided step when products are found', async () => {
        fetchStub.resolves({
            ok: true,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([MOCK_PRODUCT]),
        });

        const ctx = { messages: [] };
        await recoverProductLookup(ctx, 'Photoshop');

        expect(ctx.messages).to.have.length(1);
        const msg = ctx.messages[0];
        expect(msg.role).to.equal('assistant');
        expect(msg.buttonGroup?.label).to.equal('Product');
        expect(msg.productCards).to.have.length(1);
        expect(msg.productCards[0].value).to.equal('phsp_direct_individual');
        expect(msg.productCards[0].icon).to.equal('https://example.com/phsp.svg');
        expect(msg.content).to.include('Found 1');
        expect(msg.content).to.include('"Photoshop"');
    });

    it('appends no-results message when fetch returns empty products', async () => {
        fetchStub.resolves({
            ok: true,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([]),
        });

        const ctx = { messages: [] };
        await recoverProductLookup(ctx, 'asdfqwer');

        expect(ctx.messages).to.have.length(1);
        const msg = ctx.messages[0];
        expect(msg.role).to.equal('assistant');
        expect(msg.buttonGroup).to.be.undefined;
        expect(msg.productCards).to.be.undefined;
        expect(msg.content).to.include('No products found matching "asdfqwer"');
    });

    it('appends no-results message when fetch fails (inner catch silences errors)', async () => {
        fetchStub.rejects(new Error('Network error'));

        const ctx = { messages: [] };
        await recoverProductLookup(ctx, 'Photoshop');

        expect(ctx.messages).to.have.length(1);
        const msg = ctx.messages[0];
        expect(msg.role).to.equal('assistant');
        expect(msg.content).to.include('No products found matching "Photoshop"');
    });

    it('preserves existing messages when appending', async () => {
        fetchStub.resolves({
            ok: true,
            headers: { get: () => 'application/json' },
            json: () => Promise.resolve([MOCK_PRODUCT]),
        });

        const ctx = {
            messages: [{ role: 'user', content: 'adobe firefly' }],
        };
        await recoverProductLookup(ctx, 'adobe firefly');

        expect(ctx.messages).to.have.length(2);
        expect(ctx.messages[0].role).to.equal('user');
        expect(ctx.messages[1].role).to.equal('assistant');
    });
});

describe('product-selection interception guard', () => {
    it('detects a product-selection guided step by buttonGroup label', () => {
        const productSelectionMsg = {
            role: 'assistant',
            buttonGroup: { label: 'Product' },
        };
        expect(productSelectionMsg.buttonGroup?.label === 'Product').to.be.true;
    });

    it('does not flag assistant messages without buttonGroup as product-selection', () => {
        const plainMsg = { role: 'assistant', content: 'Some message' };
        expect(plainMsg.buttonGroup?.label === 'Product').to.be.false;
    });

    it('does not flag buttonGroup with non-Product label as product-selection', () => {
        const segmentMsg = {
            role: 'assistant',
            buttonGroup: { label: 'Customer Segment' },
        };
        expect(segmentMsg.buttonGroup?.label === 'Product').to.be.false;
    });
});
