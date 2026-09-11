import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeRowsAsXlsx } from '../pzn-tags-locale-to-country/xlsx-writer.mjs';
import {
    studioLink,
    unescapeXml,
    readZipEntry,
    sheetRows,
    recordsOf,
    expand,
    linksFor,
    outputPathFor,
} from '../pzn-tags-locale-to-country/variation-links.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('../pzn-tags-locale-to-country/variation-links.mjs', import.meta.url));
const DEFLATE_METHOD = 8;
const FIRST_ENTRY_METHOD_OFFSET = 8;

function withTempDir(fn) {
    const dir = mkdtempSync(join(tmpdir(), 'variation-links-'));
    try {
        return fn(dir);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

test('studioLink: builds a studio content URL from the surface and variation id', () => {
    assert.equal(
        studioLink({ surface: 'acom', variationId: 'id-1' }),
        'https://mas.adobe.com/studio.html#page=content&path=acom&query=id-1',
    );
});

test('unescapeXml: decodes amp, lt, gt, quot, apos, and numeric apostrophe entities', () => {
    assert.equal(unescapeXml('a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos; &#39;f&#39;'), `a & b <c> "d" 'e' 'f'`);
});

test('unescapeXml: text with no entities is returned unchanged', () => {
    assert.equal(unescapeXml('plain text'), 'plain text');
});

test('readZipEntry: returns the text of a stored (uncompressed) entry', () => {
    const buffer = writeRowsAsXlsx(['col'], [['value']]);
    const xml = readZipEntry(buffer, 'xl/worksheets/sheet1.xml');
    assert.match(xml, /<t[^>]*>value<\/t>/);
});

test('readZipEntry: throws when the entry is not found', () => {
    const buffer = writeRowsAsXlsx(['col'], [['value']]);
    assert.throws(() => readZipEntry(buffer, 'xl/worksheets/sheet2.xml'), /entry xl\/worksheets\/sheet2\.xml not found/);
});

test('readZipEntry: throws when the entry is deflated rather than stored', () => {
    const buffer = writeRowsAsXlsx(['col'], [['value']]);
    buffer.writeUInt16LE(DEFLATE_METHOD, FIRST_ENTRY_METHOD_OFFSET);
    assert.throws(
        () => readZipEntry(buffer, '[Content_Types].xml'),
        /is compressed; only reports written by xlsx-writer\.mjs are supported/,
    );
});

test('sheetRows: maps each row to a column-ref -> text object', () => {
    const buffer = writeRowsAsXlsx(['rule', 'variationId'], [['LOCALE_TO_COUNTRY', 'id-1']]);
    const xml = readZipEntry(buffer, 'xl/worksheets/sheet1.xml');
    const rows = sheetRows(xml);
    assert.deepEqual(rows, [
        { A: 'rule', B: 'variationId' },
        { A: 'LOCALE_TO_COUNTRY', B: 'id-1' },
    ]);
});

test('sheetRows: a self-closing empty cell reads as an empty string', () => {
    const buffer = writeRowsAsXlsx(['col'], [[null]]);
    const xml = readZipEntry(buffer, 'xl/worksheets/sheet1.xml');
    const rows = sheetRows(xml);
    assert.equal(rows[1].A, '');
});

test('recordsOf: reads an .xlsx report into header-keyed records', () => {
    withTempDir((dir) => {
        const filePath = join(dir, 'report.xlsx');
        writeFileSync(
            filePath,
            writeRowsAsXlsx(
                ['rule', 'variationId'],
                [
                    ['LOCALE_TO_COUNTRY', 'id-1'],
                    ['NOOP', 'id-2'],
                ],
            ),
        );
        assert.deepEqual(recordsOf(filePath), [
            { rule: 'LOCALE_TO_COUNTRY', variationId: 'id-1' },
            { rule: 'NOOP', variationId: 'id-2' },
        ]);
    });
});

test('expand: a single file target is returned as-is', () => {
    withTempDir((dir) => {
        const filePath = join(dir, 'report.xlsx');
        writeFileSync(filePath, writeRowsAsXlsx(['col'], []));
        assert.deepEqual(expand(filePath), [filePath]);
    });
});

test('expand: a directory is filtered to only .xlsx files, .csv is ignored', () => {
    withTempDir((dir) => {
        writeFileSync(join(dir, 'a.xlsx'), writeRowsAsXlsx(['col'], []));
        writeFileSync(join(dir, 'b.csv'), 'col\nvalue\n');
        writeFileSync(join(dir, 'notes.txt'), 'ignore me');
        assert.deepEqual(expand(dir), [join(dir, 'a.xlsx')]);
    });
});

test('linksFor: excludes NOOP rows and rows without a variationId', () => {
    const records = [
        { surface: 'acom', rule: 'LOCALE_TO_COUNTRY', variationId: 'id-1' },
        { surface: 'acom', rule: 'NOOP', variationId: 'id-2' },
        { surface: 'acom', rule: 'LOCALE_TO_COUNTRY', variationId: '' },
    ];
    assert.deepEqual(linksFor(records), ['https://mas.adobe.com/studio.html#page=content&path=acom&query=id-1']);
});

test('linksFor: each link carries the row surface, so acom-dc rows point at path=acom-dc', () => {
    const records = [{ surface: 'acom-dc', rule: 'UMBRELLA', variationId: 'id-3' }];
    assert.deepEqual(linksFor(records), ['https://mas.adobe.com/studio.html#page=content&path=acom-dc&query=id-3']);
});

test('cli: writes a sibling .txt holding one link per non-NOOP row', () => {
    withTempDir((dir) => {
        const filePath = join(dir, 'ACOM-31-08.xlsx');
        writeFileSync(
            filePath,
            writeRowsAsXlsx(
                ['surface', 'rule', 'variationId'],
                [
                    ['acom', 'LOCALE_TO_COUNTRY', 'id-1'],
                    ['acom', 'NOOP', 'id-2'],
                    ['acom-dc', 'UMBRELLA', 'id-3'],
                ],
            ),
        );
        execFileSync(process.execPath, [SCRIPT_PATH, filePath]);
        assert.equal(
            readFileSync(join(dir, 'ACOM-31-08.txt'), 'utf8'),
            'https://mas.adobe.com/studio.html#page=content&path=acom&query=id-1\n' +
                'https://mas.adobe.com/studio.html#page=content&path=acom-dc&query=id-3\n',
        );
    });
});

test('outputPathFor: replaces the extension with .txt, keeping the same directory', () => {
    assert.equal(outputPathFor('/tmp/reports/ACOM-31-08.xlsx'), '/tmp/reports/ACOM-31-08.txt');
});
