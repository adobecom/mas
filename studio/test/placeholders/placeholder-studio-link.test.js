import { expect } from '@esm-bundle/chai';
import { buildPlaceholderStudioLink, buildPlaceholderStudioLinks } from '../../src/placeholders/placeholder-studio-link.js';

describe('placeholder-studio-link', () => {
    const origin = 'https://mas.adobe.com';

    describe('buildPlaceholderStudioLink', () => {
        it('builds the confirmed Studio deep link for a single placeholder', () => {
            const link = buildPlaceholderStudioLink({ path: 'sandbox', locale: 'en_US', name: 'addon-demo-test', origin });
            expect(link).to.equal(
                `${origin}/studio.html#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=addon-demo-test`,
            );
        });

        it('percent-encodes a name containing spaces and &', () => {
            const link = buildPlaceholderStudioLink({ path: 'sandbox', locale: 'en_US', name: 'promo & sale', origin });
            const search = new URL(link.replace('#', '?')).searchParams.get('search');
            expect(search).to.equal('promo & sale');
            expect(link).to.not.include('promo & sale');
            expect(link).to.include('search=promo+%26+sale');
        });
    });

    describe('buildPlaceholderStudioLinks', () => {
        it('joins one link per placeholder with newlines, no trailing newline', () => {
            const links = buildPlaceholderStudioLinks(['one', 'two', 'three'], { path: 'sandbox', locale: 'en_US', origin });
            const lines = links.split('\n');
            expect(lines).to.have.lengthOf(3);
            expect(new Set(lines).size).to.equal(3);
            expect(links.endsWith('\n')).to.be.false;
            expect(lines[0]).to.include('search=one');
            expect(lines[1]).to.include('search=two');
            expect(lines[2]).to.include('search=three');
        });

        it('returns an empty string for an empty or undefined selection', () => {
            expect(buildPlaceholderStudioLinks([])).to.equal('');
            expect(buildPlaceholderStudioLinks(undefined)).to.equal('');
        });
    });
});
