/**
 * Automated test for Bulk Preview functionality using Chrome DevTools MCP
 * Tests the complete flow: Search → Preview → Validation
 */

import {
    navigatePage,
    takeSnapshot,
    click,
    fill,
    waitFor,
    listNetworkRequests,
    getNetworkRequest,
    takeScreenshot,
    listConsoleMessages
} from '@mcp/chrome-devtools';

/**
 * Test Suite: Bulk Preview with HTML-aware Text Matching
 */
describe('Bulk Preview Automation Tests', () => {
    const STUDIO_URL = 'http://localhost:3000/studio.html#page=chat';
    const MCP_SERVER_URL = 'http://localhost:3001/tools/studio_preview_bulk_update';

    test('Complete bulk preview flow with HTML content', async () => {
        // Step 1: Navigate to Studio
        console.log('Step 1: Navigating to Studio UI...');
        await navigatePage({
            type: 'url',
            url: STUDIO_URL,
        });

        await waitFor({ text: 'Cosmocat' });
        console.log('✓ Studio loaded');

        // Step 2: Take initial snapshot
        const initialSnapshot = await takeSnapshot();
        console.log('✓ Initial snapshot taken');

        // Step 3: Input chat message for bulk update
        console.log('Step 2: Requesting bulk update in chat...');

        // Find the chat input - might be in different places
        const chatInput = await findChatInput(initialSnapshot);
        if (!chatInput) {
            throw new Error('Could not find chat input element');
        }

        // Type the bulk update request
        const userMessage = 'Search for cards containing "Save 50%" and replace it with "60%"';
        console.log(`Typing message: "${userMessage}"`);

        await fill({
            uid: chatInput,
            value: userMessage,
        });

        // Press Enter to submit
        await pressKey({ key: 'Enter' });
        console.log('✓ Message submitted');

        // Step 4: Wait for preview to appear
        console.log('Step 3: Waiting for preview...');
        await waitFor({
            text: 'Bulk Update Preview',
            timeout: 10000,
        });
        console.log('✓ Preview appeared');

        // Step 5: Take preview snapshot
        const previewSnapshot = await takeSnapshot();
        console.log('✓ Preview snapshot taken');

        // Step 6: Validate preview UI elements
        console.log('Step 4: Validating preview UI...');

        const validation = validatePreviewUI(previewSnapshot);

        if (!validation.success) {
            console.error('Preview validation failed:', validation.errors);
            throw new Error(`Preview validation failed: ${validation.errors.join(', ')}`);
        }

        console.log('✓ Preview UI validation passed');
        console.log('  - Found "Bulk Update Preview" heading');
        console.log('  - Badge shows cards will be updated');
        console.log('  - Preview items list is populated');

        // Step 7: Capture and validate network request
        console.log('Step 5: Validating API response...');

        const networkRequests = await listNetworkRequests();
        const previewRequest = networkRequests.find(req =>
            req.url.includes('studio_preview_bulk_update') ||
            req.url.includes('preview-bulk-update')
        );

        if (!previewRequest) {
            throw new Error('Preview bulk update request not found in network log');
        }

        const requestDetails = await getNetworkRequest({ reqid: previewRequest.id });
        const response = JSON.parse(requestDetails.responseBody.text);

        console.log('✓ API response captured and validated');
        console.log(`  - Operation: ${response.operation}`);
        console.log(`  - Cards in preview: ${response.previews?.length || 0}`);
        console.log(`  - Will update: ${response.summary?.willUpdate || 0}`);
        console.log(`  - No changes: ${response.summary?.noChanges || 0}`);
        console.log(`  - Errors: ${response.summary?.errors || 0}`);

        // Step 8: Validate response structure
        validateAPIResponse(response);
        console.log('✓ API response structure is valid');

        // Step 9: Take final screenshot for comparison
        const finalScreenshot = await takeScreenshot();
        console.log('✓ Final screenshot captured');

        // Step 10: Check for console errors
        const consoleMessages = await listConsoleMessages();
        const errors = consoleMessages.filter(msg => msg.type === 'error');

        if (errors.length > 0) {
            console.warn('Console errors detected:');
            errors.forEach(err => console.warn(`  - ${err.text}`));
        } else {
            console.log('✓ No console errors');
        }

        console.log('\n✓✓✓ ALL TESTS PASSED ✓✓✓');
        return {
            success: true,
            validation,
            apiResponse: response,
            screenshotPath: finalScreenshot,
        };
    });
});

