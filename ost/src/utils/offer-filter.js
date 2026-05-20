/**
 * Filters an offer based on landscape, segment matching, and text search.
 * @param {RegExp|null} criteria - search regex or null for no text filter
 * @param {string} landscape - 'DRAFT', 'PUBLISHED', or 'BOTH'
 * @param {{ customerSegment: string, marketSegment: string, arrangementCode: string }} aos - AOS context
 * @param {{ customerSegments: Object, marketSegments: Object, arrangement_code: string, name: string, draft: boolean }} offer - offer to test
 * @returns {boolean}
 */
function offerFilter(criteria, landscape, aos, { customerSegments, marketSegments, arrangement_code, name, draft }) {
    const matchesCustomerSegment = !aos.customerSegment || customerSegments[aos.customerSegment] === true;
    const matchesMarketSegment = !aos.marketSegment || marketSegments[aos.marketSegment] === true;

    return (
        matchesCustomerSegment &&
        matchesMarketSegment &&
        (landscape === 'DRAFT' || landscape === 'BOTH' || !draft) &&
        (arrangement_code === aos.arrangementCode || !criteria || criteria.test(name) || criteria.test(arrangement_code))
    );
}

export { offerFilter };
