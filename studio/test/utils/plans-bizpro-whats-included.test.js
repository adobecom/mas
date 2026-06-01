import { expect } from '@esm-bundle/chai';
import {
    parseBizProPlansWhatsIncluded,
    serializeBizProPlansWhatsIncluded,
    bizProPlansBulletIsEmpty,
} from '../../src/utils/plans-bizpro-whats-included.js';

const SECTIONS_HTML =
    '<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>70+ PDF tools</h4>' +
    '<ul><li>Get all the PDF tools in Acrobat Pro</li></ul></div>' +
    '<div class="section"><h4><sp-icon-brush class="sp-icon"></sp-icon-brush>AI Assistant</h4>' +
    '<ul><li>Ask AI to edit, convert, or compress PDFs</li>' +
    '<li>Get AI summaries, insights, and answers</li>' +
    '<li>Organize, share, and collaborate with PDF Spaces</li></ul></div>';

describe('parseBizProPlansWhatsIncluded', () => {
    it('returns an empty model for empty input', () => {
        expect(parseBizProPlansWhatsIncluded('')).to.deep.equal({
            label: '',
            values: [],
            bullets: [],
        });
        expect(parseBizProPlansWhatsIncluded(null).bullets).to.have.lengthOf(0);
    });

    it('maps each section to one bullet, preserving title + every row', () => {
        const { bullets } = parseBizProPlansWhatsIncluded(SECTIONS_HTML);
        expect(bullets).to.have.lengthOf(2);

        expect(bullets[0].icon).to.equal('sp-icon-star');
        expect(bullets[0].alt).to.equal('<p>70+ PDF tools</p><p>Get all the PDF tools in Acrobat Pro</p>');

        expect(bullets[1].icon).to.equal('sp-icon-brush');
        // The multi-row section keeps the title AND all three rows.
        expect(bullets[1].alt).to.equal(
            '<p>AI Assistant</p>' +
                '<p>Ask AI to edit, convert, or compress PDFs</p>' +
                '<p>Get AI summaries, insights, and answers</p>' +
                '<p>Organize, share, and collaborate with PDF Spaces</p>',
        );
    });

    it('reads a merch-icon URL section icon as its src', () => {
        const html =
            '<div class="section"><h4><merch-icon size="xs" src="https://x/a.svg"></merch-icon>Title</h4>' +
            '<ul><li>row</li></ul></div>';
        expect(parseBizProPlansWhatsIncluded(html).bullets[0]).to.deep.equal({
            icon: 'https://x/a.svg',
            alt: '<p>Title</p><p>row</p>',
            link: '',
        });
    });

    it('keeps the text but drops the icon for legacy raw <svg> sections', () => {
        const html = '<div class="section"><h4><svg viewBox="0 0 16 16"></svg>Legacy</h4>' + '<ul><li>row</li></ul></div>';
        const { bullets } = parseBizProPlansWhatsIncluded(html);
        expect(bullets[0].icon).to.equal('');
        expect(bullets[0].alt).to.equal('<p>Legacy</p><p>row</p>');
    });
});

describe('serializeBizProPlansWhatsIncluded', () => {
    it('serializes a multi-row bullet into <h4> title + <ul><li> rows (the bug fix)', () => {
        const html = serializeBizProPlansWhatsIncluded([
            {
                icon: 'sp-icon-brush',
                alt: '<p>AI Assistant</p>' + '<p>Ask AI to edit</p>' + '<p>Get AI summaries</p>',
                link: '',
            },
        ]);
        expect(html).to.equal(
            '<div class="section"><h4><sp-icon-brush class="sp-icon"></sp-icon-brush>AI Assistant</h4>' +
                '<ul><li>Ask AI to edit</li><li>Get AI summaries</li></ul></div>',
        );
    });

    it('omits the <ul> when a section has only a title', () => {
        const html = serializeBizProPlansWhatsIncluded([{ icon: 'sp-icon-star', alt: '<p>Just a title</p>', link: '' }]);
        expect(html).to.equal('<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>Just a title</h4></div>');
    });

    it('drops empty bullets (no icon and no title)', () => {
        expect(
            serializeBizProPlansWhatsIncluded([
                { icon: '', alt: '<p></p>', link: '' },
                { icon: '', alt: '', link: '' },
            ]),
        ).to.equal('');
    });

    it('escapes quotes in a merch-icon src', () => {
        const html = serializeBizProPlansWhatsIncluded([{ icon: 'https://x/a.svg?a="b"', alt: '<p>T</p>', link: '' }]);
        expect(html).to.contain('src="https://x/a.svg?a=&quot;b&quot;"');
    });
});

describe('bizProPlansBulletIsEmpty', () => {
    it('treats icon-only bullets as non-empty', () => {
        expect(bizProPlansBulletIsEmpty({ icon: 'sp-icon-star', alt: '<p></p>' })).to.equal(false);
    });
    it('treats blank title + no icon as empty', () => {
        expect(bizProPlansBulletIsEmpty({ icon: '', alt: '<p></p>' })).to.equal(true);
        expect(bizProPlansBulletIsEmpty({})).to.equal(true);
    });
});

describe('round-trip', () => {
    it('parse -> serialize reproduces the source section markup', () => {
        const { bullets } = parseBizProPlansWhatsIncluded(SECTIONS_HTML);
        expect(serializeBizProPlansWhatsIncluded(bullets)).to.equal(SECTIONS_HTML);
    });
});
