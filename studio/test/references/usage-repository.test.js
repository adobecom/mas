import { expect } from '@open-wc/testing';
import { fetchFragmentUsage, parseUsageResponse } from '../../src/references/usage-repository.js';

describe('usage-repository (4A prototype)', () => {
    const grafanaJson = (values) => ({
        results: {
            A: {
                frames: [
                    {
                        schema: {
                            fields: [{ name: 'api_key' }, { name: 'country' }, { name: 'count' }],
                        },
                        data: { values },
                    },
                ],
            },
        },
    });

    describe('parseUsageResponse', () => {
        it('parses columnar frames into usage rows', () => {
            const rows = parseUsageResponse(
                grafanaJson([
                    ['cc', 'express'],
                    ['US', 'FR'],
                    [1200, 34],
                ]),
            );
            expect(rows).to.have.lengthOf(2);
            expect(rows[0]).to.deep.equal({ apiKey: 'cc', country: 'US', count: 1200 });
            expect(rows[1]).to.deep.equal({ apiKey: 'express', country: 'FR', count: 34 });
        });

        it('returns an empty array when there are no frames', () => {
            expect(parseUsageResponse({ results: { A: { frames: [] } } })).to.deep.equal([]);
            expect(parseUsageResponse({})).to.deep.equal([]);
        });
    });

    describe('fetchFragmentUsage', () => {
        const ioBaseUrl = 'https://io.test/api/v1/web/MerchAtScaleStudio';

        it('posts the fragment id to the fragment-usage action and returns parsed usage', async () => {
            let capturedUrl;
            let capturedBody;
            const fetchImpl = async (url, opts) => {
                capturedUrl = url;
                capturedBody = JSON.parse(opts.body);
                return { ok: true, json: async () => grafanaJson([['cc'], ['US'], [500]]) };
            };
            const result = await fetchFragmentUsage('frag-1', { fetchImpl, ioBaseUrl });
            expect(capturedUrl).to.equal(`${ioBaseUrl}/fragment-usage`);
            expect(capturedBody).to.deep.equal({ fragmentId: 'frag-1' });
            expect(result.available).to.be.true;
            expect(result.rows).to.have.lengthOf(1);
            expect(result.totalCount).to.equal(500);
        });

        it('degrades to { available: false } when the proxy is unavailable (no token/CORS/404)', async () => {
            const fetchImpl = async () => ({ ok: false, status: 404 });
            expect(await fetchFragmentUsage('frag-1', { fetchImpl, ioBaseUrl })).to.deep.equal({ available: false });
        });

        it('degrades to { available: false } on a network error', async () => {
            const fetchImpl = async () => {
                throw new Error('Failed to fetch');
            };
            expect(await fetchFragmentUsage('frag-1', { fetchImpl, ioBaseUrl })).to.deep.equal({ available: false });
        });

        it('degrades to { available: false } when the io base url is not configured', async () => {
            const fetchImpl = async () => ({ ok: true, json: async () => grafanaJson([[], [], []]) });
            expect(await fetchFragmentUsage('frag-1', { fetchImpl })).to.deep.equal({ available: false });
        });

        it('degrades to { available: false } without a fragmentId', async () => {
            expect(await fetchFragmentUsage()).to.deep.equal({ available: false });
        });
    });
});
