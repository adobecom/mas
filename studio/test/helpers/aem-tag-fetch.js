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
