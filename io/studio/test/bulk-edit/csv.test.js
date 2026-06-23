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
    buildCsvRowsFromFindResults,
    buildReplaceRowsFromFindResults,
    parseRawBody,
    parseCsvUploadBody,
    extractCsvFromMultipart,
    isCsvContentType,
    isMultipartContentType,
    isCsvUpload,
} = require('../../src/bulk-edit/csv.js');

const sampleCsv = `${HEADERS.join(',')}\na,/p/a,en_US,subtitle,school,e1,PUBLISHED\n`;
const legacyHeader = 'fragment_id,path,locale,field,find,replace,etag,status';

describe('bulk-edit/csv: parseRawBody', () => {
    it('returns an empty string when __ow_body is missing', () => {
        expect(parseRawBody({})).to.equal('');
    });
    it('returns plain text bodies as-is', () => {
        const csv = 'fragment_id,path\na,/p/a\n';
        expect(parseRawBody({ __ow_body: csv })).to.equal(csv);
    });
    it('decodes base64-encoded bodies', () => {
        const csv = 'fragment_id,path\na,/p/a\n';
        expect(parseRawBody({ __ow_body: Buffer.from(csv, 'utf8').toString('base64') })).to.equal(csv);
    });
});

describe('bulk-edit/csv: isCsvContentType', () => {
    it('detects text/csv', () => {
        expect(isCsvContentType({ __ow_headers: { 'content-type': 'text/csv' } })).to.equal(true);
    });
    it('detects text/csv with charset', () => {
        expect(isCsvContentType({ __ow_headers: { 'content-type': 'text/csv; charset=utf-8' } })).to.equal(true);
    });
    it('returns false for application/json', () => {
        expect(isCsvContentType({ __ow_headers: { 'content-type': 'application/json' } })).to.equal(false);
    });
});

describe('bulk-edit/csv: multipart upload', () => {
    const boundary = '----BulkEditFormBoundary';
    const multipartBody =
        `------BulkEditFormBoundary\r\n` +
        `Content-Disposition: form-data; name="file"; filename="demo.csv"\r\n` +
        `Content-Type: text/csv\r\n\r\n` +
        `${sampleCsv}\r\n` +
        `------BulkEditFormBoundary--\r\n`;

    it('detects multipart/form-data', () => {
        expect(
            isMultipartContentType({
                __ow_headers: { 'content-type': 'multipart/form-data; boundary=----BulkEditFormBoundary' },
            }),
        ).to.equal(true);
    });
    it('isCsvUpload accepts multipart', () => {
        expect(isCsvUpload({ __ow_headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } })).to.equal(true);
    });
    it('extracts CSV from a multipart body', () => {
        const csv = extractCsvFromMultipart(multipartBody, `multipart/form-data; boundary=${boundary}`);
        expect(csv).to.equal(sampleCsv.trim());
    });
    it('parseCsvUploadBody reads CSV from multipart params', () => {
        const csv = parseCsvUploadBody({
            __ow_body: multipartBody,
            __ow_headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        });
        expect(csv).to.equal(sampleCsv.trim());
    });
});

describe('bulk-edit/csv: parseJobIdParam', () => {
    it('detects a .csv suffix', () => {
        expect(parseJobIdParam('abc123.csv')).to.deep.equal({ jobId: 'abc123', wantsCsv: true, wantsJson: false });
    });
    it('detects a .json suffix', () => {
        expect(parseJobIdParam('abc123.json')).to.deep.equal({ jobId: 'abc123', wantsCsv: false, wantsJson: true });
    });
    it('returns wantsCsv and wantsJson false for a plain jobId', () => {
        expect(parseJobIdParam('abc123def')).to.deep.equal({ jobId: 'abc123def', wantsCsv: false, wantsJson: false });
    });
});

