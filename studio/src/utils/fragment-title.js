import { SURFACES } from '../constants.js';

const TITLE_SEPARATOR = ': ';

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

const EMPTY_PARTS = { org: '', state: '', blockPage: '' };

function matchMiddle(rest, parts, blockPage) {
    const middle = buildFragmentTitle({ ...parts, blockPage, org: '', state: '' });
    if (rest === middle) return { state: '', blockPage };
    if (rest.startsWith(middle + TITLE_SEPARATOR))
        return { state: rest.slice(middle.length + TITLE_SEPARATOR.length), blockPage };
    return null;
}

export function parseFragmentTitle(title, parts) {
    const index = title.indexOf(TITLE_SEPARATOR);
    if (index <= 0) return { ...EMPTY_PARTS };
    const org = title.slice(0, index);
    if (org !== org.toUpperCase()) return { ...EMPTY_PARTS };
    const rest = title.slice(index + TITLE_SEPARATOR.length);
    const match = matchMiddle(rest, parts, '');
    if (match) return { org, ...match };
    if (!parts.isHeadless) return { ...EMPTY_PARTS };
    const next = rest.indexOf(TITLE_SEPARATOR);
    if (next <= 0) return { ...EMPTY_PARTS };
    const headlessMatch = matchMiddle(rest, parts, rest.slice(0, next));
    return headlessMatch ? { org, ...headlessMatch } : { ...EMPTY_PARTS };
}

export function splitFragmentTitle(title, org) {
    if (!org?.trim()) return ['', title];
    const index = title.indexOf(TITLE_SEPARATOR);
    return index < 0 ? [title, ''] : [title.slice(0, index), title.slice(index)];
}
