import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getNALADirectoryPath, getCardSurface } from './file-output.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '../../..');

/**
 * Test execution result
 * @typedef {Object} TestResult
 * @property {boolean} success - Whether the test passed
 * @property {string} output - Test output
 * @property {string} error - Error output if any
 * @property {number} duration - Test duration in milliseconds
 * @property {Array<string>} warnings - Any warnings found
 */

/**
 * Validation result for generated files
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether all files are valid
 * @property {Array<string>} errors - Validation errors
 * @property {Array<string>} warnings - Validation warnings
 * @property {Object} files - File-specific validation results
 */

/**
 * Run NALA tests for a specific card and test type
 * @param {string} cardType - The card type
 * @param {string} testType - The test type (css, edit, save, discard)
 * @param {Object} options - Test execution options
 * @param {boolean} options.headless - Run in headless mode (default: true)
 * @param {string} options.browser - Browser to use (default: 'chromium')
 * @param {number} options.timeout - Test timeout in milliseconds (default: 30000)
 * @param {boolean} options.dryRun - Only validate files without running tests (default: false)
 * @returns {Promise<TestResult>} Test execution result
 */
export async function runNALATest(cardType, testType, options = {}) {
    const {
        headless = true,
        browser = 'chromium',
        timeout = 30000,
        dryRun = false,
    } = options;

    const startTime = Date.now();
    const surface = getCardSurface(cardType);
    const testFilePath = join(
        projectRoot,
        'nala',
        'studio',
        surface,
        cardType,
        'tests',
        `${cardType}_${testType}.test.js`,
    );

    // Check for required environment variables
    const warnings = [];
    if (!process.env.IMS_EMAIL) {
        warnings.push(
            'IMS_EMAIL environment variable not set - authentication may fail',
        );
    }
    if (!process.env.IMS_PASS) {
        warnings.push(
            'IMS_PASS environment variable not set - authentication may fail',
        );
    }

    // Check if test file exists
    if (!existsSync(testFilePath)) {
        return {
            success: false,
            output: '',
            error: `Test file not found: ${testFilePath}`,
            duration: Date.now() - startTime,
            warnings,
        };
    }

    // Validate test file syntax
    const validation = await validateTestFile(testFilePath);
    if (!validation.valid) {
        return {
            success: false,
            output: '',
            error: `Test file validation failed: ${validation.errors.join(', ')}`,
            duration: Date.now() - startTime,
            warnings: [...warnings, ...validation.warnings],
        };
    }

    if (dryRun) {
        return {
            success: true,
            output: 'Dry run completed - test file is valid',
            error: '',
            duration: Date.now() - startTime,
            warnings: [...warnings, ...validation.warnings],
        };
    }

    // Run the actual test
    try {
        const result = await executePlaywrightTest(testFilePath, {
            headless,
            browser,
            timeout,
        });

        return {
            success: result.exitCode === 0,
            output: result.stdout,
            error: result.stderr,
            duration: Date.now() - startTime,
            warnings: [...warnings, ...validation.warnings],
        };
    } catch (error) {
        return {
            success: false,
            output: '',
            error: `Test execution failed: ${error.message}`,
            duration: Date.now() - startTime,
            warnings: [...warnings, ...validation.warnings],
        };
    }
}

