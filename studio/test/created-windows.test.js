import { expect } from '@esm-bundle/chai';
import { createdWindows } from '../src/fragments/created-windows.js';

describe('createdWindows', () => {
    const lo = Date.parse('2025-01-01T00:00:00.000Z');
    const hi = Date.parse('2025-01-01T00:00:10.000Z');

    it('covers [lo, hi] with consecutive windows that never overlap', () => {
        const windows = createdWindows(lo, hi, 4);
        expect(windows).to.have.length(4);
        expect(windows[0].after).to.equal(new Date(lo).toISOString());
        expect(windows.at(-1).before).to.equal(new Date(hi).toISOString());
        windows.slice(1).forEach((window, i) => {
            expect(Date.parse(window.after) - Date.parse(windows[i].before)).to.equal(1);
        });
    });

    it('returns fewer windows when the span is shorter than the count', () => {
        expect(createdWindows(lo, lo + 2, 12)).to.have.length(3);
        expect(createdWindows(lo, lo, 12)).to.deep.equal([
            { after: new Date(lo).toISOString(), before: new Date(lo).toISOString() },
        ]);
    });
});
