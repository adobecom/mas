import { expect } from '@open-wc/testing';
import { toCsv } from '../../src/bulk-publish/csv.js';

describe('toCsv', () => {
    it('emits header row followed by data rows', () => {
        const details = [
            { path: '/content/dam/mas/a/en_US/card', status: 'published', reason: null, workflowInstanceId: 'wf-1' },
            { path: '/content/dam/mas/a/fr_FR/card', status: 'failed', reason: 'not-found', workflowInstanceId: null },
        ];
        const csv = toCsv(details, { published_at: '2026-04-23T00:00:00.000Z' });
        const lines = csv.trim().split('\n');
        expect(lines[0]).to.equal('url,resolved_path,locale,status,reason,workflow_instance_id,published_at');
        expect(lines).to.have.lengthOf(3);
        expect(lines[1]).to.include('published');
        expect(lines[1]).to.include('/content/dam/mas/a/en_US/card');
        expect(lines[2]).to.include('not-found');
    });

    it('quotes fields containing commas or quotes', () => {
        const csv = toCsv([
            {
                url: 'https://a, b',
                path: '/x',
                locale: 'en_US',
                status: 'published',
                reason: 'he said "hi"',
                workflowInstanceId: null,
            },
        ]);
        expect(csv).to.include('"https://a, b"');
        expect(csv).to.include('"he said ""hi"""');
    });

    it('renders empty string for null/undefined values', () => {
        const csv = toCsv([{ path: '/p', status: 'published', reason: null, workflowInstanceId: undefined }]);
        const row = csv.split('\n')[1];
        expect(row.split(',').slice(4, 6).join(',')).to.equal(',');
    });

    it('returns header only when details is empty', () => {
        expect(toCsv([])).to.equal('url,resolved_path,locale,status,reason,workflow_instance_id,published_at\n');
    });
});
