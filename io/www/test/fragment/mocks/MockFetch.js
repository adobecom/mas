// Helper function to create mock Response objects
export function createResponse(status, data, statusText = 'OK', headers = {}) {
    const allHeaders = { 'content-type': 'application/json', ...headers };
    const response = {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        headers: {
            entries: () => Object.entries(allHeaders),
            get: (name) => allHeaders[name.toLowerCase()] ?? null,
        },
    };
    if (data) {
        response.json = async () => data;
    }
    return Promise.resolve(response);
}
