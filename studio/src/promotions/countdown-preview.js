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

/** Serializes a promotion project, raw author JSON or Fragment alike. */
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
    return previewOfProject(projects.find((project) => normalizeTagId(project.tag) === normalized));
}

/** Countdown configuration of the project selected by the saved-fragment pipeline. */
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

/** Why a configured timer is hidden at the supplied preview time, or null while active. */
export function countdownPreviewState({ cdtStart, cdtEnd, countdownStatus }, now) {
    if (countdownStatus && countdownStatus !== 'ready') return countdownStatus;
    if (!cdtStart || !cdtEnd) return 'missing-dates';
    const error = countdownDateError(cdtStart, cdtEnd);
    if (error) return error;
    if (!Number.isFinite(now)) return 'invalid-preview-time';
    if (now < Date.parse(cdtStart)) return 'scheduled';
    return now >= Date.parse(cdtEnd) ? 'expired' : null;
}
