// Pure geometry for spreading detection badges so they never stack on top of
// each other. Badges anchored to box-less elements (a hidden nav flyout, a
// display:contents wrapper) all resolve to the same top-left corner; dense card
// grids and stacked price/CTA pairs collide too. Callers pass each badge's
// desired position and size; this returns a non-overlapping position per badge,
// in the same order, nudging colliders right and wrapping to the next row.

function resolveBadgeLayout(badges, viewportWidth, options = {}) {
    const gap = options.gap ?? 4;
    const margin = options.margin ?? 8;

    const order = badges
        .map((badge, index) => ({ badge, index }))
        .sort((a, b) => a.badge.top - b.badge.top || a.badge.left - b.badge.left);

    const result = new Array(badges.length);
    const placed = [];

    const collides = (top, left, w, h) =>
        placed.some(
            (p) => left < p.left + p.w + gap && left + w + gap > p.left && top < p.top + p.h + gap && top + h + gap > p.top,
        );

    for (const { badge, index } of order) {
        let { top, left } = badge;
        const { w, h } = badge;
        let guard = 0;
        while (collides(top, left, w, h) && guard++ < 1000) {
            left += w + gap;
            if (left + w > viewportWidth - margin) {
                left = margin;
                top += h + gap;
            }
        }
        result[index] = { top, left };
        placed.push({ top, left, w, h });
    }

    return result;
}

if (typeof self !== 'undefined') {
    self.MASBadgeLayout = { resolveBadgeLayout };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { resolveBadgeLayout };
}
