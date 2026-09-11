/**
 * Detects the checkout Workflow Step a merch card belongs to, derived from the
 * URL path of its primary CTA link. Detection only — no manual override, no
 * persistence, no I/O; callers decide what to do with the result.
 *
 * Step ids/segments are the `CheckoutWorkflowStep` enum values in
 * web-components/src/constants.js (lines 149-158), so a detected step id always
 * matches the checkout workflow-step vocabulary already used to build checkout URLs.
 */

export const WORKFLOW_STEPS = Object.freeze([
    { id: 'email', label: 'Email', segments: ['email'] },
    { id: 'commitment', label: 'Commitment', segments: ['commitment'] },
    { id: 'recommendation', label: 'Recommendation', segments: ['recommendation'] },
    { id: 'segmentation', label: 'Segmentation', segments: ['segmentation'] },
    { id: 'bundle', label: 'Bundle', segments: ['bundle'] },
    { id: 'payment', label: 'Payment', segments: ['payment'] },
    { id: 'change-plan-team-plans', label: 'Change Plan Team Plans', segments: ['change-plan/team-upgrade/plans'] },
    { id: 'change-plan-team-payment', label: 'Change Plan Team Payment', segments: ['change-plan/team-upgrade/payment'] },
]);

function extractPathSegments(href) {
    const lower = href.trim().toLowerCase();
    if (!lower) return [];
    let pathname;
    try {
        pathname = new URL(lower, 'https://workflow-step.invalid').pathname;
    } catch {
        pathname = lower.split(/[?#]/)[0];
    }
    return pathname.split('/').filter(Boolean);
}

function containsContiguousSegments(segments, matcherSegments) {
    if (matcherSegments.length > segments.length) return false;
    for (let start = 0; start <= segments.length - matcherSegments.length; start++) {
        if (matcherSegments.every((segment, offset) => segments[start + offset] === segment)) {
            return true;
        }
    }
    return false;
}

/**
 * Returns the single Workflow Step id whose path segment(s) appear in `href`,
 * or `null` when `href` is empty/invalid or matches no known step. When more
 * than one step matches, the step with the longest (most specific) segment
 * match wins.
 * @param {string} href
 * @returns {string|null}
 */
export function detectWorkflowStepFromHref(href) {
    if (!href || typeof href !== 'string') return null;
    const segments = extractPathSegments(href);
    if (!segments.length) return null;

    let bestId = null;
    let bestLength = 0;
    for (const step of WORKFLOW_STEPS) {
        for (const matcher of step.segments) {
            const matcherSegments = matcher.split('/');
            if (matcherSegments.length > bestLength && containsContiguousSegments(segments, matcherSegments)) {
                bestId = step.id;
                bestLength = matcherSegments.length;
            }
        }
    }
    return bestId;
}

function getFirstCtaValue(fragmentLike) {
    if (!fragmentLike) return null;
    const ctasField = fragmentLike.fields?.find((field) => field.name === 'ctas');
    const values = fragmentLike.getFieldValues?.('ctas') ?? ctasField?.values;
    return Array.isArray(values) ? (values[0] ?? null) : null;
}

/**
 * Reads the card's first authored CTA and returns its link href, or `null`
 * when the card has no CTA field, no authored CTA value, or no `<a href>`.
 * @param {*} fragmentLike
 * @returns {string|null}
 */
export function extractPrimaryCtaHref(fragmentLike) {
    const raw = getFirstCtaValue(fragmentLike);
    if (!raw || typeof raw !== 'string') return null;
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const href = doc.querySelector('a[href]')?.getAttribute('href');
    return href?.trim() || null;
}

/**
 * @param {*} fragmentLike
 * @returns {string|null} the detected Workflow Step id, or `null` when the
 * card has no CTA link or its link path matches no known step.
 */
export function detectWorkflowStep(fragmentLike) {
    return detectWorkflowStepFromHref(extractPrimaryCtaHref(fragmentLike));
}

/**
 * @param {*} fragmentLike
 * @param {string} stepId
 * @returns {boolean} `false` for an unrecognised `stepId` and for any card
 * whose detected Workflow Step is `null`, so untagged cards never match a filter.
 */
export function matchesWorkflowStep(fragmentLike, stepId) {
    if (!stepId || !WORKFLOW_STEPS.some((step) => step.id === stepId)) return false;
    return detectWorkflowStep(fragmentLike) === stepId;
}

/**
 * @param {Array} list
 * @param {string} stepId
 * @returns {Array} `list` unchanged when `stepId` is falsy, otherwise the
 * subset of `list` whose detected Workflow Step is `stepId`.
 */
export function filterByWorkflowStep(list, stepId) {
    if (!stepId) return list;
    return list.filter((item) => matchesWorkflowStep(item, stepId));
}
