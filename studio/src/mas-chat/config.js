import { IO_FALLBACK_NAMESPACE } from '../constants.js';

const IO_API_PREFIX = '/api/v1/web';
const STUDIO_PACKAGE = 'MerchAtScaleStudio';

function isLocalhostHostname(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * The IO Runtime base URL every assistant package is read from.
 *
 * studio.html writes it into the `io-base-url` meta tag, honouring
 * ?io.studio.env=, and users.js, translation and bulk-publish already read it.
 * Reading it here too means the assistant, MCP and knowledge services follow
 * whatever environment the page was loaded for, instead of a namespace baked
 * into the bundle.
 *
 * This assumes MerchAtScaleStudio, MerchAtScaleMCP and MerchAtScaleKnowledge are
 * all deployed to that one namespace. When they are not, the missing package
 * answers with a 404 that carries no CORS headers, and the browser reports it as
 * "Failed to fetch" rather than as a status.
 */
function ioStudioBaseURL() {
    const fromMeta = document.querySelector('meta[name="io-base-url"]')?.content;
    return fromMeta || `https://${IO_FALLBACK_NAMESPACE}.adobeioruntime.net${IO_API_PREFIX}/${STUDIO_PACKAGE}`;
}

/** Same namespace and environment as the Studio package, different IO package. */
function siblingPackageURL(packageName) {
    const base = ioStudioBaseURL();
    const index = base.lastIndexOf(`/${STUDIO_PACKAGE}`);
    return index === -1 ? `${base}/${packageName}` : `${base.slice(0, index)}/${packageName}`;
}

/** Only localhost may redirect these, so a crafted query cannot move production traffic. */
function localOverride(location, param) {
    if (!isLocalhostHostname(location.hostname)) return null;
    return new URLSearchParams(location.search).get(param);
}

export function getAIChatBaseURL(location = window.location) {
    return localOverride(location, 'ai.chat') || ioStudioBaseURL();
}

export function getMCPServerURL(location = window.location) {
    return localOverride(location, 'mcp.server') || siblingPackageURL('MerchAtScaleMCP');
}

export function getKnowledgeServiceURL(location = window.location) {
    return localOverride(location, 'knowledge.service') || siblingPackageURL('MerchAtScaleKnowledge');
}

/** The MCP package without the localhost override, for non-chat callers. */
export function getIoMcpURL() {
    return siblingPackageURL('MerchAtScaleMCP');
}

/** The Studio package without the localhost override, for non-chat callers. */
export function getIoStudioURL() {
    return ioStudioBaseURL();
}

export const AI_CHAT_BASE_URL = getAIChatBaseURL();
export const MCP_SERVER_URL = getMCPServerURL();
export const IO_MCP_URL = getIoMcpURL();
export const KNOWLEDGE_SERVICE_URL = getKnowledgeServiceURL();

export const TEMPLATE_PREVIEWS = {
    'ccd-slice': '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
    'ccd-suggested': '45783ec8-ed85-4595-a445-3f018ac4ad9d',
    mini: '03a36f0f-3e5d-4881-ae6b-273c517c9d38',
    'ah-try-buy-widget': '44520fdc-f6e1-4c21-8978-9cd25a1be158',
    'ah-promoted-plans': '031e2f50-5cbc-4e4b-af9b-c63f0e4f2a93',
    'simplified-pricing-express': 'aaa728dc-2b44-495c-b9f0-bb82044db18a',
    'full-pricing-express': '9406f1ae-7bee-48c3-9892-49af6816033e',
    plans: '1736f2c9-0931-401b-b3c0-fe87ff72ad38',
    'plans-education': 'b8cd82c8-f8fa-433a-afa2-9aba4ebe5ea5',
    fries: '8487f19d-b038-44fa-9db6-0dc55a85b326',
    catalog: '60d6f47c-8fd7-485d-a4ac-2b7baa492ab1',
    'special-offers': '0381d43f-2e1d-4074-a7a6-4a748bd81be7',
    'mini-compare-chart': 'ce03bb09-75b1-45b9-8ff7-fcd42d33c765',
    'mini-compare-chart-mweb': '127a74ee-bd16-4de2-a7a1-ad6a1ef39455',
    'plans-v2': 'aa96379a-d591-4c0c-8633-cdb4fb77c6da',
    image: '7da8f1fa-9591-445e-8542-9aa77d9dc1f4',
    'plans-students': '484739ec-72f7-4b4b-b756-bb9b42ee06c8',
    product: '5381e707-f04f-4c5f-9d2c-02455049132d',
    segment: '2f700fce-dd51-4fb0-bf20-6f046cc735a7',
    media: '339b00db-5217-4fc4-b1e9-7fec29bb3c89',
    headless: '37e60185-599a-46d3-8b26-dacd9cbc2d52',
};
