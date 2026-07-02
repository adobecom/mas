/**
 * Progressive text reveal for freshly arrived assistant messages.
 *
 * Wraps each word of the rendered bubble in a span with a staggered
 * animation delay so the answer appears to generate live even though it
 * arrived whole. The per-word delay is the duration cap divided by the
 * word count, ceilinged at maxWordDelay so short answers do not crawl;
 * the full reveal never exceeds maxDuration. cleanup() restores the
 * original DOM, keeping selection and copy/paste clean after the animation.
 */

const noop = () => {};
const SKIP_RESULT = Object.freeze({ wordCount: 0, totalDuration: 0, cleanup: noop });
const MAX_WORDS = 400;

export function prepareTextReveal(rootEl, options = {}) {
    const { maxDuration = 1200, maxWordDelay = 90 } = options;
    if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return SKIP_RESULT;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return SKIP_RESULT;

    const originalHTML = rootEl.innerHTML;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let wordCount = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.trim()) {
            textNodes.push(node);
            wordCount += node.textContent.trim().split(/\s+/).length;
        }
    }
    if (wordCount === 0 || wordCount > MAX_WORDS) return SKIP_RESULT;

    const wordDelay = Math.min(maxWordDelay, maxDuration / wordCount);
    let index = 0;
    for (const node of textNodes) {
        const fragment = document.createDocumentFragment();
        for (const part of node.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (!part.trim()) {
                fragment.appendChild(document.createTextNode(part));
                continue;
            }
            const span = document.createElement('span');
            span.className = 'reveal-word';
            span.textContent = part;
            span.style.animationDelay = `${Math.round(index * wordDelay)}ms`;
            fragment.appendChild(span);
            index += 1;
        }
        node.parentNode.replaceChild(fragment, node);
    }

    return {
        wordCount,
        totalDuration: Math.round(index * wordDelay),
        cleanup() {
            rootEl.innerHTML = originalHTML;
        },
    };
}
