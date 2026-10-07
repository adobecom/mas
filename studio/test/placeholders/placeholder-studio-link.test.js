import { expect } from '@esm-bundle/chai';
import { buildPlaceholderStudioLink, buildPlaceholderStudioLinks } from '../../src/placeholders/placeholder-studio-link.js';

describe('placeholder-studio-link', () => {
    const origin = 'https://mas.adobe.com';

    describe('buildPlaceholderStudioLink', () => {
        it('builds the confirmed Studio deep link for a single placeholder', () => {
            const link = buildPlaceholderStudioLink({
                path: 'sandbox',
                locale: 'en_US',
                id: '9a75e22f-9c48-418d-8da3-687e8f635282',
                origin,
            });
            expect(link).to.equal(
                `${origin}/studio.html#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=9a75e22f-9c48-418d-8da3-687e8f635282`,
            );
        });

        it('percent-encodes the surface and locale context', () => {
            const link = buildPlaceholderStudioLink({
                path: 'special & surface',
                locale: 'en US',
                id: '9a75e22f-9c48-418d-8da3-687e8f635282',
                origin,
            });
            const params = new URL(link.replace('#', '?')).searchParams;
            expect(params.get('path')).to.equal('special & surface');
            expect(params.get('locale')).to.equal('en US');
        });
    });

    describe('buildPlaceholderStudioLinks', () => {
        it('joins one link per placeholder with newlines, no trailing newline', () => {
            const ids = [
                '9a75e22f-9c48-418d-8da3-687e8f635282',
                '652722a1-b1d7-415f-9c3f-e88d3b3f7333',
                'b8bb460d-cf4d-47e7-b03f-a1117dd1628e',
            ];
            const links = buildPlaceholderStudioLinks(ids, { path: 'sandbox', locale: 'en_US', origin });
            const lines = links.split('\n');
            expect(lines).to.have.lengthOf(3);
            expect(new Set(lines).size).to.equal(3);
            expect(links.endsWith('\n')).to.be.false;
            expect(lines[0]).to.include(`search=${ids[0]}`);
            expect(lines[1]).to.include(`search=${ids[1]}`);
            expect(lines[2]).to.include(`search=${ids[2]}`);
        });

        it('returns an empty string for an empty or undefined selection', () => {
            expect(buildPlaceholderStudioLinks([])).to.equal('');
            expect(buildPlaceholderStudioLinks(undefined)).to.equal('');
        });
    });
});
