#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PageObjectGenerator } from './generators/page-object-generator.js';
import { SpecGenerator } from './generators/spec-generator.js';
import { TestGenerator } from './generators/test-generator.js';
import { CardExtractor } from './generators/card-extractor.js';
import { getSimplifiedCardTypes } from './utils/variant-reader.js';
import {
    saveCompleteTestSuite,
    getFileSaveSummary,
    getCardSurface,
    getNALADirectoryPath,
} from './utils/file-output.js';
import {
    runNALATest,
    validateGeneratedFiles,
    runCompleteTestSuite,
    generateTestReport,
} from './utils/test-runner.js';
import { autoFixAllErrors } from './utils/error-fixer.js';
import { join } from 'path';
import { existsSync } from 'fs';
import { runNALATestWithFixes } from './nala-test-runner.js';

/**
 * @typedef {import('./types.js').CardConfig} CardConfig
 * @typedef {import('./types.js').TestType} TestType
 */

// Get card types dynamically from the source
const dynamicCardTypes = getSimplifiedCardTypes();

const CardConfigSchema = z.object({
    cardType: z.enum(dynamicCardTypes),
    cardId: z.string(),
    testSuite: z.string(),
    elements: z.object({
        title: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        eyebrow: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        description: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        price: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        strikethroughPrice: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        cta: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        icon: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        legalLink: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
        backgroundImage: z
            .object({
                selector: z.string(),
                expectedText: z.string().optional(),
                expectedValue: z.string().optional(),
                expectedAttribute: z.string().optional(),
                cssProperties: z.record(z.string()).optional(),
                interactions: z
                    .array(
                        z.object({
                            type: z.enum([
                                'click',
                                'hover',
                                'type',
                                'select',
                                'edit',
                            ]),
                            value: z.string().optional(),
                            waitFor: z.string().optional(),
                            expectedResult: z.string().optional(),
                        }),
                    )
                    .optional(),
            })
            .optional(),
    }),
    cssProperties: z.record(z.record(z.string())).optional(),
    testTypes: z.array(
        z.enum(['css', 'functional', 'edit', 'save', 'discard', 'interaction']),
    ),
    metadata: z
        .object({
            tags: z.array(z.string()).optional(),
            browserParams: z.string().optional(),
            path: z.string().optional(),
        })
        .optional(),
});

const server = new McpServer({
    name: 'nala-test-generator',
    version: '1.0.0',
    capabilities: {
        tools: {},
    },
});

const pageObjectGenerator = new PageObjectGenerator();
const specGenerator = new SpecGenerator();
const testGenerator = new TestGenerator();
const cardExtractor = new CardExtractor();

