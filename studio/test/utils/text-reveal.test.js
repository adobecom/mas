import { expect } from '@esm-bundle/chai';
import { prepareTextReveal } from '../../src/utils/text-reveal.js';

function bubble(innerHTML) {
    const el = document.createElement('div');
    el.innerHTML = innerHTML;
    document.body.appendChild(el);
    return el;
}

describe('text-reveal', () => {
    afterEach(() => {
        document.querySelectorAll('body > div').forEach((el) => el.remove());
    });

    it('wraps each word in a reveal span with increasing delays', () => {
        const el = bubble('<p>Bulk publishing is a two-step process</p>');
        const { wordCount } = prepareTextReveal(el);
        const words = el.querySelectorAll('.reveal-word');
        expect(wordCount).to.equal(6);
        expect(words).to.have.length(6);
        const delays = [...words].map((w) => parseFloat(w.style.animationDelay));
        for (let i = 1; i < delays.length; i += 1) {
            expect(delays[i]).to.be.greaterThan(delays[i - 1]);
        }
    });

    it('preserves element boundaries such as links and lists', () => {
        const el = bubble('<p>See <a href="#x">the guide</a> first</p> <ul><li>one two</li></ul>');
        prepareTextReveal(el);
        expect(el.querySelector('a')).to.exist;
        expect(el.querySelector('a').getAttribute('href')).to.equal('#x');
        expect(el.querySelectorAll('li .reveal-word')).to.have.length(2);
        expect(el.textContent.replace(/\s+/g, ' ').trim()).to.equal('See the guide first one two');
    });

    it('caps the total duration for long answers', () => {
        const longText = Array.from({ length: 200 }, (i, n) => `word${n}`).join(' ');
        const el = bubble(`<p>${longText}</p>`);
        const { totalDuration } = prepareTextReveal(el, { maxDuration: 1200 });
        expect(totalDuration).to.be.at.most(1200);
    });

    it('ceilings the per-word delay for short answers', () => {
        const el = bubble('<p>one two three four five</p>');
        const { totalDuration } = prepareTextReveal(el);
        const delays = [...el.querySelectorAll('.reveal-word')].map((w) => parseFloat(w.style.animationDelay));
        expect(delays).to.deep.equal([0, 90, 180, 270, 360]);
        expect(totalDuration).to.equal(450);
    });

    it('skips very long content entirely', () => {
        const longText = Array.from({ length: 401 }, (i, n) => `word${n}`).join(' ');
        const el = bubble(`<p>${longText}</p>`);
        const result = prepareTextReveal(el);
        expect(result.wordCount).to.equal(0);
        expect(el.querySelectorAll('.reveal-word')).to.have.length(0);
    });

    it('cleanup restores the original DOM', () => {
        const el = bubble('<p>Preview <strong>then</strong> approve</p>');
        const before = el.innerHTML;
        const { cleanup } = prepareTextReveal(el);
        expect(el.innerHTML).to.not.equal(before);
        cleanup();
        expect(el.innerHTML).to.equal(before);
    });

    it('no-ops on empty or null roots', () => {
        expect(prepareTextReveal(null).wordCount).to.equal(0);
        const el = bubble('<img alt="only an element">');
        expect(prepareTextReveal(el).wordCount).to.equal(0);
    });

    it('skips when prefers-reduced-motion matches', () => {
        const original = window.matchMedia;
        window.matchMedia = (q) => ({ matches: q.includes('prefers-reduced-motion'), media: q });
        try {
            const el = bubble('<p>hello world</p>');
            expect(prepareTextReveal(el).wordCount).to.equal(0);
            expect(el.querySelectorAll('.reveal-word')).to.have.length(0);
        } finally {
            window.matchMedia = original;
        }
    });
});