describe('bulk-edit/csv: flattenResultsToRows', () => {
    it('emits one row per match', () => {
        const rows = flattenResultsToRows([
            {
                id: 'frag-1',
                path: '/content/dam/mas/sandbox/en_US/foo',
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
            path: '/content/dam/mas/sandbox/en_US/foo',
            locale: 'en_US',
            field: 'subtitle',
            find: 'school sale',
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

    it('accepts legacy scope names in uploaded rows', () => {
        const userRows = [
            {
                fragment_id: 'a',
                field: 'productDescription',
                find: 'school',
            },
        ];
        const productResults = [
            {
                id: 'a',
                path: '/p/a',
                locale: 'en_US',
                etag: 'e1',
                status: 'PUBLISHED',
                matches: [{ field: 'subtitle', value: 'school' }],
            },
        ];
        const filtered = filterResultsByUserCsv(productResults, userRows);
        expect(filtered).to.have.lengthOf(0);

        const cardResults = [
            {
                id: 'a',
                path: '/p/a',
                locale: 'en_US',
                etag: 'e1',
                status: 'PUBLISHED',
                matches: [{ field: 'cardTitle', value: 'Adobe Firefly Pro' }],
            },
        ];
        const cardUserRows = [
            {
                fragment_id: 'a',
                field: 'productDescription',
                find: 'Adobe Firefly Pro',
            },
        ];
        expect(filterResultsByUserCsv(cardResults, cardUserRows)).to.deep.equal(cardResults);
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

    it('rejects legacy headers that include replace', () => {
        expect(() => fromCsv(`${legacyHeader}\na,/p/a,en_US,subtitle,school,x,e1,PUBLISHED\n`)).to.throw(/header/i);
    });

    it('neutralizes leading formula characters and reverses them on parse', () => {
        const rows = [
            {
                fragment_id: 'f1',
                path: '/p/a',
                locale: 'en_US',
                field: 'subtitle',
                find: '=1+2',
                etag: 'e1',
                status: 'PUBLISHED',
            },
        ];
        const text = toCsv(rows);
        const dataLine = text.split('\n')[1];
        expect(dataLine).to.include("'=1+2");
        expect(fromCsv(text)).to.deep.equal(rows);
    });
});

describe('bulk-edit/csv: buildCsvRowsFromFindResults', () => {
    const items = [
        {
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'e1',
            status: 'PUBLISHED',
            matches: [{ field: 'subtitle', value: 'school offer' }],
        },
    ];

    it('returns flattened rows without replace', () => {
        const rows = buildCsvRowsFromFindResults(items, null);
        expect(rows[0]).to.not.have.property('replace');
        expect(rows[0].find).to.equal('school offer');
    });

    it('filters to uploaded row scope', () => {
        const allItems = [
            ...items,
            {
                id: 'b',
                path: '/p/b',
                locale: 'en_US',
                etag: 'e2',
                status: 'PUBLISHED',
                matches: [{ field: 'subtitle', value: 'academy' }],
            },
        ];
        const userRows = [{ fragment_id: 'a', field: 'subtitle', find: 'school offer' }];
        const rows = buildCsvRowsFromFindResults(allItems, userRows);
        expect(rows).to.have.lengthOf(1);
        expect(rows[0].fragment_id).to.equal('a');
    });
});

describe('bulk-edit/csv: buildReplaceRowsFromFindResults', () => {
    const items = [
        {
            id: 'a',
            path: '/p/a',
            locale: 'en_US',
            etag: 'e1',
            status: 'PUBLISHED',
            matches: [{ field: 'subtitle', value: 'school offer' }],
        },
    ];

    it('computes replace from find params for replace execution', () => {
        const rows = buildReplaceRowsFromFindResults(items, null, { find: 'school', replace: 'campus', matchCase: false });
        expect(rows[0].replace).to.equal('campus offer');
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

    it('includes legacy scope aliases for Odin field matches', () => {
        const keys = buildResultRowKeys([
            {
                id: 'a',
                matches: [{ field: 'cardTitle', value: 'Adobe Firefly Pro' }],
            },
        ]);
        expect(keys.has(rowKey({ fragment_id: 'a', field: 'cardTitle', find: 'Adobe Firefly Pro' }))).to.equal(true);
        expect(keys.has(rowKey({ fragment_id: 'a', field: 'productDescription', find: 'Adobe Firefly Pro' }))).to.equal(true);
    });
});
