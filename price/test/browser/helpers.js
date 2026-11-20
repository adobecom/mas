import { expect } from '@esm-bundle/chai';

const normalise = (value) =>
    String(value)
        .trim()
        .replace(/;$/, '')
        .replace(/&quot;/g, '"')
        .replace(/>\s+</g, '><')
        .replace(/\s+>/g, '>')
        .replace(/\s+</g, '<')
        .replace(/>\s+/g, '>')
        .replace(/='([^']*)'/g, '="$1"')
        .replace(/\s{2,}/g, ' ')
        .toLowerCase();

export const expectHtml = (actual, expected) => {
    expect(normalise(actual)).to.equal(normalise(expected));
};