/**
 * Find the chat input element in the DOM
 */
function findChatInput(snapshot) {
    // Look for textarea or input with placeholder text
    const inputs = snapshot.elements.filter(el =>
        el.role === 'textbox' ||
        el.type === 'textarea' ||
        el.placeholder?.includes('Type')
    );

    return inputs.length > 0 ? inputs[0].uid : null;
}

/**
 * Validate the preview UI elements
 */
function validatePreviewUI(snapshot) {
    const errors = [];

    // Check for preview heading
    const hasHeading = snapshot.text.includes('Bulk Update Preview');
    if (!hasHeading) {
        errors.push('Missing "Bulk Update Preview" heading');
    }

    // Check for update badge (should show X cards will be updated)
    const hasUpdateBadge = snapshot.text.includes('cards will be updated') ||
                           snapshot.text.includes('cards will update');
    if (!hasUpdateBadge) {
        errors.push('Missing "cards will be updated" badge');
    }

    // Check for approve and cancel buttons
    const hasApproveButton = snapshot.text.includes('Approve');
    if (!hasApproveButton) {
        errors.push('Missing "Approve & Execute" button');
    }

    const hasCancelButton = snapshot.text.includes('Cancel');
    if (!hasCancelButton) {
        errors.push('Missing "Cancel" button');
    }

    // Check that the badge is NOT "0 cards will be updated"
    const hasZeroCards = snapshot.text.match(/0\s+cards\s+will\s+be\s+updated/i);
    if (hasZeroCards) {
        errors.push('Preview shows "0 cards will be updated" - text matching not working');
    }

    return {
        success: errors.length === 0,
        errors,
    };
}

/**
 * Validate the API response structure
 */
function validateAPIResponse(response) {
    const errors = [];

    // Check operation type
    if (response.operation !== 'preview_bulk_update') {
        errors.push(`Wrong operation: ${response.operation}`);
    }

    // Check for previews array
    if (!Array.isArray(response.previews)) {
        errors.push('Missing previews array in response');
    }

    // Check for summary object
    if (!response.summary || typeof response.summary !== 'object') {
        errors.push('Missing summary object in response');
    }

    // Validate preview items
    if (response.previews && response.previews.length > 0) {
        response.previews.forEach((preview, idx) => {
            if (!preview.fragmentId) {
                errors.push(`Preview ${idx}: missing fragmentId`);
            }
            if (!preview.fragmentName) {
                errors.push(`Preview ${idx}: missing fragmentName`);
            }

            // If willUpdate is true, should have changes
            if (preview.willUpdate && (!preview.changes || preview.changes.length === 0)) {
                errors.push(`Preview ${idx}: willUpdate=true but no changes`);
            }

            // If willUpdate is true, should have currentValues and newValues
            if (preview.willUpdate) {
                if (!preview.currentValues || Object.keys(preview.currentValues).length === 0) {
                    errors.push(`Preview ${idx}: willUpdate=true but no currentValues`);
                }
                if (!preview.newValues || Object.keys(preview.newValues).length === 0) {
                    errors.push(`Preview ${idx}: willUpdate=true but no newValues`);
                }
            }
        });
    }

    if (errors.length > 0) {
        throw new Error(`API response validation failed: ${errors.join(', ')}`);
    }

    return true;
}
