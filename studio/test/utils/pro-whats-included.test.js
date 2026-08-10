import { expect } from '@esm-bundle/chai';
import { parseProWhatsIncluded, serializeProWhatsIncluded, proBulletIsEmpty } from '../../src/utils/pro-whats-included.js';

const SECTIONS_HTML =
    '<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>70+ PDF tools</h4>' +
    '<ul><li>Get all the PDF tools in Acrobat Pro</li></ul></div>' +
    '<div class="section"><h4><sp-icon-brush class="sp-icon"></sp-icon-brush>AI Assistant</h4>' +
    '<ul><li>Ask AI to edit, convert, or compress PDFs</li>' +
    '<li>Get AI summaries, insights, and answers</li>' +
    '<li>Organize, share, and collaborate with PDF Spaces</li></ul></div>';

describe('parseProWhatsIncluded', () => {
    it('returns an empty model for empty input', () => {
        expect(parseProWhatsIncluded('')).to.deep.equal({
            label: '',
            values: [],
            bullets: [],
        });
        expect(parseProWhatsIncluded(null).bullets).to.have.lengthOf(0);
    });

    it('maps each section to one bullet, preserving title + every row', () => {
        const { bullets } = parseProWhatsIncluded(SECTIONS_HTML);
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
        expect(parseProWhatsIncluded(html).bullets[0]).to.deep.equal({
            icon: 'https://x/a.svg',
            alt: '<p>Title</p><p>row</p>',
            link: '',
        });
    });

    it('keeps the text but drops the icon for legacy raw <svg> sections', () => {
        const html = '<div class="section"><h4><svg viewBox="0 0 16 16"></svg>Legacy</h4>' + '<ul><li>row</li></ul></div>';
        const { bullets } = parseProWhatsIncluded(html);
        expect(bullets[0].icon).to.equal('');
        expect(bullets[0].alt).to.equal('<p>Legacy</p><p>row</p>');
    });
});

describe('serializeProWhatsIncluded', () => {
    it('serializes a multi-row bullet into <h4> title + <ul><li> rows (the bug fix)', () => {
        const html = serializeProWhatsIncluded([
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
        const html = serializeProWhatsIncluded([{ icon: 'sp-icon-star', alt: '<p>Just a title</p>', link: '' }]);
        expect(html).to.equal('<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>Just a title</h4></div>');
    });

    it('drops empty bullets (no icon and no title)', () => {
        expect(
            serializeProWhatsIncluded([
                { icon: '', alt: '<p></p>', link: '' },
                { icon: '', alt: '', link: '' },
            ]),
        ).to.equal('');
    });

    it('escapes quotes in a merch-icon src', () => {
        const html = serializeProWhatsIncluded([{ icon: 'https://x/a.svg?a="b"', alt: '<p>T</p>', link: '' }]);
        expect(html).to.contain('src="https://x/a.svg?a=&quot;b&quot;"');
    });
});

describe('proBulletIsEmpty', () => {
    it('treats icon-only bullets as non-empty', () => {
        expect(proBulletIsEmpty({ icon: 'sp-icon-star', alt: '<p></p>' })).to.equal(false);
    });
    it('treats blank title + no icon as empty', () => {
        expect(proBulletIsEmpty({ icon: '', alt: '<p></p>' })).to.equal(true);
        expect(proBulletIsEmpty({})).to.equal(true);
    });
});

describe('whats-included label', () => {
    const LABEL_HTML = `<p class="whats-included-label">See everything included:</p>${SECTIONS_HTML}`;

    it('parses a leading label element into the model label', () => {
        const model = parseProWhatsIncluded(LABEL_HTML);
        expect(model.label).to.equal('See everything included:');
        // The label element is not mistaken for a section.
        expect(model.bullets).to.have.lengthOf(2);
    });

    it('parses pre-label markup with an empty label (backward compat)', () => {
        expect(parseProWhatsIncluded(SECTIONS_HTML).label).to.equal('');
    });

    it('serializes a non-empty label ahead of the sections', () => {
        const { bullets } = parseProWhatsIncluded(SECTIONS_HTML);
        expect(serializeProWhatsIncluded(bullets, 'See everything included:')).to.equal(LABEL_HTML);
    });

    it('escapes HTML in the label text', () => {
        const html = serializeProWhatsIncluded([{ icon: 'sp-icon-star', alt: '<p>T</p>', link: '' }], '<b>&label</b>');
        expect(html).to.contain('<p class="whats-included-label">&lt;b&gt;&amp;label&lt;/b&gt;</p>');
    });

    it('omits the label element when the label is blank or there are no sections', () => {
        const { bullets } = parseProWhatsIncluded(SECTIONS_HTML);
        expect(serializeProWhatsIncluded(bullets, '  ')).to.equal(SECTIONS_HTML);
        expect(serializeProWhatsIncluded([], 'Label without sections')).to.equal('');
    });
});

describe('round-trip', () => {
    it('parse -> serialize reproduces the source section markup', () => {
        const { bullets } = parseProWhatsIncluded(SECTIONS_HTML);
        expect(serializeProWhatsIncluded(bullets)).to.equal(SECTIONS_HTML);
    });

    it('parse -> serialize reproduces labeled markup byte-identically', () => {
        const source = `<p class="whats-included-label">See what’s included:</p>${SECTIONS_HTML}`;
        const { label, bullets } = parseProWhatsIncluded(source);
        expect(serializeProWhatsIncluded(bullets, label)).to.equal(source);
    });
});
