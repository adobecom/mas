import { expect } from '@open-wc/testing';
import { buildSearchResultsCsv } from '../src/mas-operation-result.js';

describe('buildSearchResultsCsv', () => {
    const card = (over = {}) => ({
        id: 'id1',
        title: 'Card One',
        path: '/content/dam/mas/acom/en_US/card-one',
        variant: 'plans',
        status: 'MODIFIED',
        ...over,
    });

    it('starts with the column header row', () => {
        const csv = buildSearchResultsCsv([card()]);
        expect(csv.split('\n')[0]).to.equal('Title,Path,Template,Status,Locale,ID');
    });

    it('writes one row per card with template, status, and the locale read from the path', () => {
        const csv = buildSearchResultsCsv([card()]);
        expect(csv.split('\n')[1]).to.equal('Card One,/content/dam/mas/acom/en_US/card-one,plans,MODIFIED,en_US,id1');
    });

    it('quotes and escapes a title that contains a comma or quote', () => {
        const csv = buildSearchResultsCsv([card({ title: 'Plans, "Pro"' })]);
        expect(csv.split('\n')[1]).to.contain('"Plans, ""Pro"""');
    });

    it('skips cards that have no id', () => {
        const csv = buildSearchResultsCsv([card(), { title: 'no id' }]);
        expect(csv.split('\n')).to.have.lengthOf(2);
    });

    it('returns just the header for empty or non-array input', () => {
        const header = 'Title,Path,Template,Status,Locale,ID';
        expect(buildSearchResultsCsv([])).to.equal(header);
        expect(buildSearchResultsCsv(null)).to.equal(header);
    });

    it('neutralizes a formula-injection title so a spreadsheet treats it as text', () => {
        expect(buildSearchResultsCsv([card({ title: '=cmd' })]).split('\n')[1]).to.match(/^'=cmd,/);
    });

    it('neutralizes a leading @, +, or - as well', () => {
        const firstCell = (title) => buildSearchResultsCsv([card({ title })]).split('\n')[1];
        expect(firstCell('@x')).to.match(/^'@x,/);
        expect(firstCell('+x')).to.match(/^'\+x,/);
        expect(firstCell('-x')).to.match(/^'-x,/);
    });
});
