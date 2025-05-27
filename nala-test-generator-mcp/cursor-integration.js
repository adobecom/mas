#!/usr/bin/env node

/**
 * Cursor Integration Bridge for NALA Test Generator MCP Server
 *
 * This script provides a simple way to interact with the MCP server
 * from Cursor or other tools that don't have native MCP support.
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    getSimplifiedCardTypes,
    getCardTypeMetadata,
} from './src/utils/variant-reader.js';
import { getFileSaveSummary, getCardSurface } from './src/utils/file-output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMANDS = {
    example: 'create-suggested-card-example',
    'page-object': 'generate-page-object',
    'test-spec': 'generate-test-spec',
    'test-impl': 'generate-test-implementation',
    'complete-suite': 'generate-complete-test-suite',
    extract: 'extract-card-properties',
    'playwright-extract': 'generate-playwright-extractor',
    'extract-and-generate': 'extract-and-generate-tests',
    'auto-extract': 'auto-extract-card-properties',
    single: 'generate-single-test-type',
    'list-types': 'list-types',
    'show-paths': 'show-file-paths',
    validate: 'validate-generated-tests',
    'run-tests': 'run-generated-tests',
    'generate-and-test': 'generate-and-test',
};

/**
 * Main function to handle command line arguments
 */
async function main() {
    const args = process.argv.slice(2);

    if (
        args.length === 0 ||
        args[0] === 'help' ||
        args[0] === '--help' ||
        args[0] === '-h'
    ) {
        showHelp();
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'example':
                await createExample();
                break;
            case 'page-object':
                if (args.length < 3) {
                    console.error('Usage: page-object <cardType> <cardId>');
                    process.exit(1);
                }
                const [, cardType, cardId] = args;
                const config = {
                    cardType,
                    cardId,
                    testSuite: `${cardType}-tests`,
                    testTypes: ['css'],
                    elements: {
                        title: { selector: '.card-title' },
                        description: { selector: '.card-description' },
                        cta: { selector: '.card-cta' },
                    },
                };
                const result = await runMCPServer('generate-page-object', {
                    config,
                });
                console.log(result);
                break;
            case 'test-spec':
                if (args.length < 4) {
                    console.error('Usage: spec <cardType> <cardId> <testType>');
                    process.exit(1);
                }
                const [, specCardType, specCardId, specTestType] = args;
                const configSpec = {
                    cardType: specCardType,
                    cardId: specCardId,
                    testSuite: `${specCardType}-tests`,
                    testTypes: [specTestType],
                    elements: {
                        title: { selector: '.card-title' },
                        description: { selector: '.card-description' },
                        cta: { selector: '.card-cta' },
                    },
                };
                const resultSpec = await runMCPServer('generate-test-spec', {
                    config: configSpec,
                    testType: specTestType,
                });
                console.log(resultSpec);
                break;
            case 'test-impl':
                if (args.length < 4) {
                    console.error('Usage: test <cardType> <cardId> <testType>');
                    process.exit(1);
                }
                const [, testCardType, testCardId, testTestType] = args;
                const configTest = {
                    cardType: testCardType,
                    cardId: testCardId,
                    testSuite: `${testCardType}-tests`,
                    testTypes: [testTestType],
                    elements: {
                        title: { selector: '.card-title' },
                        description: { selector: '.card-description' },
                        cta: { selector: '.card-cta' },
                    },
                };
                const resultTest = await runMCPServer(
                    'generate-test-implementation',
                    { config: configTest, testType: testTestType },
                );
                console.log(resultTest);
                break;
            case 'complete-suite':
                if (args.length < 3) {
                    console.error('Usage: complete <cardType> <cardId>');
                    process.exit(1);
                }
                const [, completeCardType, completeCardId] = args;
                const configComplete = {
                    cardType: completeCardType,
                    cardId: completeCardId,
                    testSuite: `${completeCardType}-tests`,
                    testTypes: ['css', 'functional', 'edit', 'save', 'discard'],
                    elements: {
                        title: { selector: '.card-title' },
                        eyebrow: { selector: '.card-eyebrow' },
                        description: { selector: '.card-description' },
                        price: { selector: '.card-price' },
                        cta: { selector: '.card-cta' },
                        icon: { selector: '.card-icon' },
                    },
                };
                const resultComplete = await runMCPServer(
                    'generate-complete-test-suite',
                    { config: configComplete },
                );
                console.log(resultComplete);
                break;
            case 'extract':
                if (args.length < 2) {
                    console.error('Usage: extract <cardId> [branch]');
                    process.exit(1);
                }
                const [, extractCardId, extractBranch] = args;
                const resultExtract = await runMCPServer(
                    'extract-card-properties',
                    {
                        cardId: extractCardId,
                        branch: extractBranch || 'main',
                    },
                );
                console.log(resultExtract);
                break;
            case 'playwright-extract':
                if (args.length < 2) {
                    console.error(
                        'Usage: playwright-extract <cardId> [branch]',
                    );
                    process.exit(1);
                }
                const [, playwrightCardId, playwrightBranch] = args;
                const resultPlaywrightExtract = await runMCPServer(
                    'generate-playwright-extractor',
                    {
                        cardId: playwrightCardId,
                        branch: playwrightBranch || 'main',
                    },
                );
                console.log(resultPlaywrightExtract);
                break;
            case 'extract-and-generate':
                if (args.length < 2) {
                    console.error(
                        'Usage: extract-and-generate <cardId> [branch]',
                    );
                    process.exit(1);
                }
                const [, extractGenCardId, extractGenBranch] = args;
                const resultExtractAndGenerate = await runMCPServer(
                    'extract-and-generate-tests',
                    {
                        cardId: extractGenCardId,
                        branch: extractGenBranch || 'main',
                    },
                );
                console.log(resultExtractAndGenerate);
                break;
            case 'auto-extract':
                if (args.length < 2) {
                    console.error('Usage: auto-extract <cardId> [branch]');
                    process.exit(1);
                }
                const [, autoCardId, autoBranch] = args;
                const resultAutoExtract = await runMCPServer(
                    'auto-extract-card-properties',
                    {
                        cardId: autoCardId,
                        branch: autoBranch || 'main',
                        headless: true,
                    },
                );
                console.log(resultAutoExtract);
                break;
            case 'single':
                if (args.length < 3) {
                    console.error(
                        'Usage: single <testType> <cardId> [cardType] [branch]',
                    );
                    console.error('Test Types: css, edit, save, discard');
                    process.exit(1);
                }
                const [
                    ,
                    singleTestType,
                    singleCardId,
                    singleCardType,
                    singleBranch,
                ] = args;

                if (
                    !['css', 'edit', 'save', 'discard'].includes(singleTestType)
                ) {
                    console.error(
                        'Invalid test type. Must be one of: css, edit, save, discard',
                    );
                    process.exit(1);
                }

                const requestArgs = {
                    testType: singleTestType,
                    cardId: singleCardId,
                    branch: singleBranch || 'main',
                };

                if (singleCardType) {
                    requestArgs.cardType = singleCardType;
                }

                const resultSingle = await runMCPServer(
                    'generate-single-test-type',
                    requestArgs,
                );
                console.log(resultSingle);
                break;
            case 'list-types':
                listCardTypes();
                break;
            case 'show-paths':
                if (args.length < 3) {
                    console.error('Usage: show-paths <cardType> <testType>');
                    process.exit(1);
                }
                const [, showCardType, showTestType] = args;
                showFilePaths(showCardType, showTestType);
                break;
            case 'validate':
                if (args.length < 3) {
                    console.error('Usage: validate <cardType> <testType>');
                    process.exit(1);
                }
                const [, validateCardType, validateTestType] = args;
                const resultValidate = await runMCPServer(
                    'validate-generated-tests',
                    {
                        cardType: validateCardType,
                        testType: validateTestType,
                    },
                );
                console.log(resultValidate);
                break;
            case 'run-tests':
                if (args.length < 3) {
                    console.error(
                        'Usage: run-tests <cardType> <testType> [headless] [browser] [timeout] [dryRun]',
                    );
                    process.exit(1);
                }
                const [
                    ,
                    runCardType,
                    runTestType,
                    runHeadless,
                    runBrowser,
                    runTimeout,
                    runDryRun,
                ] = args;
                const runTestArgs = {
                    cardType: runCardType,
                    testType: runTestType,
                };
                if (runHeadless !== undefined)
                    runTestArgs.headless = runHeadless === 'true';
                if (runBrowser) runTestArgs.browser = runBrowser;
                if (runTimeout) runTestArgs.timeout = parseInt(runTimeout);
                if (runDryRun !== undefined)
                    runTestArgs.dryRun = runDryRun === 'true';

                const resultRunTests = await runMCPServer(
                    'run-generated-tests',
                    runTestArgs,
                );
                console.log(resultRunTests);
                break;
            case 'generate-and-test':
                if (args.length < 4) {
                    console.error(
                        'Usage: generate-and-test <testType> <cardId> <cardType> [branch] [headless] [browser] [timeout] [validateOnly]',
                    );
                    process.exit(1);
                }
                const [
                    ,
                    genTestType,
                    genCardId,
                    genCardType,
                    genBranch,
                    genHeadless,
                    genBrowser,
                    genTimeout,
                    genValidateOnly,
                ] = args;
                const genTestArgs = {
                    testType: genTestType,
                    cardId: genCardId,
                    cardType: genCardType,
                };
                if (genBranch) genTestArgs.branch = genBranch;
                if (genHeadless !== undefined)
                    genTestArgs.headless = genHeadless === 'true';
                if (genBrowser) genTestArgs.browser = genBrowser;
                if (genTimeout) genTestArgs.timeout = parseInt(genTimeout);
                if (genValidateOnly !== undefined)
                    genTestArgs.validateOnly = genValidateOnly === 'true';

                const resultGenAndTest = await runMCPServer(
                    'generate-and-test',
                    genTestArgs,
                );
                console.log(resultGenAndTest);
                break;
            case 'help':
            case '--help':
            case '-h':
                showHelp();
                break;
            default:
                console.error(`❌ Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
🧪 NALA Test Generator - Cursor Integration

Usage: node cursor-integration.js <command> [options]

Commands:
  example                           Create example suggested card configuration
  page-object <cardType> <cardId>    Generate page object from config file
  test-spec <cardType> <cardId> <testType>    Generate test specification from config file
  test-impl <cardType> <cardId> <testType>    Generate test implementation (css|functional|edit|save|discard|interaction)
  complete-suite <cardType> <cardId>    Generate complete test suite from config file
  extract <cardId> [branch]        Generate extraction script for live card properties (defaults to 'main')
  playwright-extract <cardId> [branch]    Generate Playwright extraction script (defaults to 'main')
  auto-extract <cardId> [branch] [headless]  Automatically extract properties using Playwright (fully automated)
  extract-and-generate <cardId> [branch] [extracted-data-file]  Complete extraction and generation workflow
  single <testType> <cardId> [cardType] [branch]  Generate tests for specific type
  list-types                          List all available card types from source
  show-paths <cardType> <testType>    Show where files will be saved in NALA structure
  validate <cardType> <testType>      Validate generated test files for syntax and structure
  run-tests <cardType> <testType> [headless] [browser] [timeout] [dryRun]  Execute generated tests
  generate-and-test <testType> <cardId> <cardType> [branch] [options]  Complete workflow: generate, validate, and test
  help                              Show this help message

Examples:
  node cursor-integration.js example
  node cursor-integration.js page-object suggested 206a8742-0289-4196-92d4-ced99ec4191e
  node cursor-integration.js test-impl suggested 206a8742-0289-4196-92d4-ced99ec4191e css
  node cursor-integration.js complete-suite suggested 206a8742-0289-4196-92d4-ced99ec4191e
  node cursor-integration.js extract "549f6981-f5c8-4512-b41c-313d60f375b2"
  node cursor-integration.js extract "549f6981-f5c8-4512-b41c-313d60f375b2" "feature-branch"
  node cursor-integration.js playwright-extract "549f6981-f5c8-4512-b41c-313d60f375b2" "main"
  node cursor-integration.js auto-extract "549f6981-f5c8-4512-b41c-313d60f375b2" "main" "false"
  node cursor-integration.js single css 549f6981-f5c8-4512-b41c-313d60f375b2 suggested main
  node cursor-integration.js single edit 549f6981-f5c8-4512-b41c-313d60f375b2
  node cursor-integration.js single save 549f6981-f5c8-4512-b41c-313d60f375b2 suggested feature-new-card
  node cursor-integration.js single discard 549f6981-f5c8-4512-b41c-313d60f375b2 suggested
  node cursor-integration.js extract-and-generate "549f6981-f5c8-4512-b41c-313d60f375b2" "my-feature"
  node cursor-integration.js list-types
  node cursor-integration.js show-paths fries css
  node cursor-integration.js validate fries css
  node cursor-integration.js run-tests fries css true chromium 30000 false
  node cursor-integration.js generate-and-test css 26f091c2-995d-4a96-a193-d62f6c73af2f fries MWPW-170520

Config file format:
  JSON file containing CardConfig object (see README.md for schema)
`);
}

/**
 * Create example configuration
 */
async function createExample() {
    console.log('📋 Creating example suggested card configuration...');
    const result = await runMCPServer('create-suggested-card-example', {
        random_string: 'example',
    });
    console.log(result);
}

/**
 * Run an MCP server and return the result
 */
function runMCPServer(toolName, args) {
    return new Promise((resolve, reject) => {
        const serverPath = join(__dirname, 'src', 'index.js');
        const child = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            error += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Process exited with code ${code}: ${error}`));
            }
        });

        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: args,
            },
        };

        child.stdin.write(JSON.stringify(request) + '\n');
        child.stdin.end();
    });
}

function listCardTypes() {
    const cardTypes = getSimplifiedCardTypes();
    const metadata = getCardTypeMetadata();

    console.log('\n=== Available Card Types ===\n');

    cardTypes.forEach((type) => {
        const meta = metadata.find(
            (m) => m.value === type || m.value.endsWith(`-${type}`),
        );
        if (meta) {
            console.log(
                `• ${type.padEnd(20)} - ${meta.label} (${meta.surface})`,
            );
        } else {
            console.log(`• ${type.padEnd(20)} - (simplified name)`);
        }
    });

    console.log(`\nTotal: ${cardTypes.length} card types available\n`);
    console.log(
        'Usage: node cursor-integration.js single css <cardId> <cardType> [branch]',
    );
}

function showFilePaths(cardType, testType) {
    const surface = getCardSurface(cardType);
    const summary = getFileSaveSummary(cardType, testType);

    console.log(`\n📁 **File Paths for ${cardType} ${testType} tests**\n`);
    console.log(`**Surface**: ${surface}`);
    console.log(`**Base Directory**: ${summary.baseDirectory}\n`);

    console.log('**Files that will be created:**');
    console.log(`• Page Object:  ${summary.files.pageObject}`);
    console.log(`• Test Spec:    ${summary.files.spec}`);
    console.log(`• Test Impl:    ${summary.files.test}\n`);

    console.log('**Command to generate:**');
    console.log(
        `node cursor-integration.js single ${testType} <cardId> ${cardType} [branch]`,
    );
}

// Run the main function
main().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
});
