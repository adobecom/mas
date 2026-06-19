const { expect } = require('chai');
const {
    HEADERS,
    parseJobIdParam,
    rowKey,
    flattenResultsToRows,
    filterResultsByUserCsv,
    toCsv,
    fromCsv,
    buildResultRowKeys,
} = require('../../src/bulk-edit/csv.js');

describe('bulk-edit/csv: parseJobIdParam', () => {
    it('detects a .csv suffix', () => {
        expect(parseJobIdParam('abc123.csv')).to.deep.equal({ jobId: 'abc123', wantsCsv: true });
    });
    it('returns wantsCsv false for a plain jobId', () => {
        expect(parseJobIdParam('abc123def')).to.deep.equal({ jobId: 'abc123def', wantsCsv: false });
    });
});

describe('bulk-edit/csv: flattenResultsToRows', () => {
    it('emits one row per match', () => {
        const rows = flattenResultsToRows([
            {
                id: 'frag-1',
                path: '/content/dam/mas/acom/en_US/foo',
                locale: 'en_US',
                status: 'PUBLISHED',
                etag: 'e1',
                matches: [
                    { field: 'subtitle', value: 'school sale' },
                    { field: 'tags', value: 'mas:plan_type/abm' },
                ],
            },
        ]);
        expect(rows).to.have.lengthOf(2);
        expect(rows[0]).to.deep.equal({
            fragment_id: 'frag-1',
            path: '/content/dam/mas/acom/en_US/foo',
            locale: 'en_US',
            field: 'subtitle',
            find: 'school sale',
            replace: '',
            etag: 'e1',
            status: 'PUBLISHED',
        });
    });
});

describe('bulk-edit/csv: filterResultsByUserCsv', () => {
    const results = [
        {
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'e1',
            status: 'PUBLISHED',
            matches: [
                { field: 'subtitle', value: 'school' },
                { field: 'tags', value: 'tag-a' },
            ],
        },
        {
            id: 'b',
            path: '/p/b',
            locale: 'en_US',
            etag: 'e2',
            status: 'PUBLISHED',
            matches: [{ field: 'subtitle', value: 'academy' }],
        },
    ];

    it('keeps only matches present in the uploaded rows', () => {
        const userRows = [
            {
                fragment_id: 'a',
                field: 'subtitle',
                find: 'school',
            },
        ];
        const filtered = filterResultsByUserCsv(results, userRows);
        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].id).to.equal('a');
        expect(filtered[0].matches).to.deep.equal([{ field: 'subtitle', value: 'school' }]);
    });

    it('returns all results when userRows is empty', () => {
        expect(filterResultsByUserCsv(results, [])).to.deep.equal(results);
    });
});

describe('bulk-edit/csv: round-trip', () => {
    it('serializes and parses rows with quoted values', () => {
        const rows = [
            {
                fragment_id: 'f1',
                path: '/p/a',
                locale: 'en_US',
                field: 'subtitle',
                find: 'say "hello", world',
                replace: 'hi',
                etag: 'e1',
                status: 'PUBLISHED',
            },
        ];
        const text = toCsv(rows);
        expect(text.split('\n')[0]).to.equal(HEADERS.join(','));
        expect(fromCsv(text)).to.deep.equal(rows);
    });

    it('rejects unknown headers', () => {
        expect(() => fromCsv('bad,headers\n1,2')).to.throw(/header/i);
    });
});

describe('bulk-edit/csv: buildResultRowKeys', () => {
    it('collects keys from all matches in results', () => {
        const keys = buildResultRowKeys([
            {
                id: 'a',
                matches: [{ field: 'subtitle', value: 'school' }],
            },
        ]);
        expect(keys.has(rowKey({ fragment_id: 'a', field: 'subtitle', find: 'school' }))).to.equal(true);
    });
});
