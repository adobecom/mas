#!/usr/bin/env node

/**
 * Test script for automatic card property extraction
 * This script tests the auto-extract functionality with better error handling
 */

import { chromium } from 'playwright';
import { CardExtractor } from './src/generators/card-extractor.js';

async function testAutoExtraction() {
    const cardId = '549f6981-f5c8-4512-b41c-313d60f375b2';
    const branch = 'main';

    console.log(`🧪 Testing automatic extraction for card: ${cardId}`);
    console.log(`📍 Branch: ${branch}`);

    const extractor = new CardExtractor();
    const baseUrl = extractor.buildBaseUrl(branch);
    const url = `${baseUrl}/studio.html#query=${cardId}`;

    console.log(`🌐 Target URL: ${url}`);

    const browser = await chromium.launch({
        headless: false, // Use headed mode for debugging
        slowMo: 1000, // Slow down for better visibility
    });

    const page = await browser.newPage();

    try {
        console.log('📂 Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        console.log('⏳ Waiting for page to load...');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000); // Give more time for loading

        console.log('🔍 Looking for card...');
        const cardSelector = `merch-card[id="${cardId}"]`;

        // Check if any merch-card elements exist
        const allCards = await page.locator('merch-card').count();
        console.log(`📊 Found ${allCards} merch-card elements on page`);

        // Check if our specific card exists
        const targetCard = await page.locator(cardSelector).count();
        console.log(`🎯 Target card found: ${targetCard > 0 ? 'YES' : 'NO'}`);

        if (targetCard === 0) {
            // List all card IDs on the page for debugging
            const cardIds = await page.evaluate(() => {
                const cards = document.querySelectorAll('merch-card');
                return Array.from(cards).map((card) => card.id || 'NO_ID');
            });
            console.log('📋 Available card IDs on page:', cardIds);
            throw new Error(
                `Card with ID "${cardId}" not found. Available cards: ${cardIds.join(', ')}`,
            );
        }

        console.log('⏳ Waiting for card to be ready...');
        await page.waitForSelector(cardSelector, { timeout: 20000 });

        // Wait for card to be loaded
        await page
            .waitForFunction(
                (selector) => {
                    const card = document.querySelector(selector);
                    return (
                        card &&
                        (card.hasAttribute('loaded') ||
                            card.querySelector('[slot]'))
                    );
                },
                cardSelector,
                { timeout: 15000 },
            )
            .catch(() => {
                console.log(
                    '⚠️  Card loaded attribute check timed out, continuing anyway...',
                );
            });

        console.log('🔧 Extracting properties...');
        const extractionScript = extractor.generateExtractionScript(
            cardId,
            branch,
        );
        const result = await page.evaluate(
            new Function('return ' + extractionScript)(),
        );

        console.log('✅ Extraction successful!');
        console.log('📊 Results:');
        console.log(`   - Card Type: ${result.cardType}`);
        console.log(`   - Elements: ${Object.keys(result.elements).length}`);
        console.log(
            `   - CSS Properties: ${Object.keys(result.cssProperties.card || {}).length}`,
        );
        console.log(`   - Test Types: ${result.testTypes.join(', ')}`);

        console.log('\n📄 Full Configuration:');
        console.log(JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error during extraction:', error.message);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('📸 Debug screenshot saved as debug-screenshot.png');

        throw error;
    } finally {
        console.log('🔒 Closing browser...');
        await browser.close();
    }
}

// Run the test
testAutoExtraction()
    .then(() => {
        console.log('🎉 Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test failed:', error.message);
        process.exit(1);
    });
