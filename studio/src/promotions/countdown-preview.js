import { hasCountdownTimerLink } from '../../../io/www/src/fragment/transformers/corrector.js';
import { PATH_TOKENS } from '../constants.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { getPromotionTagFromFragment } from './promotion-model.js';

const previewOfProject = (project) => {
    if (!project) return { countdownStatus: 'no-project' };
    if (!project.cdtStart || !project.cdtEnd) return { countdownStatus: 'missing-dates' };
    return { cdtStart: project.cdtStart, cdtEnd: project.cdtEnd, countdownStatus: 'ready' };
};

/** @param {Array<{ values?: unknown[] }>} [fields] author-format fields */
export function hasCountdownSentinel(fields = []) {
    return hasCountdownTimerLink(fields.flatMap((field) => field.values ?? []));
}

export function toCountdownProject({ fields = [], tags }) {
    const values = (name) => fields.find((field) => field.name === name)?.values ?? [];
    return {
        tag: getPromotionTagFromFragment({ getFieldValues: values, tags }),
        cdtStart: values('cdtStart')[0],
        cdtEnd: values('cdtEnd')[0],
        fragments: values('fragments'),
    };
}

/** Project membership follows the pipeline's locale-independent fragment path matching. */
export function countdownProjectTargetsPath(project, path) {
    const target = PATH_TOKENS.exec(path)?.groups;
    return (
        !!target &&
        project.fragments.some((reference) => {
            const source = PATH_TOKENS.exec(reference)?.groups;
            return source?.surface === target.surface && source?.fragmentPath === target.fragmentPath;
        })
    );
}

/** Countdown configuration of a tagged promotion, including draft projects. */
export function countdownPreviewOfTag(projects, tag) {
    const normalized = normalizeTagId(tag);
    const project = projects.find((project) => normalizeTagId(project.tag) === normalized);
    return project ? previewOfProject(project) : { countdownStatus: 'project-not-loaded' };
}

export function countdownPreviewOfProvenance({ body, promoProjects = [] } = {}) {
    const project = promoProjects.find(({ label }) => body?.promoProject && label === body.promoProject)?.project;
    if (body?.promoProject && !project) return { countdownStatus: 'lookup-failed' };
    return previewOfProject(project);
}

/** An empty pair is optional in the promotion editor. */
export function countdownDateError(start, end) {
    if (!start && !end) return null;
    if (!start || !end) return 'missing-dates';
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) return 'invalid-dates';
    return Date.parse(start) >= Date.parse(end) ? 'invalid-range' : null;
}

export function countdownPreviewState({ cdtStart, cdtEnd, countdownStatus }, now) {
    if (!countdownStatus) return null; // lookup has not run yet for the current description
    if (countdownStatus !== 'ready') return countdownStatus;
    if (!cdtStart || !cdtEnd) return 'missing-dates';
    const error = countdownDateError(cdtStart, cdtEnd);
    if (error) return error;
    if (!Number.isFinite(now)) return 'invalid-preview-time';
    if (now < Date.parse(cdtStart)) return 'scheduled';
    return now >= Date.parse(cdtEnd) ? 'expired' : null;
}

export const COUNTDOWN_RANGE_MESSAGE = 'Countdown end must be later than countdown start.';

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const utc = (time) => `${DATE_FORMAT.format(time)} UTC`;

const NOTICE_MESSAGES = {
    'no-project': () =>
        'No promotion project is linked to this card. Add it to a promotion project. For cloned cards, copying an offer or promo code does not copy the promotion association.',
    'no-match': ({ locale, previewTime }) =>
        `No matching promotion applies to this card for ${locale} at ${previewTime}. Check the project's targeting, campaign dates, and offer mappings.`,
    'missing-dates': () =>
        'The selected promotion is missing one or both countdown dates. Set Countdown Timer Start (UTC) and Countdown Timer End (UTC). Campaign dates and promo codes do not configure the timer.',
    'project-not-loaded': () =>
        "The promotion project for this card's tag is not in the loaded promotions list. Refresh the promotions list and reopen the card.",
    'lookup-failed': () => "Couldn't load countdown settings. Retry the preview.",
    'invalid-dates': () => 'Set valid UTC dates for Countdown Timer Start and Countdown Timer End.',
    'invalid-range': () => COUNTDOWN_RANGE_MESSAGE,
    'invalid-preview-time': () => 'Set a valid preview date and time to view the countdown.',
    scheduled: ({ preview }) =>
        `Countdown starts on ${utc(Date.parse(preview.cdtStart))}. It is hidden at the current preview time.`,
    expired: ({ preview }) => `Countdown ended on ${utc(Date.parse(preview.cdtEnd))}.`,
};

export function countdownNotice(preview, now, locale) {
    const state = countdownPreviewState(preview, now);
    if (!state) return null;
    const previewTime = Number.isFinite(now) ? utc(now) : 'the current preview time';
    return { state, text: NOTICE_MESSAGES[state]({ preview, locale, previewTime }) };
}

export function nextCountdownBoundary({ cdtStart, cdtEnd }, now) {
    if (countdownDateError(cdtStart, cdtEnd)) return undefined;
    return [Date.parse(cdtStart), Date.parse(cdtEnd)].find((time) => time > now);
}
