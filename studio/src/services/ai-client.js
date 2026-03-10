import { AI_CHAT_BASE_URL } from '../constants.js';
import { fetchWithRetry } from './fetch-with-retry.js';

export async function callAIChatAction(params) {
    if (!window.adobeIMS) {
        throw new Error('Adobe IMS not loaded');
    }

    const accessTokenObj = window.adobeIMS.getAccessToken();
    if (!accessTokenObj || !accessTokenObj.token) {
        throw new Error('Not authenticated. Please log in first.');
    }

    const actionUrl = `${AI_CHAT_BASE_URL}/ai-chat`;

    const response = await fetchWithRetry(actionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessTokenObj.token}`,
            'x-api-key': window.adobeIMS?.adobeIdData?.client_id || '',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to communicate with AI service');
    }

    return response.json();
}
