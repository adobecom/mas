import { expect } from '@esm-bundle/chai';
import { linkifyText, parseAnswerMarkdown, parseMarkdown } from '../../src/utils/markdown-parser.js';

const fragment = (markup) => document.createRange().createContextualFragment(markup);

describe('markdown-parser', () => {
    describe('parseMarkdown', () => {
        it('should return empty string for null input', () => {
            expect(parseMarkdown(null)).to.equal('');
        });

        it('should return empty string for undefined input', () => {
            expect(parseMarkdown(undefined)).to.equal('');
        });

        it('should return empty string for empty string input', () => {
            expect(parseMarkdown('')).to.equal('');
        });

        it('should render bold text', () => {
            const result = parseMarkdown('**bold**');
            expect(result).to.include('<strong>bold</strong>');
        });

        it('should render italic text', () => {
            const result = parseMarkdown('*italic*');
            expect(result).to.include('<em>italic</em>');
        });

        it('should render a paragraph', () => {
            const result = parseMarkdown('Hello world');
            expect(result).to.include('<p>');
            expect(result).to.include('Hello world');
        });

        it('should render headings', () => {
            const result = parseMarkdown('# Heading 1');
            expect(result).to.include('<h1>');
            expect(result).to.include('Heading 1');
        });

        it('should render links with linkify enabled', () => {
            const result = parseMarkdown('https://example.com');
            expect(result).to.include('<a');
            expect(result).to.include('https://example.com');
        });

        it('should render line breaks with breaks enabled', () => {
            const result = parseMarkdown('line1\nline2');
            expect(result).to.include('<br>');
        });

        it('should render inline code', () => {
            const result = parseMarkdown('`code`');
            expect(result).to.include('<code>');
            expect(result).to.include('code');
        });

        it('should render unordered lists', () => {
            const result = parseMarkdown('- item1\n- item2');
            expect(result).to.include('<ul>');
            expect(result).to.include('<li>');
            expect(result).to.include('item1');
            expect(result).to.include('item2');
        });

        it('should render ordered lists', () => {
            const result = parseMarkdown('1. first\n2. second');
            expect(result).to.include('<ol>');
            expect(result).to.include('<li>');
        });

        it('should not render raw HTML (html option is false)', () => {
            const result = parseMarkdown('<div>raw html</div>');
            expect(result).to.not.include('<div>');
        });

        it('should apply typographer quotes', () => {
            const result = parseMarkdown('"quotes"');
            expect(result).to.include('\u201c');
        });

        it('should handle markdown links', () => {
            const result = parseMarkdown('[click](https://example.com)');
            expect(result).to.include('<a');
            expect(result).to.include('href="https://example.com"');
            expect(result).to.include('click');
        });

        it('should handle code blocks', () => {
            const result = parseMarkdown('```\nconst x = 1;\n```');
            expect(result).to.include('<code>');
            expect(result).to.include('const x = 1;');
        });

        it('should handle blockquotes', () => {
            const result = parseMarkdown('> quoted text');
            expect(result).to.include('<blockquote>');
            expect(result).to.include('quoted text');
        });

        it('returns identical output for repeated identical input (cache hit)', () => {
            const input = '## Heading\n\nParagraph.';
            const first = parseMarkdown(input);
            const second = parseMarkdown(input);
            expect(second).to.equal(first);
        });

        it('opens links in a new tab without giving the page access to Studio', () => {
            const link = fragment(parseMarkdown('[card](https://example.com/card)')).querySelector('a');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('does not render a javascript: link', () => {
            expect(fragment(parseMarkdown('[run](javascript:alert(1))')).querySelector('a')).to.equal(null);
        });

        it('escapes raw script text', () => {
            const result = parseMarkdown('<script>alert(1)</script>');
            expect(result).to.include('&lt;script&gt;').and.not.include('<script');
        });

        it('wraps a table in a scroll container', () => {
            const table = fragment(parseMarkdown('| Card | Offer |\n| --- | --- |\n| Photoshop | Individual |')).querySelector(
                'div.table-wrap > table',
            );
            expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).to.deep.equal(['Card', 'Offer']);
        });

        it('renders a fenced block as escaped code with its language class', () => {
            const code = fragment(parseMarkdown('```js\nconst tag = "<b>";\n```')).querySelector('pre > code.language-js');
            expect(code.textContent).to.equal('const tag = "<b>";\n');
            expect(code.children.length).to.equal(0);
        });
    });

    describe('linkifyText', () => {
        it('links a URL in a new tab without giving the page access to Studio', () => {
            const link = fragment(linkifyText('See https://x.test/a?b=1&c=2 please')).querySelector('a');
            expect(link.getAttribute('href')).to.equal('https://x.test/a?b=1&c=2');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('keeps markdown syntax literal', () => {
            expect(fragment(linkifyText('*not bold* and # not a heading')).textContent).to.include(
                '*not bold* and # not a heading',
            );
        });

        it('escapes HTML', () => {
            const result = linkifyText('<script>alert(1)</script>');
            expect(result).to.include('&lt;script&gt;').and.not.include('<script');
        });
    });

    describe('parseAnswerMarkdown', () => {
        it('keeps straight quotes and double hyphens', () => {
            const line = `this.setAttribute('data-promotion-code', "value"); run --flag`;
            expect(fragment(parseAnswerMarkdown(line)).textContent).to.include(line);
        });

        it('opens links in a new tab', () => {
            const link = fragment(parseAnswerMarkdown('[card](https://example.com/card)')).querySelector('a');
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
        });

        it('wraps a table in a scroll container', () => {
            const markup = parseAnswerMarkdown('| Card | Offer |\n| --- | --- |\n| Photoshop | Individual |');
            expect(fragment(markup).querySelector('div.table-wrap > table')).to.exist;
        });
    });
});
