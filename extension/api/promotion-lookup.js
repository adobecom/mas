// The published promotions folder is public; IO lists the same folder to find active projects.
const PROMOTIONS_LIST_URL = 'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/promotions&limit=50';
const PROMOTION_TAG_PREFIX = 'mas:promotion/';

function getValidators() {
    if (typeof self !== 'undefined' && self.MASValidators) return self.MASValidators;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            return require('../utils/validators.js');
        } catch (err) {
            return null;
        }
    }
    return null;
}

async function fetchPromotionProjects() {
    const projects = [];
    let cursor;
    do {
        const url = cursor ? `${PROMOTIONS_LIST_URL}&cursor=${encodeURIComponent(cursor)}` : PROMOTIONS_LIST_URL;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        projects.push(...(body.items ?? []));
        cursor = body.cursor;
    } while (cursor);
    return projects;
}

// A promo variation's folder is named after its project's mas:promotion tag; IO stamps the project title.
function findPromotionProjectId(projects, { name, title }) {
    const byTag = name && projects.find((project) => project.fields?.tags?.includes(`${PROMOTION_TAG_PREFIX}${name}`));
    const byTitle = title && projects.find((project) => project.fields?.title === title);
    return (byTag || byTitle)?.id ?? null;
}

// The listing is fetched once per service-worker lifetime; a failed listing is retried on the next lookup.
function createPromotionLookup(listProjects = fetchPromotionProjects) {
    let projectsRequest = null;

    async function resolveProjectId({ name, title }) {
        // IO labels a project without a title by its id.
        if (getValidators()?.isValidUUID(title)) return title;
        projectsRequest ??= listProjects().catch((err) => {
            projectsRequest = null;
            throw err;
        });
        return findPromotionProjectId(await projectsRequest, { name, title });
    }

    // A project the published listing lacks (e.g. a draft) opens the promotions list instead.
    async function linkRequest({ promotionName, promotionTitle }) {
        const promotionId = await resolveProjectId({ name: promotionName, title: promotionTitle }).catch(() => null);
        return promotionId ? { view: 'promotions-editor', promotionId } : { view: 'promotions' };
    }

    return { resolveProjectId, linkRequest };
}

if (typeof self !== 'undefined') {
    self.MASPromotionLookup = createPromotionLookup();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROMOTIONS_LIST_URL, fetchPromotionProjects, findPromotionProjectId, createPromotionLookup };
}
