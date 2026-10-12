/**
 * Paste handling for the chat input.
 *
 * Studio "copy link" actions put a rich anchor on the clipboard whose plain
 * flavor is the human label, not the URL — so a default paste loses the
 * link. When the clipboard HTML contains anchors, we substitute each
 * anchor with its href and paste the result as plain text, keeping the URL
 * the backend needs to resolve the card.
 */

export function pasteTextFromClipboardHtml(html) {
    if (typeof html !== 'string' || !html) return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const anchors = [...doc.querySelectorAll('a[href]')].filter((a) => /^https?:\/\//i.test(a.getAttribute('href')));
    if (!anchors.length) return null;
    for (const anchor of anchors) {
        anchor.replaceWith(doc.createTextNode(` ${anchor.getAttribute('href')} `));
    }
    const text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    return text || null;
}
