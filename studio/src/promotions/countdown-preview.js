import { hasCountdownTimerLink } from '../../../io/www/src/fragment/transformers/corrector.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { getPromotionTagFromFragment } from './promotion-model.js';

const bothDates = (project) =>
    project?.cdtStart && project?.cdtEnd ? { cdtStart: project.cdtStart, cdtEnd: project.cdtEnd } : {};

/** @param {Array<{ values?: unknown[] }>} [fields] author-format fields */
export function hasCountdownSentinel(fields = []) {
    return hasCountdownTimerLink(fields.flatMap((field) => field.values ?? []));
}

/** Serializes a promotion project, raw author JSON or Fragment alike, to its tag and countdown dates. */
export function toCountdownProject({ fields = [], tags }) {
    const values = (name) => fields.find((field) => field.name === name)?.values ?? [];
    return {
        tag: getPromotionTagFromFragment({ getFieldValues: values, tags }),
        cdtStart: values('cdtStart')[0],
        cdtEnd: values('cdtEnd')[0],
    };
}

/** Dates of the project an authored promo variation is tagged with (draft projects included). */
export function countdownDatesOfTag(projects, tag) {
    const normalized = normalizeTagId(tag);
    return bothDates(projects.find((project) => normalizeTagId(project.tag) === normalized));
}

/**
 * Dates of the project the production pipeline selected for a fragment: `body.promoProject` names
 * the selected project's label among `promoProjects` (previewFragment with `fullContext`).
 */
export function countdownDatesOfProvenance({ body, promoProjects = [] } = {}) {
    return bothDates(promoProjects.find(({ label }) => body?.promoProject && label === body.promoProject)?.project);
}
