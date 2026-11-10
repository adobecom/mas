const HEADERS = ['url', 'resolved_path', 'locale', 'status', 'reason', 'workflow_instance_id', 'published_at'];

function escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const REPORT_HEADERS = [
    'path',
    'type',
    'locale',
    'status',
    'reason',
    'aem_status',
    'modified_at',
    'published_at',
    'project_published_at',
    'modified_after_publish',
];

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
        ['missing_placeholder_indexes', report.missingIndexes.join(' ')],
    ].map((line) => line.map(escape).join(','));
    const rows = report.rows.map((row) =>
        [
            row.path,
            row.type,
            row.locale,
            row.status,
            row.reason,
            row.aemStatus,
            row.modifiedAt,
            row.publishedAt,
            row.projectPublishedAt,
            row.modifiedAfterPublish,
        ]
            .map(escape)
            .join(','),
    );
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
