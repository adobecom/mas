const { expect } = require('chai');

let extractStudioFragmentIds;
let replaceStudioLinksWithFragmentIds;

const ID = 'dcb58302-f2dc-4f33-a501-9375fe4ec0bb';
const PROD_LINK = `https://mas.adobe.com/studio.html#content-type=merch-card&page=content&query=${ID}`;
const LOCAL_LINK = `http://localhost:3001/studio.html?proxy.port=8080#page=content&query=${ID}&content-type=merch-card`;

describe('ai-chat/studio-links', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/studio-links.js');
        extractStudioFragmentIds = mod.extractStudioFragmentIds;
        replaceStudioLinksWithFragmentIds = mod.replaceStudioLinksWithFragmentIds;
    });

    describe('extractStudioFragmentIds', () => {
        it('extracts the fragment UUID from a production studio link', () => {
            expect(extractStudioFragmentIds(PROD_LINK)).to.deep.equal([ID]);
        });

        it('extracts from a localhost studio link with query params before the hash', () => {
            expect(extractStudioFragmentIds(LOCAL_LINK)).to.deep.equal([ID]);
        });

        it('extracts multiple links embedded in prose', () => {
            const other = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
            const text = `compare ${PROD_LINK} with https://mas.adobe.com/studio.html#query=${other}&page=content please`;
            expect(extractStudioFragmentIds(text)).to.deep.equal([ID, other]);
        });

        it('ignores studio links whose query is not a fragment UUID', () => {
            expect(extractStudioFragmentIds('https://mas.adobe.com/studio.html#page=content&query=photoshop')).to.deep.equal(
                [],
            );
        });

        it('ignores non-studio URLs and plain text', () => {
            expect(extractStudioFragmentIds('see https://adobe.com/creativecloud and hello')).to.deep.equal([]);
            expect(extractStudioFragmentIds('no links here')).to.deep.equal([]);
            expect(extractStudioFragmentIds(null)).to.deep.equal([]);
        });
    });

    describe('HTML-serialized messages (RTE output)', () => {
        it('extracts from links whose ampersands are HTML-escaped', () => {
            const escaped = `https://mas.adobe.com/studio.html#content-type=merch-card&amp;page=content&amp;query=${ID}`;
            expect(extractStudioFragmentIds(escaped)).to.deep.equal([ID]);
            expect(replaceStudioLinksWithFragmentIds(escaped)).to.equal(ID);
        });

        it('does not swallow trailing markup after the link', () => {
            const html = `<p>https://mas.adobe.com/studio.html#page=content&query=${ID}</p>`;
            expect(extractStudioFragmentIds(html)).to.deep.equal([ID]);
            expect(replaceStudioLinksWithFragmentIds(html)).to.equal(`<p>${ID}</p>`);
        });

        it('extracts the href from a pasted rich anchor', () => {
            const html = `<a href="https://mas.adobe.com/studio.html#page=content&amp;query=${ID}">merch-card: SANDBOX / Mini</a>`;
            expect(extractStudioFragmentIds(html)).to.deep.equal([ID]);
        });
    });

    describe('replaceStudioLinksWithFragmentIds', () => {
        it('replaces a bare pasted link with its fragment UUID', () => {
            expect(replaceStudioLinksWithFragmentIds(PROD_LINK)).to.equal(ID);
        });

        it('replaces links embedded in a request while keeping the prose', () => {
            expect(replaceStudioLinksWithFragmentIds(`publish this card ${PROD_LINK} please`)).to.equal(
                `publish this card ${ID} please`,
            );
        });

        it('leaves non-studio URLs and plain text untouched', () => {
            const text = 'check https://adobe.com and card abc';
            expect(replaceStudioLinksWithFragmentIds(text)).to.equal(text);
            expect(replaceStudioLinksWithFragmentIds(null)).to.equal(null);
        });
    });
});
