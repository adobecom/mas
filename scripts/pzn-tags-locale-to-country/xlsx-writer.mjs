/**
 * Minimal, dependency-free OOXML (.xlsx) writer for a single flat sheet of rows. No compression
 * (zip "stored" method) — output is a few MB at most for this script's row counts, and skipping
 * deflate keeps this file self-contained with no new dependency for one report step.
 */

import { crc32 } from 'node:zlib';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            default:
                return '&apos;';
        }
    });
}

function cellText(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
}

// Excel/Sheets treat cells starting with =, +, -, @, tab, or CR as formulas — prefix with
// an apostrophe so downstream spreadsheet tools render the value as literal text.
function escapeFormulaInjection(text) {
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function columnLetter(index) {
    let n = index + 1;
    let letters = '';
    while (n > 0) {
        const remainder = (n - 1) % 26;
        letters = String.fromCharCode(65 + remainder) + letters;
        n = Math.floor((n - 1) / 26);
    }
    return letters;
}

function buildRowXml(rowIndex, values) {
    const cells = values
        .map((value, colIndex) => {
            const text = escapeFormulaInjection(cellText(value));
            const ref = `${columnLetter(colIndex)}${rowIndex}`;
            if (!text) return `<c r="${ref}" t="inlineStr" />`;
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
        })
        .join('');
    return `<row r="${rowIndex}">${cells}</row>`;
}

function buildSheetXml(headers, rows) {
    const headerRow = buildRowXml(1, headers);
    const dataRows = rows.map((row, index) => buildRowXml(index + 2, row)).join('');
    return `${XML_HEADER}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${headerRow}${dataRows}</sheetData></worksheet>`;
}

function buildWorkbookXml(sheetName) {
    return `${XML_HEADER}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1" /></sheets></workbook>`;
}

const WORKBOOK_RELS_XML = `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml" /></Relationships>`;

const ROOT_RELS_XML = `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml" /></Relationships>`;

const CONTENT_TYPES_XML = `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" /><Default Extension="xml" ContentType="application/xml" /><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" /><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" /></Types>`;

function dosDateTime() {
    // Fixed epoch (1980-01-01 00:00:00) — file timestamps carry no meaning for this report.
    return { time: 0, date: 0b0000000000100001 };
}

function buildZip(entries) {
    const { time, date } = dosDateTime();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const { name, data } of entries) {
        const nameBuffer = Buffer.from(name, 'utf8');
        const crc = crc32(data) >>> 0;

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(0, 8); // stored, no compression
        localHeader.writeUInt16LE(time, 10);
        localHeader.writeUInt16LE(date, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(data.length, 18);
        localHeader.writeUInt32LE(data.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);

        localParts.push(localHeader, nameBuffer, data);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(0, 10);
        centralHeader.writeUInt16LE(time, 12);
        centralHeader.writeUInt16LE(date, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(data.length, 20);
        centralHeader.writeUInt32LE(data.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt32LE(0, 36);
        centralHeader.writeUInt32LE(offset, 42);

        centralParts.push(centralHeader, nameBuffer);

        offset += localHeader.length + nameBuffer.length + data.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const centralDirectoryOffset = offset;

    const endRecord = Buffer.alloc(22);
    endRecord.writeUInt32LE(0x06054b50, 0);
    endRecord.writeUInt16LE(0, 4);
    endRecord.writeUInt16LE(0, 6);
    endRecord.writeUInt16LE(entries.length, 8);
    endRecord.writeUInt16LE(entries.length, 10);
    endRecord.writeUInt32LE(centralDirectory.length, 12);
    endRecord.writeUInt32LE(centralDirectoryOffset, 16);
    endRecord.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

/**
 * Writes a single-sheet .xlsx workbook. `rows` are arrays of cell values aligned to `headers`;
 * array cell values are flattened to a comma-joined string (mirrors the JSON report's arrays).
 */
export function writeRowsAsXlsx(headers, rows, sheetName = 'rows') {
    const entries = [
        { name: '[Content_Types].xml', data: Buffer.from(CONTENT_TYPES_XML, 'utf8') },
        { name: '_rels/.rels', data: Buffer.from(ROOT_RELS_XML, 'utf8') },
        { name: 'xl/workbook.xml', data: Buffer.from(buildWorkbookXml(sheetName), 'utf8') },
        { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(WORKBOOK_RELS_XML, 'utf8') },
        { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(buildSheetXml(headers, rows), 'utf8') },
    ];
    return buildZip(entries);
}
