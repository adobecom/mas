export const emptyTagQuery = { hits: [] };

/**
 * @param {{ hits?: Array<{ path: string, name?: string, title?: string }> }} body
 * @returns {Response}
 */
export const asTagQueryResponse = (body) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

/**
 * @param {string} url
 * @returns {boolean}
 */
export const isAemTagQuery = (url) => String(url).includes('querybuilder.json') && String(url).includes('cq:Tag');

/**
 * Stubs fetch to serve in-memory AEM tag query results only.
 * @param {import('sinon').SinonSandbox} sandbox
 * @param {{ hits?: Array<{ path: string, name?: string, title?: string }> }} [body]
 */
export const stubAemTagQueryFetch = (sandbox, body = emptyTagQuery) => {
    sandbox.stub(window, 'fetch').callsFake(async (url) => {
        if (!isAemTagQuery(url)) {
            throw new Error(`Unexpected fetch in test: ${url}`);
        }
        return asTagQueryResponse(body);
    });
};

/**
 * Stubs aem.sites.cf.fragments.search as an async generator keyed by folder path.
 * Tests use this instead of getByPath because probePromoVariationsForFragment resolves variations via a single folder search rather than individual paths.
 * @param {{ stub: Function }} stubber - a sinon sandbox instance, or the sinon module itself
 * @param {Object<string, Array>} [itemsByFolder] - search results keyed by the requested folder path
 * @returns {import('sinon').SinonStub}
 */
export function makeSearchStub(stubber, itemsByFolder = {}) {
    return stubber.stub().callsFake(async function* (query) {
        yield itemsByFolder[query?.path] || [];
    });
}
