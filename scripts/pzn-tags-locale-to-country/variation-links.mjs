/**
 * Turns a diff report (.xlsx written by xlsx-writer.mjs) into a list of MAS Studio links —
 * one per row whose `rule` is not NOOP. Each report gets a sibling .txt file with the same
 * base name.
 *
 * Usage: node variation-links.mjs tmp/ACOM-31-08.xlsx [more files or directories...]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const STUDIO_LINK = 'https://mas.adobe.com/studio.html#page=content&path=acom&query=';
const SKIPPED_RULE = 'NOOP';

function unescapeXml(text) {
    return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (match, entity) => {
        switch (entity) {
            case 'amp':
                return '&';
            case 'lt':
                return '<';
            case 'gt':
                return '>';
            case 'quot':
                return '"';
            default:
                return "'";
        }
    });
}

function readZipEntry(buffer, entryName) {
    for (let offset = 0; offset < buffer.length - 4; offset += 1) {
        if (buffer.readUInt32LE(offset) !== 0x04034b50) continue;
        const method = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const nameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);
        const dataStart = offset + 30 + nameLength + extraLength;
        const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLength);
        if (name !== entryName) continue;
        const data = buffer.subarray(dataStart, dataStart + compressedSize);
        return method === 0 ? data.toString('utf8') : inflateRawSync(data).toString('utf8');
    }
    throw new Error(`entry ${entryName} not found`);
}

function sheetRows(xml) {
    return [...xml.matchAll(/<row[^>]*>(.*?)<\/row>/g)].map(([, row]) => {
        const cells = {};
        for (const [, ref, body] of row.matchAll(/<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>(.*?)<\/c>)/g)) {
            const text = /<t[^>]*>(.*?)<\/t>/.exec(body ?? '');
            cells[ref] = text ? unescapeXml(text[1]) : '';
        }
        return cells;
    });
}

function recordsOf(filePath) {
    const rows = sheetRows(readZipEntry(readFileSync(filePath), 'xl/worksheets/sheet1.xml'));
    const [header, ...body] = rows;
    const columns = Object.entries(header).map(([ref, name]) => [name, ref]);
    return body.map((cells) => Object.fromEntries(columns.map(([name, ref]) => [name, cells[ref] ?? ''])));
}

function expand(target) {
    if (!statSync(target).isDirectory()) return [target];
    return readdirSync(target)
        .filter((name) => /\.xlsx$/i.test(name))
        .map((name) => join(target, name));
}

const targets = process.argv.slice(2).flatMap((arg) => expand(resolve(arg)));
if (!targets.length) {
    console.error('usage: node variation-links.mjs <report.xlsx|directory>...');
    process.exit(1);
}

for (const filePath of targets) {
    const records = recordsOf(filePath);
    const links = records
        .filter((record) => record.rule !== SKIPPED_RULE && record.variationId)
        .map((record) => `${STUDIO_LINK}${record.variationId}`);
    const outputPath = join(filePath.slice(0, -basename(filePath).length), `${basename(filePath, extname(filePath))}.txt`);
    writeFileSync(outputPath, `${links.join('\n')}\n`);
    console.log(`${basename(outputPath)}: ${links.length} links from ${records.length} rows`);
}
