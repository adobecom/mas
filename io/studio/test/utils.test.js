const { expect } = require('chai');
const {
    parseRawBody,
    parseCsvUploadBody,
    extractCsvFromMultipart,
    isCsvContentType,
    isMultipartContentType,
    isCsvUpload,
} = require('../utils.js');

const sampleCsv = 'fragment_id,path,locale,field,find,replace,etag,status\na,/p/a,en_US,subtitle,school,,e1,PUBLISHED\n';

describe('utils: parseRawBody', () => {
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

describe('utils: isCsvContentType', () => {
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

describe('utils: multipart CSV upload', () => {
    const boundary = '----BulkEditFormBoundary';
    const multipartBody =
        `------BulkEditFormBoundary\r\n` +
        `Content-Disposition: form-data; name="file"; filename="demo.csv"\r\n` +
        `Content-Type: text/csv\r\n\r\n` +
        `${sampleCsv}\r\n` +
        `------BulkEditFormBoundary--\r\n`;

    it('detects multipart/form-data', () => {
        expect(isMultipartContentType({ __ow_headers: { 'content-type': 'multipart/form-data; boundary=----BulkEditFormBoundary' } })).to.equal(true);
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
