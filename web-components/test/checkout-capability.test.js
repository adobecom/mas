import { expect } from '@esm-bundle/chai';
import '../dist/commerce.js';
import { decisionCases } from '../../checkout/test/fixtures/decisions.js';

describe('bundled checkout compatibility capability', () => {
    it('exposes every V1 decision through the deployed commerce entry point', () => {
        const service = document.createElement('mas-commerce-service');
        for (const { id, decision, input, expected } of decisionCases) {
            expect(
                service.checkoutDecisionsV1[decision](input),
                id,
            ).to.deep.equal(expected);
        }
    });
});
