import { Fragment } from '../aem/fragment.js';
import { MODEL_WEB_COMPONENT_MAPPING, formatAuthorPath, getFragmentPartsToUse } from '../utils.js';

const DAM_ROOT = '/content/dam/mas/';

const HEADERS = ['url', 'resolved_path', 'locale', 'status', 'reason', 'workflow_instance_id', 'published_at'];

function escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const REPORT_COLUMNS = [
    ['fragment', 'label'],
    ['title', 'displayTitle'],
    ['type', 'type'],
    ['locale', 'locale'],
    ['status', 'status'],
    ['reason', 'reason'],
    ['aem_status', 'aemStatus'],
    ['modified_at', 'modifiedAt'],
    ['published_at', 'publishedAt'],
    ['project_published_at', 'projectPublishedAt'],
    ['modified_after_publish', 'modifiedAfterPublish'],
];
const REPORT_HEADERS = REPORT_COLUMNS.map(([header]) => header);
const REPORT_FIELDS = REPORT_COLUMNS.map(([, field]) => field);

function readablePath(path) {
    if (!path.startsWith(DAM_ROOT)) return path;
    return path.slice(DAM_ROOT.length).split('/').filter(Boolean).join(' / ');
}

/**
 * Human readable identity of a report row: the Studio author path for cards and collections
 * (e.g. "SANDBOX / merch-card / Catalog / Individual / com / Photoshop"), the path without the DAM root otherwise.
 * @param {object} row report row
 * @returns {{ label: string, displayTitle: string }}
 */
function describeRow(row) {
    const { labelSource } = row;
    const webComponent = MODEL_WEB_COMPONENT_MAPPING[labelSource?.model?.path];
    if (!webComponent) return { label: readablePath(row.path), displayTitle: row.title };
    const surface = row.path.startsWith(DAM_ROOT) ? row.path.slice(DAM_ROOT.length).split('/')[0] : '';
    const { fragmentParts, title } = getFragmentPartsToUse(new Fragment(labelSource), surface);
    return { label: formatAuthorPath(webComponent, fragmentParts), displayTitle: title || row.title };
}

/**
 * Serializes a live-status report: summary lines, a blank line, then one line per row.
 * @param {object} report report returned by the bulk-report action
 * @returns {string} CSV text
 */
export function toReportCsv(report) {
    const { summary } = report;
    const summaryLines = [
        ['generated_at', report.generatedAt],
        ['project_published_at', report.projectPublishedAt],
        ['total', summary.total],
        ['live', summary.live],
        ['failed', summary.failed],
        ['not_live', summary.notLive],
        ['reported_published', summary.reportedPublished],
        ['reported_total', summary.reportedTotal],
        ['missing_placeholder_indexes', report.missingIndexes.map(readablePath).join(' ')],
    ].map((line) => line.map(escape).join(','));
    const rows = report.rows.map((row) => {
        const described = { ...row, ...describeRow(row) };
        return REPORT_FIELDS.map((field) => escape(described[field])).join(',');
    });
    return `${[...summaryLines, '', REPORT_HEADERS.join(','), ...rows].join('\n')}\n`;
}

export function toCsv(details, extra = {}) {
    const header = HEADERS.join(',');
    const rows = (details || []).map((d) =>
        [
            d.url,
            d.path ?? d.resolved_path,
            d.locale,
            d.status,
            d.reason,
            d.workflowInstanceId ?? d.workflow_instance_id,
            extra.published_at,
        ]
            .map(escape)
            .join(','),
    );
    return `${[header, ...rows].join('\n')}\n`;
}