/**
 * Validate a generated test file for syntax and structure
 * @param {string} filePath - Path to the test file
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateTestFile(filePath) {
    const errors = [];
    const warnings = [];
    const files = {};

    try {
        const content = readFileSync(filePath, 'utf-8');

        // Check for required imports
        const requiredImports = [
            'expect',
            'test',
            '@playwright/test',
            'StudioPage',
            'WebUtil',
        ];

        for (const importName of requiredImports) {
            if (!content.includes(importName)) {
                errors.push(`Missing required import: ${importName}`);
            }
        }

        // Check for test structure
        if (!content.includes('test.describe')) {
            errors.push('Missing test.describe block');
        }

        if (!content.includes('test.beforeEach')) {
            warnings.push('Missing test.beforeEach setup');
        }

        // Check for proper test naming
        if (!content.includes('test(`')) {
            errors.push('No test cases found');
        }

        // Check for async/await patterns
        if (content.includes('test(') && !content.includes('async')) {
            warnings.push('Tests should be async for Playwright');
        }

        // Check for proper page object usage
        if (!content.includes('.page') && !content.includes('Page(')) {
            warnings.push('No page object usage detected');
        }

        // Syntax validation (basic) - skip for ES6 modules
        if (!content.includes('import ') && !content.includes('export ')) {
            try {
                // Try to parse as JavaScript (basic syntax check)
                new Function(content);
            } catch (syntaxError) {
                errors.push(`Syntax error: ${syntaxError.message}`);
            }
        } else {
            // For ES6 modules, just check for basic syntax patterns
            const hasValidImports = content.match(
                /^import\s+.*from\s+['"][^'"]+['"];?$/m,
            );
            const hasValidExports = content.match(/^export\s+(default\s+)?/m);

            if (content.includes('import ') && !hasValidImports) {
                warnings.push('Import statements may have syntax issues');
            }
            if (content.includes('export ') && !hasValidExports) {
                warnings.push('Export statements may have syntax issues');
            }
        }

        files[filePath] = {
            valid: errors.length === 0,
            errors: [...errors],
            warnings: [...warnings],
        };
    } catch (error) {
        errors.push(`Failed to read file: ${error.message}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        files,
    };
}

/**
 * Execute a Playwright test file
 * @param {string} testFilePath - Path to the test file
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
function executePlaywrightTest(testFilePath, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            headless = true,
            browser = 'chromium',
            timeout = 30000,
        } = options;

        const args = [
            'test',
            testFilePath,
            '--reporter=json',
            `--timeout=${timeout}`,
            `--project=mas-live-${browser}`,
        ];

        if (!headless) {
            args.push('--headed');
        }

        const envVars = {
            ...process.env,
            IMS_EMAIL: process.env.IMS_EMAIL || 'cod23684+masautomation@adobetest.com',
            IMS_PASS: process.env.IMS_PASS || 'AdobeTestPassword321$',
        };



        const child = spawn('npx', ['playwright', ...args], {
            cwd: projectRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: envVars,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({
                exitCode: code,
                stdout,
                stderr,
            });
        });

        child.on('error', (error) => {
            reject(error);
        });

        // Set overall timeout
        setTimeout(() => {
            child.kill();
            reject(new Error(`Test execution timed out after ${timeout}ms`));
        }, timeout + 5000);
    });
}

/**
 * Validate all generated files for a card
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @returns {Promise<ValidationResult>} Complete validation result
 */