server.tool(
    'generate-page-object',
    'Generate a NALA page object file for a card component',
    {
        config: CardConfigSchema.describe(
            'Card configuration including selectors, CSS properties, and test metadata',
        ),
    },
    async ({ config }) => {
        try {
            const cardConfig = /** @type {CardConfig} */ (config);
            const pageObjectCode =
                pageObjectGenerator.generatePageObject(cardConfig);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated page object for ${cardConfig.cardType} card:\n\n\`\`\`javascript\n${pageObjectCode}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating page object: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-test-spec',
    'Generate a NALA test specification file for a card component',
    {
        config: CardConfigSchema.describe(
            'Card configuration including test types and metadata',
        ),
    },
    async ({ config }) => {
        try {
            const cardConfig = /** @type {CardConfig} */ (config);
            const specCode = specGenerator.generateSpecFile(cardConfig, 'css');

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated test specification for ${cardConfig.cardType} card:\n\n\`\`\`javascript\n${specCode}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating test spec: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-test-implementation',
    'Generate a NALA test implementation file for a specific test type',
    {
        config: CardConfigSchema.describe('Card configuration'),
        testType: z
            .enum([
                'css',
                'functional',
                'edit',
                'save',
                'discard',
                'interaction',
            ])
            .describe('Type of test to generate'),
    },
    async ({ config, testType }) => {
        try {
            const cardConfig = /** @type {CardConfig} */ (config);
            const testTypeEnum = /** @type {TestType} */ (testType);
            const testCode = testGenerator.generateTestFile(
                cardConfig,
                testTypeEnum,
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated ${testType} test implementation for ${cardConfig.cardType} card:\n\n\`\`\`javascript\n${testCode}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating test implementation: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-complete-test-suite',
    'Generate a complete NALA test suite including page object, specs, and all test implementations',
    {
        config: CardConfigSchema.describe('Complete card configuration'),
    },
    async ({ config }) => {
        try {
            const cardConfig = /** @type {CardConfig} */ (config);

            const pageObjectCode =
                pageObjectGenerator.generatePageObject(cardConfig);
            const specCode = specGenerator.generateSpecFile(cardConfig, 'css');

            const testFiles = {};
            for (const testType of cardConfig.testTypes) {
                testFiles[testType] = testGenerator.generateTestFile(
                    cardConfig,
                    testType,
                );
            }

            let result = `# Complete NALA Test Suite for ${cardConfig.cardType} Card\n\n`;

            result += `## Page Object (${cardConfig.cardType}.page.js)\n\n\`\`\`javascript\n${pageObjectCode}\n\`\`\`\n\n`;

            result += `## Test Specification (${cardConfig.cardType}_css.spec.js)\n\n\`\`\`javascript\n${specCode}\n\`\`\`\n\n`;

            for (const [testType, testCode] of Object.entries(testFiles)) {
                result += `## ${testType.toUpperCase()} Test Implementation (${cardConfig.cardType}_${testType}.test.js)\n\n\`\`\`javascript\n${testCode}\n\`\`\`\n\n`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating complete test suite: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'create-suggested-card-example',
    'Create an example configuration for the suggested card type based on the existing NALA structure',
    {},
    async () => {
        /** @type {CardConfig} */
        const suggestedCardConfig = {
            cardType: 'suggested',
            cardId: '206a8742-0289-4196-92d4-ced99ec4191e',
            testSuite: 'M@S Studio CCD Suggested',
            elements: {
                title: {
                    selector: 'h3[slot="heading-xs"]',
                    expectedText: 'Sample Title',
                    cssProperties: {
                        color: 'rgb(44, 44, 44)',
                        'font-size': '16px',
                        'font-weight': '700',
                        'line-height': '20px',
                    },
                    interactions: [{ type: 'edit', value: 'New Title' }],
                },
                eyebrow: {
                    selector: 'h4[slot="detail-s"]',
                    expectedText: 'Sample Eyebrow',
                    cssProperties: {
                        color: 'rgb(110, 110, 110)',
                        'font-size': '11px',
                        'font-weight': '700',
                        'line-height': '14px',
                    },
                    interactions: [{ type: 'edit', value: 'New Eyebrow' }],
                },
                description: {
                    selector: 'div[slot="body-xs"] p',
                    expectedText: 'Sample description text',
                    cssProperties: {
                        color: 'rgb(75, 75, 75)',
                        'font-size': '14px',
                        'font-weight': '400',
                        'line-height': '21px',
                    },
                    interactions: [{ type: 'edit', value: 'New description' }],
                },
                price: {
                    selector: 'p[slot="price"]',
                    expectedText: 'US$17.24/mo',
                    cssProperties: {
                        color: 'rgb(34, 34, 34)',
                        'font-size': '14px',
                        'font-weight': '400',
                        'line-height': '21px',
                    },
                },
                strikethroughPrice: {
                    selector: '.price-strikethrough',
                    expectedText: 'US$34.49/mo',
                    cssProperties: {
                        color: 'rgb(109, 109, 109)',
                        'font-size': '14px',
                        'font-weight': '400',
                        'text-decoration-line': 'line-through',
                        'text-decoration-color': 'rgb(109, 109, 109)',
                    },
                },
                cta: {
                    selector: 'div[slot="cta"] > button',
                    expectedText: 'Buy now',
                    cssProperties: {
                        color: 'rgb(34, 34, 34)',
                        'font-size': '14px',
                        'font-weight': '700',
                    },
                    interactions: [{ type: 'click' }],
                },
                icon: {
                    selector: 'merch-icon',
                    cssProperties: {
                        width: '40px',
                        height: '38px',
                    },
                },
                legalLink: {
                    selector: 'div[slot="body-xs"] p > a',
                    cssProperties: {
                        color: 'rgb(2, 101, 220)',
                        'font-size': '12px',
                        'font-weight': '400',
                        'line-height': '18px',
                    },
                    interactions: [{ type: 'click' }],
                },
            },
            cssProperties: {
                card: {
                    'background-color': 'rgb(245, 245, 245)',
                    'border-bottom-color': 'rgb(225, 225, 225)',
                    'border-left-color': 'rgb(225, 225, 225)',
                    'border-right-color': 'rgb(225, 225, 225)',
                    'border-top-color': 'rgb(225, 225, 225)',
                    'min-width': '270px',
                    'max-width': '305px',
                    'min-height': '205px',
                },
            },
            testTypes: ['css', 'functional', 'edit', 'save', 'discard'],
            metadata: {
                tags: ['@mas-studio', '@ccd', '@ccd-suggested'],
                browserParams: '#query=',
                path: '/studio.html',
            },
        };

        return {
            content: [
                {
                    type: 'text',
                    text: `Example configuration for suggested card:\n\n\`\`\`json\n${JSON.stringify(suggestedCardConfig, null, 2)}\n\`\`\`\n\nYou can use this configuration with the other tools to generate complete NALA test suites.`,
                },
            ],
        };
    },
);

server.tool(
    'extract-card-properties',
    'Generate extraction script to automatically extract properties from a live Merch at Scale card',
    {
        cardId: z
            .string()
            .describe('The ID of the merch card to extract properties from'),
        branch: z
            .string()
            .optional()
            .describe(
                "Branch name (e.g., 'main', 'feature-branch') or full URL (defaults to 'main')",
            ),
        path: z
            .string()
            .optional()
            .describe("Page path (default: '/studio.html')"),
        browserParams: z
            .string()
            .optional()
            .describe("Browser parameters (default: '#query=')"),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (e.g., 'MWPW-170520')"),
    },
    async ({ cardId, branch = 'main', path, browserParams, milolibs }) => {
        try {
            const options = { path, browserParams, milolibs };
            const extractionData = await cardExtractor.extractFromLiveCard(
                cardId,
                branch,
                options,
            );

            let result = `# Card Property Extraction for ${cardId}\n\n`;
            result += `## Instructions\n\n`;
            extractionData.instructions.forEach((instruction, index) => {
                result += `${index + 1}. ${instruction}\n`;
            });

            result += `\n## Extraction Script\n\n`;
            result += `Copy and paste this script into your browser console:\n\n`;
            result += `\`\`\`javascript\n${extractionData.extractionScript}\n\`\`\`\n\n`;

            result += `## Target URL\n\n`;
            result += `${extractionData.baseUrl}${extractionData.path}${extractionData.browserParams}${extractionData.cardId}\n\n`;

            result += `## Next Steps\n\n`;
            result += `After running the extraction script:\n`;
            result += `1. Copy the JSON output from the browser console\n`;
            result += `2. Save it to a file (e.g., \`${cardId}-config.json\`)\n`;
            result += `3. Use it with the \`generate-complete-test-suite\` tool\n`;

            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating extraction script: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-playwright-extractor',
    'Generate a Playwright script for automated card property extraction',
    {
        cardId: z
            .string()
            .describe('The ID of the merch card to extract properties from'),
        branch: z
            .string()
            .optional()
            .describe(
                "Branch name (e.g., 'main', 'feature-branch') or full URL (defaults to 'main')",
            ),
        path: z
            .string()
            .optional()
            .describe("Page path (default: '/studio.html')"),
        browserParams: z
            .string()
            .optional()
            .describe("Browser parameters (default: '#query=')"),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (e.g., 'MWPW-170520')"),
    },
    async ({ cardId, branch = 'main', path, browserParams, milolibs }) => {
        try {
            const options = { path, browserParams, milolibs };
            const playwrightScript =
                cardExtractor.generatePlaywrightExtractionScript(
                    cardId,
                    branch,
                    options,
                );

            let result = `# Playwright Card Extractor for ${cardId}\n\n`;
            result += `## Prerequisites\n\n`;
            result += `1. Install Playwright: \`npm install playwright\`\n`;
            result += `2. Save the script below to a file (e.g., \`extract-${cardId}.js\`)\n`;
            result += `3. Run: \`node extract-${cardId}.js\`\n\n`;

            result += `## Extraction Script\n\n`;
            result += `\`\`\`javascript\n${playwrightScript}\n\`\`\`\n\n`;

            result += `## Usage\n\n`;
            result += `1. Save the script to \`extract-${cardId}.js\`\n`;
            result += `2. Run \`node extract-${cardId}.js\`\n`;
            result += `3. The script will output the extracted configuration JSON\n`;
            result += `4. Save the JSON to a config file and use with other tools\n`;

            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating Playwright extractor: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'extract-and-generate-tests',
    'Complete workflow: extract card properties and generate NALA tests (requires manual extraction step)',
    {
        cardId: z
            .string()
            .describe(
                'The ID of the merch card to extract and generate tests for',
            ),
        branch: z
            .string()
            .optional()
            .describe(
                "Branch name (e.g., 'main', 'feature-branch') or full URL (defaults to 'main')",
            ),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (e.g., 'MWPW-170520')"),
        extractedData: z
            .object({
                cardType: z.string(),
                cardId: z.string(),
                elements: z.record(z.any()),
                cssProperties: z.record(z.any()).optional(),
                testTypes: z.array(z.string()),
                interactions: z.record(z.any()).optional(),
                metadata: z.record(z.any()).optional(),
            })
            .optional()
            .describe('Previously extracted card data (if available)'),
    },
    async ({ cardId, branch = 'main', milolibs, extractedData }) => {
        try {
            if (!extractedData) {
                // Generate extraction instructions
                const options = { milolibs };
                const extractionData = await cardExtractor.extractFromLiveCard(
                    cardId,
                    branch,
                    options,
                );

                let result = `# Step 1: Extract Card Properties\n\n`;
                result += `First, extract the card properties using the browser console:\n\n`;
                extractionData.instructions.forEach((instruction, index) => {
                    result += `${index + 1}. ${instruction}\n`;
                });

                result += `\n## Extraction Script\n\n`;
                result += `\`\`\`javascript\n${extractionData.extractionScript}\n\`\`\`\n\n`;

                result += `## Step 2: Generate Tests\n\n`;
                result += `After extracting the data, call this tool again with the \`extractedData\` parameter containing the JSON output from the browser console.\n`;

                return {
                    content: [
                        {
                            type: 'text',
                            text: result,
                        },
                    ],
                };
            } else {
                // Generate tests from extracted data
                const config =
                    cardExtractor.createConfigFromExtractedData(extractedData);

                const pageObjectCode =
                    pageObjectGenerator.generatePageObject(config);
                const specCode = specGenerator.generateSpecFile(config, 'css');

                const testFiles = {};
                for (const testType of config.testTypes) {
                    testFiles[testType] = testGenerator.generateTestFile(
                        config,
                        testType,
                    );
                }

                let result = `# Complete NALA Test Suite for Card ${cardId}\n\n`;
                result += `Generated from extracted properties for ${config.cardType} card.\n\n`;

                result += `## Page Object (${config.cardType}.page.js)\n\n\`\`\`javascript\n${pageObjectCode}\n\`\`\`\n\n`;

                result += `## Test Specification (${config.cardType}_css.spec.js)\n\n\`\`\`javascript\n${specCode}\n\`\`\`\n\n`;

                for (const [testType, testCode] of Object.entries(testFiles)) {
                    result += `## ${testType.toUpperCase()} Test Implementation (${config.cardType}_${testType}.test.js)\n\n\`\`\`javascript\n${testCode}\n\`\`\`\n\n`;
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: result,
                        },
                    ],
                };
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error in extract and generate workflow: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'auto-extract-card-properties',
    'Automatically extract card properties using Playwright (fully automated)',
    {
        cardId: z
            .string()
            .describe('The ID of the merch card to extract properties from'),
        branch: z
            .string()
            .optional()
            .describe(
                "Branch name (e.g., 'main', 'feature-branch') or full URL (defaults to 'main')",
            ),
        path: z
            .string()
            .optional()
            .describe("Page path (default: '/studio.html')"),
        browserParams: z
            .string()
            .optional()
            .describe("Browser parameters (default: '#query=')"),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (e.g., 'MWPW-170520')"),
        headless: z
            .boolean()
            .optional()
            .describe('Run browser in headless mode (default: true)'),
    },
    async ({
        cardId,
        branch = 'main',
        path,
        browserParams,
        milolibs,
        headless = true,
    }) => {
        try {
            const { chromium } = await import('playwright');

            const options = { path, browserParams, milolibs };
            const baseUrl = cardExtractor.buildBaseUrl(branch, milolibs);
            const finalPath = path || '/studio.html';
            const finalBrowserParams = browserParams || '#query=';
            const url = `${baseUrl}${finalPath}${finalBrowserParams}${cardId}`;

            // Note: Console output disabled to prevent MCP JSON parsing issues
            // console.error(`Opening browser and navigating to: ${url}`);

            const browser = await chromium.launch({ headless });

            // Try to use existing auth state if available
            const authFile = join(process.cwd(), 'nala/.auth/user.json');
            let context;

            if (existsSync(authFile)) {
                // Note: Console output disabled to prevent MCP JSON parsing issues
                // console.error('Using existing authentication state...');
                context = await browser.newContext({
                    storageState: authFile,
                });
            } else {
                context = await browser.newContext();
            }

            const page = await context.newPage();

            try {
                await page.goto(url, { waitUntil: 'networkidle' });

                // Wait for the page to be fully loaded
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(3000);

                // Check if card exists first - try multiple selectors
                let cardLocator = null;
                let cardExists = 0;

                // Try direct ID selector
                cardLocator = page.locator(`merch-card[id="${cardId}"]`);
                cardExists = await cardLocator.count();

                // Try finding card containing aem-fragment
                if (cardExists === 0) {
                    cardLocator = page.locator('merch-card').filter({
                        has: page.locator(`aem-fragment[fragment="${cardId}"]`),
                    });
                    cardExists = await cardLocator.count();
                }

                if (cardExists === 0) {
                    throw new Error(
                        `Card with ID "${cardId}" not found on the page. Please verify the card ID and branch.`,
                    );
                }

                // Wait for card to be visible and loaded
                await cardLocator
                    .first()
                    .waitFor({ state: 'visible', timeout: 20000 });

                // Wait for card to have the 'loaded' attribute or timeout
                await page
                    .waitForFunction(
                        (cardId) => {
                            // Find the card using the same logic as extraction script
                            let card = document.querySelector(
                                `merch-card[id="${cardId}"]`,
                            );
                            if (!card) {
                                const fragment = document.querySelector(
                                    `aem-fragment[fragment="${cardId}"]`,
                                );
                                if (fragment) {
                                    card = fragment.closest('merch-card');
                                }
                            }
                            return (
                                card &&
                                (card.hasAttribute('loaded') ||
                                    card.querySelector('[slot]'))
                            );
                        },
                        cardId,
                        { timeout: 10000 },
                    )
                    .catch(() => {});

                // Additional wait for card content to be fully rendered
                await page.waitForTimeout(2000);

                // Use the new LiveCardExtractor for precise extraction
                const { LiveCardExtractor } = await import(
                    './utils/live-card-extractor.js'
                );
                const liveExtractor = new LiveCardExtractor();

                // Close the browser first since LiveCardExtractor will open its own
                await browser.close();

                // Use dynamic extraction - auto-detect card type
                const result = await liveExtractor.extractActualCSSProperties(
                    cardId,
                    milolibs,
                );

                if (result.error) {
                    throw new Error(result.error);
                }

                const cssProps =
                    liveExtractor.generateCSSPropertyObject(result);
                const detectedCardType = result.cardType || 'unknown';

                let response = `# Dynamically Extracted Card Properties\n\n`;
                response += `**Card ID**: ${cardId}\n`;
                response += `**Branch**: ${branch}\n`;
                response += `**Card Type**: ${detectedCardType} (auto-detected)\n`;
                response += `**URL**: ${url}\n\n`;

                response += `## Extracted CSS Properties (Spec-Compliant)\n\n`;
                response += `\`\`\`json\n${JSON.stringify(cssProps, null, 2)}\n\`\`\`\n\n`;

                response += `## Raw Extraction Data\n\n`;
                response += `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n`;

                response += `## Summary\n\n`;
                response += `- **Card Type**: ${detectedCardType} (auto-detected)\n`;
                response += `- **Elements found**: ${Object.keys(result.elements).length}\n`;
                response += `- **CSS properties extracted**: ${Object.keys(cssProps.card || {}).length}\n`;
                response += `- **Slots detected**: ${result.slots.length}\n`;
                response += `- **Extraction method**: Dynamic (all meaningful properties)\n\n`;

                response += `## Next Steps\n\n`;
                response += `You can now use this configuration with:\n`;
                response += `- \`generate-complete-test-suite\` to create all test files\n`;
                response += `- Individual generators for specific components\n`;

                return {
                    content: [
                        {
                            type: 'text',
                            text: response,
                        },
                    ],
                };
            } finally {
                await browser.close();
            }
        } catch (error) {
            if (error.message.includes('playwright')) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ Playwright not installed. Please install it first:\n\n\`\`\`bash\nnpm install playwright\nnpx playwright install\n\`\`\`\n\nThen try again.`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error during automatic extraction: ${error instanceof Error ? error.message : String(error)}\n\nTry using the manual extraction method instead:\n\`\`\`bash\nnode cursor-integration.js extract "${cardId}" "${branch}"\n\`\`\``,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-single-test-type',
    'Generate NALA tests for a specific test type with card ID and branch',
    {
        testType: z
            .enum(['css', 'edit', 'save', 'discard'])
            .describe('Type of test to generate (css, edit, save, discard)'),
        cardId: z
            .string()
            .describe('The ID of the merch card to generate tests for'),
        branch: z
            .string()
            .describe(
                "Branch name (e.g., 'main', 'feature-branch') or full URL (defaults to 'main')",
            ),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (e.g., 'MWPW-170520')"),
        cardType: z
            .enum(dynamicCardTypes)
            .optional()
            .describe(
                'Type of card (optional - will be auto-detected if not provided)',
            ),
    },
    async ({ testType, cardId, branch, milolibs, cardType }) => {
        try {
            const cardExtractor = new CardExtractor();
            const pageObjectGenerator = new PageObjectGenerator();
            const specGenerator = new SpecGenerator();
            const testGenerator = new TestGenerator();

            // Step 1: Extract card properties if cardType not provided
            let cardTypeDetected = cardType;
            if (!cardTypeDetected) {
                const extractorScript = cardExtractor.generateExtractionScript(
                    cardId,
                    branch || 'main',
                    '/studio.html',
                    milolibs,
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Card type not provided. Please run this extraction script first to detect the card type:\n\n\`\`\`javascript\n${extractorScript}\n\`\`\`\n\nThen run this tool again with the detected cardType.`,
                        },
                    ],
                };
            }

            // Step 2: Create a basic configuration for the specified test type
            const config = {
                cardType: cardTypeDetected,
                cardId: cardId,
                testSuite: `${cardTypeDetected}-${testType}`,
                testTypes: [testType],
                elements: {
                    title: { selector: '.card-title' },
                    eyebrow: { selector: '.card-eyebrow' },
                    description: { selector: '.card-description' },
                    price: { selector: '.card-price' },
                    cta: { selector: '.card-cta' },
                    icon: { selector: '.card-icon' },
                    backgroundImage: { selector: '.card-background' },
                },
                metadata: {
                    path:
                        milolibs === 'local'
                            ? '/studio.html?milolibs=local'
                            : '/studio.html',
                    browserParams:
                        milolibs === 'local'
                            ? '#page=content&path=nala&query='
                            : '#query=',
                    tags: [`@${cardTypeDetected}-${testType}`],
                    milolibs: milolibs,
                },
            };

            // Step 3: Generate the files
            const pageObject = pageObjectGenerator.generatePageObject(config);
            const spec = specGenerator.generateSpecFile(config, testType);
            const test = testGenerator.generateTestFile(config, testType);

            // Step 4: Save files to NALA structure
            const savedFiles = saveCompleteTestSuite(
                cardTypeDetected,
                {
                    pageObject,
                    spec,
                    test,
                },
                testType,
            );

            const branchDetected = branch || 'main';
            const branchInfo =
                branchDetected !== 'main' ? ` (branch: ${branchDetected})` : '';
            const fileSummary = getFileSaveSummary(cardTypeDetected, testType);

            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Generated and saved ${testType} test files for card ${cardId}${branchInfo}

📁 **Files saved to NALA structure (${fileSummary.surface} surface):**

• **Page Object**: \`${savedFiles.pageObject}\`
• **Test Spec**: \`${savedFiles.spec}\`  
• **Test Implementation**: \`${savedFiles.test}\`

## Generated Content:

### Page Object (${cardTypeDetected}.page.js)
\`\`\`javascript
${pageObject}
\`\`\`

### Test Spec (${cardTypeDetected}_${testType}.spec.js)
\`\`\`javascript
${spec}
\`\`\`

### Test Implementation (${cardTypeDetected}_${testType}.test.js)
\`\`\`javascript
${test}
\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    },
);

server.tool(
    'validate-generated-tests',
    'Validate generated NALA test files for syntax and structure',
    {
        cardType: z.enum(dynamicCardTypes).describe('Type of card to validate'),
        testType: z
            .enum(['css', 'edit', 'save', 'discard'])
            .describe('Type of test to validate'),
    },
    async ({ cardType, testType }) => {
        try {
            console.error(
                `Validating generated files for ${cardType} ${testType}...`,
            );

            const validation = await validateGeneratedFiles(cardType, testType);

            let result = `# Validation Report for ${cardType} ${testType} Tests\n\n`;

            if (validation.valid) {
                result += `✅ **All files are valid!**\n\n`;
            } else {
                result += `❌ **Validation failed with ${validation.errors.length} errors**\n\n`;
            }

            if (validation.errors.length > 0) {
                result += `## Errors\n\n`;
                validation.errors.forEach((error) => {
                    result += `- ${error}\n`;
                });
                result += `\n`;
            }

            if (validation.warnings.length > 0) {
                result += `## Warnings\n\n`;
                validation.warnings.forEach((warning) => {
                    result += `- ${warning}\n`;
                });
                result += `\n`;
            }

            result += `## File Status\n\n`;
            Object.entries(validation.files).forEach(([fileType, fileInfo]) => {
                const status = fileInfo.valid ? '✅' : '❌';
                result += `- **${fileType}**: ${status} ${fileInfo.path}\n`;
                if (fileInfo.error) {
                    result += `  - Error: ${fileInfo.error}\n`;
                }
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: result,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error during validation: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'run-generated-tests',
    'Execute generated NALA tests and report results',
    {
        cardType: z.enum(dynamicCardTypes).describe('Type of card to test'),
        testType: z
            .enum(['css', 'edit', 'save', 'discard'])
            .describe('Type of test to run'),
        headless: z
            .boolean()
            .optional()
            .describe('Run browser in headless mode (default: true)'),
        browser: z
            .enum(['chromium', 'firefox', 'webkit'])
            .optional()
            .describe('Browser to use (default: chromium)'),
        timeout: z
            .number()
            .optional()
            .describe('Test timeout in milliseconds (default: 30000)'),
        dryRun: z
            .boolean()
            .optional()
            .describe(
                'Only validate files without running tests (default: false)',
            ),
    },
    async ({
        cardType,
        testType,
        headless = true,
        browser = 'chromium',
        timeout = 30000,
        dryRun = false,
    }) => {
        try {
            console.error(
                `Running ${dryRun ? 'validation for' : 'tests for'} ${cardType} ${testType}...`,
            );

            const result = await runNALATest(cardType, testType, {
                headless,
                browser,
                timeout,
                dryRun,
            });

            let response = `# Test Execution Report for ${cardType} ${testType}\n\n`;

            if (result.success) {
                response += `✅ **Tests ${dryRun ? 'validated' : 'passed'} successfully!**\n\n`;
            } else {
                response += `❌ **Tests failed**\n\n`;
            }

            response += `**Duration**: ${result.duration}ms\n`;
            response += `**Mode**: ${dryRun ? 'Validation only' : 'Full execution'}\n`;
            if (!dryRun) {
                response += `**Browser**: ${browser} (${headless ? 'headless' : 'headed'})\n`;
            }
            response += `\n`;

            if (result.error) {
                response += `## Error\n\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
            }

            if (result.warnings.length > 0) {
                response += `## Warnings\n\n`;
                result.warnings.forEach((warning) => {
                    response += `- ${warning}\n`;
                });
                response += `\n`;
            }

            if (result.output && !dryRun) {
                response += `## Test Output\n\n\`\`\`\n${result.output}\n\`\`\`\n`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error during test execution: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'generate-and-test',
    'Complete workflow: generate tests, validate, and execute them',
    {
        testType: z
            .enum(['css', 'edit', 'save', 'discard'])
            .describe('Type of test to generate and run'),
        cardId: z.string().describe('The ID of the merch card'),
        cardType: z.enum(dynamicCardTypes).describe('Type of card'),
        branch: z
            .string()
            .optional()
            .describe("Branch name (defaults to 'main')"),
        milolibs: z
            .string()
            .optional()
            .describe(
                "Milolibs branch (e.g., 'MWPW-170520' or 'local' for localhost)",
            ),
        headless: z
            .boolean()
            .optional()
            .describe('Run browser in headless mode (default: true)'),
        browser: z
            .enum(['chromium', 'firefox', 'webkit'])
            .optional()
            .describe('Browser to use (default: chromium)'),
        timeout: z
            .number()
            .optional()
            .describe('Test timeout in milliseconds (default: 30000)'),
        validateOnly: z
            .boolean()
            .optional()
            .describe(
                'Only validate generated files without running tests (default: false)',
            ),
    },
    async ({
        testType,
        cardId,
        cardType,
        branch = 'main',
        milolibs,
        headless = true,
        browser = 'chromium',
        timeout = 30000,
        validateOnly = false,
    }) => {
        try {
            const startTime = Date.now();

            // Step 1: Generate tests
            // Note: Console output disabled to prevent MCP JSON parsing issues
            // console.error(
            //     `🔧 Generating ${testType} tests for ${cardType} card ${cardId}...`,
            // );

            const config = {
                cardType: cardType,
                cardId: cardId,
                testSuite: `${cardType}-${testType}`,
                testTypes: [testType],
                elements: {
                    title: { selector: '.card-title' },
                    eyebrow: { selector: '.card-eyebrow' },
                    description: { selector: '.card-description' },
                    price: { selector: '.card-price' },
                    cta: { selector: '.card-cta' },
                    icon: { selector: '.card-icon' },
                    backgroundImage: { selector: '.card-background' },
                },
                metadata: {
                    path:
                        milolibs === 'local'
                            ? '/studio.html?milolibs=local'
                            : '/studio.html',
                    browserParams:
                        milolibs === 'local'
                            ? '#page=content&path=nala&query='
                            : '#query=',
                    tags: [`@${cardType}-${testType}`],
                    milolibs: milolibs,
                },
            };

            const pageObject = pageObjectGenerator.generatePageObject(config);
            const spec = specGenerator.generateSpecFile(config, testType);
            const test = testGenerator.generateTestFile(config, testType);

            const savedFiles = saveCompleteTestSuite(
                cardType,
                {
                    pageObject,
                    spec,
                    test,
                },
                testType,
            );

            // Note: Console output disabled to prevent MCP JSON parsing issues
            // console.error(`✅ Generated and saved test files`);

            // Step 2: Run complete test suite (validation + execution)
            // Note: Console output disabled to prevent MCP JSON parsing issues
            // console.error(`🧪 Running complete test suite...`);

            const testResult = await runCompleteTestSuite(cardType, testType, {
                headless,
                browser,
                timeout,
                dryRun: validateOnly,
            });

            const totalDuration = Date.now() - startTime;
            const fileSummary = getFileSaveSummary(cardType, testType);
            const report = generateTestReport(testResult);

            let response = `# Complete Test Generation and Execution Report\n\n`;
            response += `**Card**: ${cardId} (${cardType})\n`;
            response += `**Test Type**: ${testType}\n`;
            response += `**Branch**: ${branch}\n`;
            if (milolibs) {
                response += `**Milolibs**: ${milolibs}\n`;
            }
            response += `**Total Duration**: ${totalDuration}ms\n\n`;

            response += `## 📁 Generated Files (${fileSummary.surface} surface)\n\n`;
            response += `• **Page Object**: \`${savedFiles.pageObject}\`\n`;
            response += `• **Test Spec**: \`${savedFiles.spec}\`\n`;
            response += `• **Test Implementation**: \`${savedFiles.test}\`\n\n`;

            response += report;

            if (testResult.success) {
                response += `\n🎉 **All tests generated and ${validateOnly ? 'validated' : 'executed'} successfully!**\n`;
                response += `\nYour NALA tests are ready to use in the existing test infrastructure.`;

                if (milolibs === 'local') {
                    response += `\n\n**Note**: Tests are configured for localhost testing with milolibs=local.`;
                    response += `\nTo run manually: \`LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test nala/studio/${fileSummary.surface}/${cardType}/tests/${cardType}_${testType}.test.js --project=mas-live-chromium --headed\``;
                }
            } else {
                response += `\n❌ **Test generation completed but ${testResult.phase} failed.**\n`;
                response += `\nPlease review the errors above and fix any issues.`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error in generate-and-test workflow: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'run-and-fix-card-tests',
    'Run tests for a specific card and automatically fix any errors found',
    {
        cardId: z.string().describe('The ID of the merch card to test'),
        cardType: z.enum(dynamicCardTypes).describe('Type of card'),
        testType: z
            .enum(['css', 'edit', 'save', 'discard'])
            .describe('Type of test to run'),
        branch: z
            .string()
            .optional()
            .describe("Studio branch name (defaults to 'main')"),
        milolibs: z
            .string()
            .optional()
            .describe(
                "Milolibs branch (e.g., 'MWPW-170520' or 'local' for localhost)",
            ),
        headless: z
            .boolean()
            .optional()
            .describe('Run browser in headless mode (default: true)'),
        browser: z
            .enum(['chromium', 'firefox', 'webkit'])
            .optional()
            .describe('Browser to use (default: chromium)'),
        timeout: z
            .number()
            .optional()
            .describe('Test timeout in milliseconds (default: 30000)'),
        autoFix: z
            .boolean()
            .optional()
            .describe('Automatically fix detected errors (default: true)'),
        maxFixAttempts: z
            .number()
            .optional()
            .describe('Maximum number of fix attempts (default: 3)'),
        dryRun: z
            .boolean()
            .optional()
            .describe(
                'Only validate and show fixes without applying them (default: false)',
            ),
        backupOriginal: z
            .boolean()
            .optional()
            .describe(
                'Create backup of original files before fixing (default: true)',
            ),
    },
    async ({
        cardId,
        cardType,
        testType,
        branch = 'main',
        milolibs,
        headless = true,
        browser = 'chromium',
        timeout = 30000,
        autoFix = true,
        maxFixAttempts = 3,
        dryRun = false,
        backupOriginal = true,
    }) => {
        try {
            const startTime = Date.now();
            let response = `# Test Execution and Error Fixing Report\n\n`;
            response += `**Card**: ${cardId} (${cardType})\n`;
            response += `**Test Type**: ${testType}\n`;
            response += `**Studio Branch**: ${branch}\n`;
            if (milolibs) {
                response += `**Milolibs**: ${milolibs}\n`;
            }
            response += `**Auto-fix**: ${autoFix ? 'Enabled' : 'Disabled'}\n`;
            response += `**Mode**: ${dryRun ? 'Dry Run (Preview Only)' : 'Live Execution'}\n\n`;

            console.error(
                `🧪 Running tests for ${cardType} card ${cardId} with error fixing...`,
            );

            // If tests don't exist yet, generate them first
            const surface = getCardSurface(cardType);
            const testFilePath = join(
                getNALADirectoryPath(),
                'studio',
                surface,
                cardType,
                'tests',
                `${cardType}_${testType}.test.js`,
            );

            if (!existsSync(testFilePath)) {
                console.error(
                    `📝 Test files not found. Generating tests first...`,
                );

                // Generate the tests with proper metadata including milolibs
                const config = {
                    cardType: cardType,
                    cardId: cardId,
                    testSuite: `${cardType}-${testType}`,
                    testTypes: [testType],
                    elements: {
                        title: { selector: '.card-title' },
                        eyebrow: { selector: '.card-eyebrow' },
                        description: { selector: '.card-description' },
                        price: { selector: '.card-price' },
                        cta: { selector: '.card-cta' },
                        icon: { selector: '.card-icon' },
                        backgroundImage: { selector: '.card-background' },
                    },
                    metadata: {
                        path:
                            milolibs === 'local'
                                ? '/studio.html?milolibs=local'
                                : '/studio.html',
                        browserParams:
                            milolibs === 'local'
                                ? '#page=content&path=nala&query='
                                : '#query=',
                        tags: [`@${cardType}-${testType}`],
                        milolibs: milolibs,
                    },
                };

                const pageObject =
                    pageObjectGenerator.generatePageObject(config);
                const spec = specGenerator.generateSpecFile(config, testType);
                const test = testGenerator.generateTestFile(config, testType);

                const savedFiles = saveCompleteTestSuite(
                    cardType,
                    {
                        pageObject,
                        spec,
                        test,
                    },
                    testType,
                );

                response += `## Generated Test Files\n\n`;
                response += `✅ Created test files for ${cardType} ${testType} tests:\n`;
                response += `• Page Object: \`${savedFiles.pageObject}\`\n`;
                response += `• Test Spec: \`${savedFiles.spec}\`\n`;
                response += `• Test Implementation: \`${savedFiles.test}\`\n\n`;
            }

            let attempt = 0;
            let lastValidationResult = null;
            let lastTestResult = null;
            let allFixesApplied = [];

            while (attempt < maxFixAttempts) {
                attempt++;
                console.error(
                    `📋 Attempt ${attempt}: Validating and running tests...`,
                );

                // Step 1: Validate generated files
                const validation = await validateGeneratedFiles(
                    cardType,
                    testType,
                );
                lastValidationResult = validation;

                response += `## Attempt ${attempt}\n\n`;
                response += `### File Validation\n`;
                response += `**Status**: ${validation.valid ? '✅ Valid' : '❌ Invalid'}\n`;
                response += `**Errors Found**: ${validation.errors.length}\n`;
                response += `**Warnings**: ${validation.warnings.length}\n\n`;

                if (validation.errors.length > 0) {
                    response += `**Validation Errors**:\n`;
                    validation.errors.forEach((error, index) => {
                        response += `${index + 1}. ${error}\n`;
                    });
                    response += `\n`;

                    if (autoFix && attempt <= maxFixAttempts) {
                        console.error(
                            `🔧 Attempting to fix ${validation.errors.length} errors...`,
                        );

                        const fixResult = await autoFixAllErrors(
                            cardType,
                            testType,
                            validation,
                            {
                                dryRun,
                                backupOriginal: backupOriginal && attempt === 1, // Only backup on first attempt
                            },
                        );

                        allFixesApplied.push(...fixResult.fixesApplied);

                        response += `### Error Fixing\n`;
                        response += `**Fixes Applied**: ${fixResult.fixesApplied.length}\n`;
                        response += `**Remaining Errors**: ${fixResult.remainingErrors.length}\n`;
                        response += `**Fix Success**: ${fixResult.success ? '✅ Yes' : '❌ No'}\n\n`;

                        if (fixResult.fixesApplied.length > 0) {
                            response += `**Applied Fixes**:\n`;
                            fixResult.fixesApplied.forEach((fix, index) => {
                                response += `${index + 1}. ${fix}\n`;
                            });
                            response += `\n`;
                        }

                        if (fixResult.remainingErrors.length > 0) {
                            response += `**Remaining Errors**:\n`;
                            fixResult.remainingErrors.forEach(
                                (error, index) => {
                                    response += `${index + 1}. ${error}\n`;
                                },
                            );
                            response += `\n`;
                        }

                        // If no fixes were applied or no errors remain, break the loop
                        if (
                            fixResult.fixesApplied.length === 0 ||
                            fixResult.remainingErrors.length === 0
                        ) {
                            if (fixResult.remainingErrors.length === 0) {
                                console.error(
                                    `✅ All errors fixed successfully!`,
                                );
                            } else {
                                console.error(
                                    `⚠️ No more fixes available for remaining errors`,
                                );
                            }
                            break;
                        }

                        // Continue to next attempt if fixes were applied
                        continue;
                    } else {
                        response += `**Auto-fix**: ${autoFix ? 'Max attempts reached' : 'Disabled'}\n\n`;
                        break;
                    }
                }

                // Step 2: Run the tests if validation passed
                if (validation.valid || validation.errors.length === 0) {
                    console.error(`🚀 Running tests...`);

                    const testResult = await runNALATest(cardType, testType, {
                        headless,
                        browser,
                        timeout,
                        dryRun: false, // Always run actual tests when validation passes
                    });

                    lastTestResult = testResult;

                    response += `### Test Execution\n`;
                    response += `**Status**: ${testResult.success ? '✅ Passed' : '❌ Failed'}\n`;
                    response += `**Duration**: ${testResult.duration}ms\n`;
                    response += `**Browser**: ${browser} (${headless ? 'headless' : 'headed'})\n\n`;

                    if (testResult.error) {
                        response += `**Error**:\n\`\`\`\n${testResult.error}\n\`\`\`\n\n`;
                    }

                    if (testResult.warnings.length > 0) {
                        response += `**Warnings**:\n`;
                        testResult.warnings.forEach((warning) => {
                            response += `- ${warning}\n`;
                        });
                        response += `\n`;
                    }

                    if (testResult.output) {
                        response += `**Test Output**:\n\`\`\`\n${testResult.output}\n\`\`\`\n\n`;
                    }

                    // If tests passed, we're done
                    if (testResult.success) {
                        break;
                    }
                }

                // If we reach here and it's the last attempt, break
                if (attempt >= maxFixAttempts) {
                    break;
                }
            }

            const totalDuration = Date.now() - startTime;

            response += `## Summary\n\n`;
            response += `**Total Duration**: ${totalDuration}ms\n`;
            response += `**Attempts Made**: ${attempt}\n`;
            response += `**Total Fixes Applied**: ${allFixesApplied.length}\n\n`;

            const finalSuccess =
                lastTestResult?.success ||
                (lastValidationResult?.valid &&
                    lastValidationResult?.errors.length === 0);

            if (finalSuccess) {
                response += `🎉 **SUCCESS**: Tests are now passing!\n\n`;
                if (allFixesApplied.length > 0) {
                    response += `✨ **Fixes Applied**: ${allFixesApplied.length} issues were automatically resolved.\n`;
                }
                response += `\nYour NALA tests are ready to use in the existing test infrastructure.`;

                if (milolibs === 'local') {
                    response += `\n\n**Note**: Tests are configured for localhost testing with milolibs=local.`;
                    response += `\nTo run manually: \`LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test nala/studio/${surface}/${cardType}/tests/${cardType}_${testType}.test.js --project=mas-live-chromium --headed\``;
                }
            } else {
                response += `❌ **FAILED**: Tests are still failing after ${attempt} attempts.\n\n`;
                if (lastValidationResult?.errors.length > 0) {
                    response += `**Remaining Validation Errors**: ${lastValidationResult.errors.length}\n`;
                }
                if (lastTestResult?.error) {
                    response += `**Test Execution Error**: ${lastTestResult.error}\n`;
                }
                response += `\nPlease review the errors above and consider manual intervention.`;
            }

            if (dryRun) {
                response += `\n\n⚠️ **Note**: This was a dry run. No files were actually modified.`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error in run-and-fix-card-tests: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

server.tool(
    'run-nala-test-standard',
    'Run NALA tests using standard npm command and automatically fix locator issues',
    {
        testTag: z
            .string()
            .describe('NALA test tag (e.g., @studio-fries-css-card)'),
        cardType: z.enum(dynamicCardTypes).describe('Type of card'),
        cardId: z.string().describe('The ID of the merch card'),
        branch: z
            .string()
            .optional()
            .describe("Branch name (defaults to 'local')"),
        mode: z
            .enum(['headed', 'headless'])
            .optional()
            .describe("Browser mode (defaults to 'headed')"),
        milolibs: z
            .string()
            .optional()
            .describe("Milolibs branch (defaults to 'local' for localhost)"),
        maxAttempts: z
            .number()
            .optional()
            .describe('Maximum fix attempts (default: 3)'),
    },
    async ({
        testTag,
        cardType,
        cardId,
        branch = 'local',
        mode = 'headed',
        milolibs = 'local',
        maxAttempts = 3,
    }) => {
        try {
            // Note: Console output disabled to prevent MCP JSON parsing issues
            // console.error(
            //     `🚀 Running NALA test with automatic fixing: ${testTag}`,
            // );

            const result = await runNALATestWithFixes({
                testTag,
                cardType,
                cardId,
                branch,
                mode,
                milolibs,
                maxAttempts,
            });

            let response = `# NALA Test Execution with Auto-Fix Report\n\n`;
            response += `**Test Tag**: ${testTag}\n`;
            response += `**Card**: ${cardId} (${cardType})\n`;
            response += `**Branch**: ${branch}\n`;
            response += `**Mode**: ${mode}\n`;
            response += `**Milolibs**: ${milolibs}\n`;
            response += `**Attempts**: ${result.attempts}/${maxAttempts}\n\n`;

            if (result.success) {
                response += `## ✅ Success!\n\n`;
                response += `The test passed after ${result.attempts} attempt(s).\n\n`;

                if (result.attempts > 1) {
                    response += `### Fixes Applied\n`;
                    response += `The following issues were automatically fixed:\n`;
                    response += `- Updated CSS properties in page object\n`;
                    response += `- Fixed element selectors based on live card\n\n`;
                }

                response += `### Run Manually\n`;
                response += `To run this test manually, use:\n`;
                response += `\`\`\`bash\n`;
                response += `npm run nala branch ${branch} ${testTag} mode=${mode} milolibs=${milolibs}\n`;
                response += `\`\`\`\n`;

                if (milolibs === 'local') {
                    response += `\nOr with explicit localhost URL:\n`;
                    response += `\`\`\`bash\n`;
                    response += `LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test --grep "${testTag}" --project=mas-live-chromium --${mode}\n`;
                    response += `\`\`\`\n`;
                }
            } else {
                response += `## ❌ Failed\n\n`;
                response += `The test failed after ${result.attempts} attempts.\n\n`;

                if (result.lastError && result.lastError.length > 0) {
                    response += `### Last Errors\n`;
                    result.lastError.forEach((error) => {
                        response += `- **${error.type}**: ${error.message}\n`;
                        if (error.selector) {
                            response += `  - Selector: \`${error.selector}\`\n`;
                        }
                        if (error.file) {
                            response += `  - File: \`${error.file}\`\n`;
                        }
                    });
                    response += `\n`;
                }

                response += `### Next Steps\n`;
                response += `1. Check if localhost:3000 is running\n`;
                response += `2. Verify the card exists with ID: ${cardId}\n`;
                response += `3. Check authentication if required\n`;
                response += `4. Review the error messages above\n`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: response,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Error in run-nala-test-standard: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Note: Console output disabled to prevent MCP JSON parsing issues
    // console.error('NALA Test Generator MCP Server running on stdio');
}

main().catch((error) => {
    // Note: Console output disabled to prevent MCP JSON parsing issues
    // console.error('Fatal error in main():', error);
    process.exit(1);
});
