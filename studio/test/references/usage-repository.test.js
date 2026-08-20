import { expect } from '@open-wc/testing';
import {
    GRAFANA_DATASOURCE_UID,
    GRAFANA_ORG_ID,
    buildUsageQuery,
    fetchFragmentUsage,
    parseUsageResponse,
} from '../../src/references/usage-repository.js';

describe('usage-repository (4A prototype)', () => {
    describe('buildUsageQuery', () => {
        it('builds a ds/query body targeting the documented datasource and dimensions', () => {
            const body = buildUsageQuery('frag-1', { fromMs: 1000, toMs: 2000 });
            expect(body.from).to.equal('1000');
            expect(body.to).to.equal('2000');
            expect(body.queries).to.have.lengthOf(1);
            const [q] = body.queries;
            expect(q.datasource.uid).to.equal(GRAFANA_DATASOURCE_UID);
            expect(q.datasource.type).to.equal('grafana-clickhouse-datasource');
            expect(q.meta.orgId).to.equal(GRAFANA_ORG_ID);
            expect(q.rawSql).to.include("fragment_id = 'frag-1'");
            expect(q.rawSql).to.include('GROUP BY locale, api_key, country');
        });

        it('defaults the time window when not provided', () => {
            const body = buildUsageQuery('frag-1');
            expect(Number(body.from)).to.be.lessThan(Number(body.to));
        });

        it('throws when fragmentId is missing', () => {
            expect(() => buildUsageQuery()).to.throw('fragmentId is required');
        });
    });

    describe('parseUsageResponse', () => {
        const frame = {
            schema: {
                fields: [{ name: 'locale' }, { name: 'api_key' }, { name: 'country' }, { name: 'count' }],
            },
            data: {
                values: [
                    ['en_US', 'fr_FR'],
                    ['cc', 'express'],
                    ['US', 'FR'],
                    [1200, 34],
                ],
            },
        };

        it('parses columnar frames into usage rows', () => {
            const rows = parseUsageResponse({ results: { A: { frames: [frame] } } });
            expect(rows).to.have.lengthOf(2);
            expect(rows[0]).to.deep.equal({ locale: 'en_US', apiKey: 'cc', country: 'US', count: 1200 });
            expect(rows[1]).to.deep.equal({ locale: 'fr_FR', apiKey: 'express', country: 'FR', count: 34 });
        });

        it('returns an empty array when there are no frames', () => {
            expect(parseUsageResponse({ results: { A: { frames: [] } } })).to.deep.equal([]);
            expect(parseUsageResponse({})).to.deep.equal([]);
        });
    });

    describe('fetchFragmentUsage', () => {
        it('returns available usage rows on a successful proxy response', async () => {
            const fetchImpl = async () => ({
                ok: true,
                json: async () => ({
                    results: {
                        A: {
                            frames: [
                                {
                                    schema: {
                                        fields: [
                                            { name: 'locale' },
                                            { name: 'api_key' },
                                            { name: 'country' },
                                            { name: 'count' },
                                        ],
                                    },
                                    data: { values: [['en_US'], ['cc'], ['US'], [500]] },
                                },
                            ],
                        },
                    },
                }),
            });
            const result = await fetchFragmentUsage('frag-1', { fetchImpl });
            expect(result.available).to.be.true;
            expect(result.rows).to.have.lengthOf(1);
            expect(result.totalCount).to.equal(500);
        });

        it('degrades to { available: false } when the proxy is unavailable (no token/CORS/404)', async () => {
            const fetchImpl = async () => ({ ok: false, status: 404 });
            expect(await fetchFragmentUsage('frag-1', { fetchImpl })).to.deep.equal({ available: false });
        });

        it('degrades to { available: false } on a network error', async () => {
            const fetchImpl = async () => {
                throw new Error('Failed to fetch');
            };
            expect(await fetchFragmentUsage('frag-1', { fetchImpl })).to.deep.equal({ available: false });
        });

        it('degrades to { available: false } without a fragmentId', async () => {
            expect(await fetchFragmentUsage()).to.deep.equal({ available: false });
        });
    });
});
