const { expect } = require('chai');
const { buildResult, FAILURES_CAP } = require('../../src/bulk-publish/summary.js');

describe('bulk-publish/summary.js — buildResult', () => {
    it('counts published, failed, and aggregates reasons', () => {
        const result = buildResult({
            details: [
                { path: '/a', status: 'published' },
                { path: '/b', status: 'published' },
                { path: '/c', status: 'failed', reason: 'error-invalid' },
                { path: '/d', status: 'failed', reason: 'error-invalid' },
                { path: '/e', status: 'failed', reason: 'error-forbidden' },
            ],
            startedAt: '2026-06-04T00:00:00.000Z',
            finishedAt: '2026-06-04T00:01:00.000Z',
        });

        expect(result.total).to.equal(5);
        expect(result.published).to.equal(2);
        expect(result.failed).to.equal(3);
        expect(result.reasons).to.deep.equal({ 'error-invalid': 2, 'error-forbidden': 1 });
    });

    it('caps failures at FAILURES_CAP and flags truncation', () => {
        const details = Array.from({ length: FAILURES_CAP + 25 }, (val, i) => ({
            path: `/f${i}`,
            status: 'failed',
            reason: 'not-localized',
        }));
        const result = buildResult({ details, startedAt: 'a', finishedAt: 'b' });

        expect(result.failed).to.equal(FAILURES_CAP + 25);
        expect(result.failures).to.have.length(FAILURES_CAP);
        expect(result.failuresTruncated).to.be.true;
    });

    it('lists not-localized failures with their reason', () => {
        const result = buildResult({
            details: [
                { path: '/a', status: 'published' },
                { path: '/x', status: 'failed', reason: 'not-localized' },
                { path: '/y', status: 'failed', reason: 'not-localized' },
            ],
            startedAt: 'a',
            finishedAt: 'b',
        });
        expect(result.failed).to.equal(2);
        expect(result.failures).to.deep.include({ path: '/x', reason: 'not-localized' });
        expect(result.reasons['not-localized']).to.equal(2);
    });
});
