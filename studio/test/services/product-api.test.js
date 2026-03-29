import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

let fetchProducts;
let fetchProductDetail;
let mcpClientModule;

describe('product-api', () => {
    let sandbox;
    let executeMCPToolStub;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mcpClientModule = await import('../../src/services/mcp-client.js');
        executeMCPToolStub = sandbox.stub(mcpClientModule, 'executeMCPTool');

        const module = await import('../../src/services/product-api.js');
        fetchProducts = module.fetchProducts;
        fetchProductDetail = module.fetchProductDetail;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('fetchProducts', () => {
        it('calls executeMCPTool with list_products', async () => {
            const mockResult = { products: [{ name: 'Photoshop' }] };
            executeMCPToolStub.resolves(mockResult);

            const result = await fetchProducts();

            expect(executeMCPToolStub.calledOnce).to.be.true;
            expect(executeMCPToolStub.firstCall.args[0]).to.equal('list_products');
            expect(executeMCPToolStub.firstCall.args[1]).to.deep.equal({});
            expect(result).to.deep.equal(mockResult);
        });

        it('propagates errors from executeMCPTool', async () => {
            executeMCPToolStub.rejects(new Error('MCP server error'));

            try {
                await fetchProducts();
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('MCP server error');
            }
        });
    });

    describe('fetchProductDetail', () => {
        it('calls executeMCPTool with get-product-detail and arrangementCode', async () => {
            const mockResult = { product: { name: 'Photoshop' } };
            executeMCPToolStub.resolves(mockResult);

            const result = await fetchProductDetail('abc-123');

            expect(executeMCPToolStub.calledOnce).to.be.true;
            expect(executeMCPToolStub.firstCall.args[0]).to.equal('get-product-detail');
            expect(executeMCPToolStub.firstCall.args[1]).to.deep.equal({ arrangementCode: 'abc-123' });
            expect(result).to.deep.equal(mockResult);
        });

        it('propagates errors from executeMCPTool', async () => {
            executeMCPToolStub.rejects(new Error('Product not found'));

            try {
                await fetchProductDetail('missing-code');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Product not found');
            }
        });
    });
});
