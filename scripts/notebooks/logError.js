export async function logError(response) {
    console.error(`Request failed with status: ${response.status} ${response.statusText}`);

    console.error('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
        console.error(`  ${key}: ${value}`);
    }

    try {
        const errorData = await response.json();
        console.error('Error Response Body:', errorData);
    } catch (e) {
        const errorText = await response.text();
        console.error('Error Response Body (text):', errorText);
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
