const HEADERS = ['url', 'resolved_path', 'locale', 'status', 'reason', 'workflow_instance_id', 'published_at'];

function escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
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
