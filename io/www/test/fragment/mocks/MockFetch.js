// Helper function to create mock Response objects
export function createResponse(status, data, statusText = 'OK') {
    const response = {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        headers: {
            entries: () => Object.entries({ 'Content-Type': 'application/json' }),
        },
    };
    if (data) {
        response.json = async () => data;
    }
    return Promise.resolve(response);
}