export async function validateGeneratedFiles(cardType, testType) {
    const surface = getCardSurface(cardType);
    const baseDir = join(projectRoot, 'nala', 'studio', surface, cardType);

    const files = {
        pageObject: join(baseDir, `${cardType}.page.js`),
        spec: join(baseDir, 'specs', `${cardType}_${testType}.spec.js`),
        test: join(baseDir, 'tests', `${cardType}_${testType}.test.js`),
    };

    const errors = [];
    const warnings = [];
    const fileResults = {};

    // Check if all files exist
    for (const [fileType, filePath] of Object.entries(files)) {
        if (!existsSync(filePath)) {
            errors.push(`Missing ${fileType} file: ${filePath}`);
            continue;
        }

        try {
            const content = readFileSync(filePath, 'utf-8');

            // Basic validation for each file type
            switch (fileType) {
                case 'pageObject':
                    if (!content.includes('export default class')) {
                        errors.push(
                            `Page object should export a default class: ${filePath}`,
                        );
                    }
                    if (!content.includes('constructor(page)')) {
                        errors.push(
                            `Page object should have constructor(page): ${filePath}`,
                        );
                    }
                    break;

                case 'spec':
                    if (!content.includes('export default')) {
                        errors.push(
                            `Spec file should have default export: ${filePath}`,
                        );
                    }
                    if (!content.includes('FeatureName')) {
                        errors.push(
                            `Spec file should have FeatureName: ${filePath}`,
                        );
                    }
                    if (!content.includes('features')) {
                        errors.push(
                            `Spec file should have features array: ${filePath}`,
                        );
                    }
                    break;

                case 'test':
                    const testValidation = await validateTestFile(filePath);
                    if (!testValidation.valid) {
                        errors.push(
                            ...testValidation.errors.map(
                                (e) => `Test file: ${e}`,
                            ),
                        );
                    }
                    warnings.push(
                        ...testValidation.warnings.map(
                            (w) => `Test file: ${w}`,
                        ),
                    );
                    break;
            }

            fileResults[fileType] = {
                path: filePath,
                exists: true,
                valid: true,
            };
        } catch (error) {
            errors.push(`Failed to validate ${fileType}: ${error.message}`);
            fileResults[fileType] = {
                path: filePath,
                exists: true,
                valid: false,
                error: error.message,
            };
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        files: fileResults,
    };
}

/**
 * Run a complete test suite validation and execution
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Complete test suite result
 */
export async function runCompleteTestSuite(cardType, testType, options = {}) {
    const startTime = Date.now();

    console.log(
        `🧪 Running complete test suite for ${cardType} ${testType}...`,
    );

    // Step 1: Validate all generated files
    console.log('📋 Validating generated files...');
    const validation = await validateGeneratedFiles(cardType, testType);

    if (!validation.valid) {
        return {
            success: false,
            phase: 'validation',
            validation,
            execution: null,
            duration: Date.now() - startTime,
            summary: `Validation failed: ${validation.errors.length} errors`,
        };
    }

    console.log('✅ File validation passed');

    // Step 2: Run the tests
    console.log('🚀 Executing tests...');
    const execution = await runNALATest(cardType, testType, options);

    const totalDuration = Date.now() - startTime;

    return {
        success: validation.valid && execution.success,
        phase: execution.success ? 'completed' : 'execution',
        validation,
        execution,
        duration: totalDuration,
        summary: execution.success
            ? `All tests passed in ${totalDuration}ms`
            : `Test execution failed: ${execution.error}`,
    };
}

/**
 * Generate a test execution report
 * @param {Object} result - Test suite result
 * @returns {string} Formatted report
 */
export function generateTestReport(result) {
    let report = `\n📊 **Test Execution Report**\n\n`;

    report += `**Overall Result**: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `**Duration**: ${result.duration}ms\n`;
    report += `**Phase**: ${result.phase}\n\n`;

    if (result.validation) {
        report += `## File Validation\n\n`;
        report += `**Status**: ${result.validation.valid ? '✅ Valid' : '❌ Invalid'}\n`;

        if (result.validation.errors.length > 0) {
            report += `**Errors**:\n`;
            result.validation.errors.forEach((error) => {
                report += `- ${error}\n`;
            });
        }

        if (result.validation.warnings.length > 0) {
            report += `**Warnings**:\n`;
            result.validation.warnings.forEach((warning) => {
                report += `- ${warning}\n`;
            });
        }

        report += `\n`;
    }

    if (result.execution) {
        report += `## Test Execution\n\n`;
        report += `**Status**: ${result.execution.success ? '✅ Passed' : '❌ Failed'}\n`;
        report += `**Duration**: ${result.execution.duration}ms\n`;

        if (result.execution.error) {
            report += `**Error**: ${result.execution.error}\n`;
        }

        if (result.execution.warnings.length > 0) {
            report += `**Warnings**:\n`;
            result.execution.warnings.forEach((warning) => {
                report += `- ${warning}\n`;
            });
        }

        if (result.execution.output) {
            report += `\n**Output**:\n\`\`\`\n${result.execution.output}\n\`\`\`\n`;
        }
    }

    report += `\n**Summary**: ${result.summary}\n`;

    return report;
}
