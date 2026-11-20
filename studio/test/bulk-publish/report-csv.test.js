import { expect } from '@open-wc/testing';
import { toReportCsv } from '../../src/bulk-publish/csv.js';

const row = (overrides = {}) => ({
    path: '/content/dam/mas/acom/en_US/card',
    id: 'secret-id',
    type: 'item',
    locale: 'en_US',
    status: 'live',
    reason: '',
    aemStatus: 'PUBLISHED',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-02T00:00:00.000Z',
    projectPublishedAt: '2026-01-03T00:00:00.000Z',
    modifiedAfterPublish: false,
    ...overrides,
});

const report = (rows) => ({
    generatedAt: '2026-01-04T00:00:00.000Z',
    projectPublishedAt: '2026-01-03T00:00:00.000Z',
    summary: { total: rows.length, live: 1, failed: 1, notLive: 0, reportedPublished: 113, reportedTotal: 114 },
    missingIndexes: ['/content/dam/mas/acom/en_US/dictionary/index'],
    rows,
});

describe('toReportCsv', () => {
    it('writes the summary counts and one data line per row', () => {
        const lines = toReportCsv(report([row(), row({ path: '/b', status: 'failed', reason: 'not-found' })])).split('\n');
        expect(lines).to.include('total,2');
        expect(lines).to.include('live,1');
        expect(lines).to.include('failed,1');
        expect(lines).to.include('not_live,0');
        expect(lines).to.include('reported_published,113');
        expect(lines).to.include('reported_total,114');
        expect(lines).to.include('missing_placeholder_indexes,acom / en_US / dictionary / index');
        const header = lines.indexOf(
            'fragment,title,type,locale,status,reason,aem_status,modified_at,published_at,project_published_at,modified_after_publish',
        );
        expect(lines.slice(header + 1).filter(Boolean)).to.have.length(2);
    });

    it('escapes commas and quotes', () => {
        const csv = toReportCsv(report([row({ path: '/a,"b"' })]));
        expect(csv).to.include('"/a,""b"""');
    });

    describe('human readable fragment and title', () => {
        const cardRow = (overrides = {}) =>
            row({
                path: '/content/dam/mas/sandbox/en_US/photoshop-card',
                title: 'Fragment title',
                labelSource: {
                    title: 'Fragment title',
                    model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                    tags: [
                        { id: 'mas:customer_segment/individual', title: 'Individual' },
                        { id: 'mas:market_segment/com', title: 'com' },
                        { id: 'mas:product_code/phsp', title: 'Photoshop' },
                    ],
                    fields: [
                        { name: 'variant', values: ['catalog'] },
                        { name: 'cardTitle', values: ['Photoshop card'] },
                    ],
                },
                ...overrides,
            });
        const dataLine = (csv) => csv.split('\n').filter(Boolean).pop();

        it('writes the Studio author path for a card instead of the internal path', () => {
            const line = dataLine(toReportCsv(report([cardRow()])));
            expect(line).to.include('SANDBOX / merch-card / Catalog / Individual / com / Photoshop');
            expect(line).to.not.include('/content/dam/mas');
        });

        it('writes the card title in its own column', () => {
            expect(dataLine(toReportCsv(report([cardRow()])))).to.include(',Photoshop card,');
        });

        it('falls back to the readable path without the dam root for rows without a label source', () => {
            const line = dataLine(
                toReportCsv(report([row({ path: '/content/dam/mas/acom/en_US/dictionary/some-key', title: 'some-key' })])),
            );
            expect(line.startsWith('acom / en_US / dictionary / some-key,some-key,')).to.equal(true);
        });
    });

    it('does not write fields outside the report columns', () => {
        expect(toReportCsv(report([row()]))).to.not.include('secret-id');
    });
});
