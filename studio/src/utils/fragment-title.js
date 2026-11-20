import { SURFACES } from '../constants.js';

const TITLE_SEPARATOR = ' : ';

export function buildFragmentTitle({
    org,
    state,
    blockPage,
    template,
    product,
    customerSegment,
    planType,
    surface,
    isHeadless,
}) {
    const nodes = [
        (org ?? '').toUpperCase(),
        isHeadless ? blockPage : '',
        template,
        product,
        customerSegment,
        surface === SURFACES.ACOM_DC.name ? planType : '',
        state,
    ];
    return nodes
        .map((node) => (node ?? '').trim())
        .filter(Boolean)
        .join(TITLE_SEPARATOR);
}
