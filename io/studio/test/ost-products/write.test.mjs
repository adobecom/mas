import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { expectedProducts } from './ost-products.expected.mjs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const aosResponse = JSON.parse(readFileSync(join(__dirname, '../mocks/aos-response.json'), 'utf8'));

// Mock fetch globally
global.fetch = sinon.stub();

describe('getProducts', () => {
    let writeModule;

    beforeEach(async () => {
        // Reset fetch stub
        global.fetch.reset();

        // Mock fetch to return aos-response.json only once, then empty array
        let firstCall = true;
        global.fetch.callsFake(() => {
            if (firstCall) {
                firstCall = false;
                return Promise.resolve({
                    json: () => Promise.resolve(aosResponse),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve([]),
            });
        });

        // Import the module
        writeModule = require('../../src/ost-products/write.js');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should fetch and combine products from different landscapes and locales', async () => {
        const params = {
            AOS_URL: 'https://mock-aos-url.com',
            AOS_API_KEY: 'mock-api-key',
        };

        const result = await writeModule.getProducts(params);

        // Verify fetch was called 5 times (2 landscapes * 3 locales + 1 for the empty array)
        expect(global.fetch.callCount).to.equal(7);

        // Compare result with expected output
        expect(result).to.deep.equal(expectedProducts);
    });

    it('should handle empty responses', async () => {
        // Mock fetch to return empty array
        global.fetch.resolves({
            json: () => Promise.resolve([]),
        });

        const params = {
            AOS_URL: 'https://mock-aos-url.com',
            AOS_API_KEY: 'mock-api-key',
        };

        const result = await writeModule.getProducts(params);
        expect(result).to.be.an('object');
        expect(Object.keys(result)).to.have.lengthOf(0);
    });
});
