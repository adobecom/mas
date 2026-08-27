import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeRowsAsXlsx } from '../pzn-tags-locale-to-country/xlsx-writer.mjs';

// Entries are written "stored" (no compression), so a minimal parser matching that fixed
// local-header layout is enough to pull each part's bytes back out for assertions.
function parseStoredZip(buffer) {
    const entries = [];
    let offset = 0;
    while (offset < buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
        const nameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);
        const size = buffer.readUInt32LE(offset + 18);
        const nameStart = offset + 30;
        const name = buffer.toString('utf8', nameStart, nameStart + nameLength);
        const dataStart = nameStart + nameLength + extraLength;
        entries.push({ name, data: buffer.subarray(dataStart, dataStart + size) });
        offset = dataStart + size;
    }
    return entries;
}

test('writeRowsAsXlsx: produces the five required OOXML parts, stored uncompressed', () => {
    const buffer = writeRowsAsXlsx(['A', 'B'], [['x', 'y']]);
    const entries = parseStoredZip(buffer);
    assert.deepEqual(
        entries.map((entry) => entry.name),
        ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/worksheets/sheet1.xml'],
    );
    const eocdOffset = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    assert.ok(eocdOffset > 0);
    assert.equal(buffer.readUInt16LE(eocdOffset + 10), entries.length);
});

test('writeRowsAsXlsx: header row is row 1, data rows start at row 2', () => {
    const buffer = writeRowsAsXlsx(['col'], [['first'], ['second']]);
    const [, , , , sheet] = parseStoredZip(buffer);
    const xml = sheet.data.toString('utf8');
    assert.match(xml, /<row r="1"><c r="A1"[^>]*><is><t[^>]*>col<\/t><\/is><\/c><\/row>/);
    assert.match(xml, /<row r="2"><c r="A2"[^>]*><is><t[^>]*>first<\/t><\/is><\/c><\/row>/);
    assert.match(xml, /<row r="3"><c r="A3"[^>]*><is><t[^>]*>second<\/t><\/is><\/c><\/row>/);
});

test('writeRowsAsXlsx: null, undefined, and empty-string cells render as self-closing inlineStr', () => {
    const buffer = writeRowsAsXlsx(['col'], [[null], [undefined], ['']]);
    const [, , , , sheet] = parseStoredZip(buffer);
    const xml = sheet.data.toString('utf8');
    assert.match(xml, /<c r="A2" t="inlineStr" \/>/);
    assert.match(xml, /<c r="A3" t="inlineStr" \/>/);
    assert.match(xml, /<c r="A4" t="inlineStr" \/>/);
});

test('writeRowsAsXlsx: array cell values are flattened to a comma-joined string', () => {
    const buffer = writeRowsAsXlsx(['tags'], [[['a', 'b', 'c']]]);
    const [, , , , sheet] = parseStoredZip(buffer);
    const xml = sheet.data.toString('utf8');
    assert.match(xml, /<t xml:space="preserve">a, b, c<\/t>/);
});

test('writeRowsAsXlsx: XML-significant characters are escaped in cell text', () => {
    const buffer = writeRowsAsXlsx(['col'], [[`<tag> & "quoted" 'value'`]]);
    const [, , , , sheet] = parseStoredZip(buffer);
    const xml = sheet.data.toString('utf8');
    assert.match(xml, /&lt;tag&gt; &amp; &quot;quoted&quot; &apos;value&apos;/);
});

test('writeRowsAsXlsx: column letters wrap from Z to AA past the 26th column', () => {
    const headers = Array.from({ length: 28 }, (_, index) => `h${index}`);
    const buffer = writeRowsAsXlsx(headers, []);
    const [, , , , sheet] = parseStoredZip(buffer);
    const xml = sheet.data.toString('utf8');
    assert.match(xml, /<c r="Z1"/);
    assert.match(xml, /<c r="AA1"/);
    assert.match(xml, /<c r="AB1"/);
});

test('writeRowsAsXlsx: custom sheet name is escaped and applied in workbook.xml', () => {
    const buffer = writeRowsAsXlsx(['col'], [], 'PZN "Report" & Co');
    const [, , workbook] = parseStoredZip(buffer);
    const xml = workbook.data.toString('utf8');
    assert.match(xml, /name="PZN &quot;Report&quot; &amp; Co"/);
});

test('writeRowsAsXlsx: default sheet name is "rows"', () => {
    const buffer = writeRowsAsXlsx(['col'], []);
    const [, , workbook] = parseStoredZip(buffer);
    assert.match(workbook.data.toString('utf8'), /name="rows"/);
});
