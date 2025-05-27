import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getNALADirectoryPath, getCardSurface } from './file-output.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '../../..');

/**
 * Error fixing result
 * @typedef {Object} ErrorFixResult
 * @property {boolean} success - Whether errors were fixed
 * @property {Array<string>} fixesApplied - List of fixes that were applied
 * @property {Array<string>} remainingErrors - Errors that couldn't be fixed
 * @property {string} details - Detailed information about the fixes
 */

/**
 * Common error patterns and their fixes
 */
const ERROR_PATTERNS = {
    missingImports: {
        pattern: /Missing required import: (.+)/,
        fix: (content, match) => {
            const importName = match[1];
            const importMap = {
                expect: "import { expect } from '@playwright/test';",
                test: "import { test } from '@playwright/test';",
                '@playwright/test':
                    "import { test, expect } from '@playwright/test';",
                StudioPage:
                    "import StudioPage from '../../../libs/studio-page.js';",
                WebUtil: "import WebUtil from '../../../libs/webutil.js';",
            };

            if (importMap[importName]) {
                const lines = content.split('\n');
                const importLine = importMap[importName];

                // Find the best place to insert the import
                let insertIndex = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ')) {
                        insertIndex = i + 1;
                    } else if (lines[i].trim() === '' && insertIndex > 0) {
                        break;
                    }
                }

                lines.splice(insertIndex, 0, importLine);
                return lines.join('\n');
            }
            return content;
        },
    },

    missingTestDescribe: {
        pattern: /Missing test\.describe block/,
        fix: (content, match, cardType, testType) => {
            if (!content.includes('test.describe')) {
                const testDescribe = `
test.describe('${cardType} ${testType} tests', () => {
    let page;
    let studioPage;
    let webUtil;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        studioPage = new StudioPage(page);
        webUtil = new WebUtil(page);
    });

    test.afterEach(async () => {
        await page.close();
    });
`;

                // Find where to insert the describe block
                const lines = content.split('\n');
                let insertIndex = lines.length;

                // Look for existing imports to insert after them
                for (let i = 0; i < lines.length; i++) {
                    if (
                        !lines[i].startsWith('import ') &&
                        lines[i].trim() !== ''
                    ) {
                        insertIndex = i;
                        break;
                    }
                }

                lines.splice(insertIndex, 0, testDescribe);

                // Add closing brace at the end if not present
                if (!content.includes('});')) {
                    lines.push('});');
                }

                return lines.join('\n');
            }
            return content;
        },
    },

    missingAsyncTest: {
        pattern: /Tests should be async for Playwright/,
        fix: (content) => {
            return content.replace(
                /test\(`([^`]+)`, \(/g,
                'test(`$1`, async (',
            );
        },
    },

    syntaxErrors: {
        pattern: /Syntax error: (.+)/,
        fix: (content, match) => {
            const errorMsg = match[1];

            // Fix common syntax issues
            let fixedContent = content;

            // Fix missing semicolons
            if (errorMsg.includes('Unexpected token')) {
                fixedContent = fixedContent.replace(/(\w+)\s*\n/g, '$1;\n');
            }

            // Fix unclosed brackets
            if (errorMsg.includes('Unexpected end of input')) {
                const openBraces = (fixedContent.match(/\{/g) || []).length;
                const closeBraces = (fixedContent.match(/\}/g) || []).length;
                const openParens = (fixedContent.match(/\(/g) || []).length;
                const closeParens = (fixedContent.match(/\)/g) || []).length;

                if (openBraces > closeBraces) {
                    fixedContent += '\n' + '}'.repeat(openBraces - closeBraces);
                }
                if (openParens > closeParens) {
                    fixedContent += ')'.repeat(openParens - closeParens);
                }
            }

            return fixedContent;
        },
    },

    missingPageObject: {
        pattern: /No page object usage detected/,
        fix: (content, match, cardType) => {
            if (!content.includes('.page') && !content.includes('Page(')) {
                // Add basic page object usage
                const pageObjectUsage = `
    // Page object usage
    await studioPage.goto();
    const card = await page.locator('[data-card-id="${cardType}"]').first();
    await expect(card).toBeVisible();
`;

                // Insert after beforeEach
                return content.replace(
                    /(test\.beforeEach\([^}]+\}\);)/,
                    `$1${pageObjectUsage}`,
                );
            }
            return content;
        },
    },
};

/**
 * Fix common errors in test files
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @param {Array<string>} errors - List of errors to fix
 * @param {Object} options - Fix options
 * @returns {Promise<ErrorFixResult>} Fix result
 */
export async function fixTestErrors(cardType, testType, errors, options = {}) {
    const { dryRun = false, backupOriginal = true } = options;

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

    if (!existsSync(testFilePath)) {
        return {
            success: false,
            fixesApplied: [],
            remainingErrors: errors,
            details: `Test file not found: ${testFilePath}`,
        };
    }

    let content = readFileSync(testFilePath, 'utf-8');
    const originalContent = content;
    const fixesApplied = [];
    const remainingErrors = [];

    // Create backup if requested
    if (backupOriginal && !dryRun) {
        const backupPath = `${testFilePath}.backup.${Date.now()}`;
        writeFileSync(backupPath, originalContent);
        fixesApplied.push(`Created backup: ${backupPath}`);
    }

    // Apply fixes for each error
    for (const error of errors) {
        let errorFixed = false;

        for (const [fixName, fixConfig] of Object.entries(ERROR_PATTERNS)) {
            const match = error.match(fixConfig.pattern);
            if (match) {
                try {
                    const newContent = fixConfig.fix(
                        content,
                        match,
                        cardType,
                        testType,
                    );
                    if (newContent !== content) {
                        content = newContent;
                        fixesApplied.push(
                            `Applied ${fixName} fix for: ${error}`,
                        );
                        errorFixed = true;
                        break;
                    }
                } catch (fixError) {
                    console.error(`Error applying fix ${fixName}:`, fixError);
                }
            }
        }

        if (!errorFixed) {
            remainingErrors.push(error);
        }
    }

    // Write the fixed content
    if (!dryRun && content !== originalContent) {
        writeFileSync(testFilePath, content);
        fixesApplied.push(`Updated test file: ${testFilePath}`);
    }

    const success = remainingErrors.length === 0;
    const details = `Fixed ${fixesApplied.length} issues, ${remainingErrors.length} remaining`;

    return {
        success,
        fixesApplied,
        remainingErrors,
        details,
    };
}

/**
 * Fix errors in page object files
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @param {Array<string>} errors - List of errors to fix
 * @param {Object} options - Fix options
 * @returns {Promise<ErrorFixResult>} Fix result
 */
export async function fixPageObjectErrors(
    cardType,
    testType,
    errors,
    options = {},
) {
    const { dryRun = false, backupOriginal = true } = options;

    const surface = getCardSurface(cardType);
    const pageObjectPath = join(
        projectRoot,
        'nala',
        'studio',
        surface,
        cardType,
        'page-objects',
        `${cardType}.page.js`,
    );

    if (!existsSync(pageObjectPath)) {
        return {
            success: false,
            fixesApplied: [],
            remainingErrors: errors,
            details: `Page object file not found: ${pageObjectPath}`,
        };
    }

    let content = readFileSync(pageObjectPath, 'utf-8');
    const originalContent = content;
    const fixesApplied = [];
    const remainingErrors = [];

    // Create backup if requested
    if (backupOriginal && !dryRun) {
        const backupPath = `${pageObjectPath}.backup.${Date.now()}`;
        writeFileSync(backupPath, originalContent);
        fixesApplied.push(`Created backup: ${backupPath}`);
    }

    // Fix page object specific errors
    for (const error of errors) {
        let errorFixed = false;

        if (error.includes('should export a default class')) {
            if (!content.includes('export default class')) {
                const className = `${cardType.charAt(0).toUpperCase() + cardType.slice(1)}Page`;
                content = content.replace(
                    /class\s+\w+/,
                    `export default class ${className}`,
                );
                fixesApplied.push(`Added default export for class: ${error}`);
                errorFixed = true;
            }
        }

        if (error.includes('should have constructor(page)')) {
            if (!content.includes('constructor(page)')) {
                const constructorCode = `
    constructor(page) {
        this.page = page;
    }
`;
                content = content.replace(
                    /(export default class \w+ \{)/,
                    `$1${constructorCode}`,
                );
                fixesApplied.push(`Added constructor(page): ${error}`);
                errorFixed = true;
            }
        }

        if (!errorFixed) {
            remainingErrors.push(error);
        }
    }

    // Write the fixed content
    if (!dryRun && content !== originalContent) {
        writeFileSync(pageObjectPath, content);
        fixesApplied.push(`Updated page object file: ${pageObjectPath}`);
    }

    const success = remainingErrors.length === 0;
    const details = `Fixed ${fixesApplied.length} issues, ${remainingErrors.length} remaining`;

    return {
        success,
        fixesApplied,
        remainingErrors,
        details,
    };
}

/**
 * Fix errors in spec files
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @param {Array<string>} errors - List of errors to fix
 * @param {Object} options - Fix options
 * @returns {Promise<ErrorFixResult>} Fix result
 */
export async function fixSpecErrors(cardType, testType, errors, options = {}) {
    const { dryRun = false, backupOriginal = true } = options;

    const surface = getCardSurface(cardType);
    const specPath = join(
        projectRoot,
        'nala',
        'studio',
        surface,
        cardType,
        'specs',
        `${cardType}_${testType}.spec.js`,
    );

    if (!existsSync(specPath)) {
        return {
            success: false,
            fixesApplied: [],
            remainingErrors: errors,
            details: `Spec file not found: ${specPath}`,
        };
    }

    let content = readFileSync(specPath, 'utf-8');
    const originalContent = content;
    const fixesApplied = [];
    const remainingErrors = [];

    // Create backup if requested
    if (backupOriginal && !dryRun) {
        const backupPath = `${specPath}.backup.${Date.now()}`;
        writeFileSync(backupPath, originalContent);
        fixesApplied.push(`Created backup: ${backupPath}`);
    }

    // Fix spec file specific errors
    for (const error of errors) {
        let errorFixed = false;

        if (error.includes('should have default export')) {
            if (!content.includes('export default')) {
                content = content.replace(
                    /(const spec = \{)/,
                    'export default $1',
                );
                fixesApplied.push(`Added default export: ${error}`);
                errorFixed = true;
            }
        }

        if (error.includes('should have FeatureName')) {
            if (!content.includes('FeatureName')) {
                const featureName = `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} ${testType.charAt(0).toUpperCase() + testType.slice(1)}`;
                content = content.replace(
                    /(export default \{)/,
                    `$1\n    FeatureName: '${featureName}',`,
                );
                fixesApplied.push(`Added FeatureName: ${error}`);
                errorFixed = true;
            }
        }

        if (error.includes('should have features array')) {
            if (!content.includes('features')) {
                content = content.replace(
                    /(FeatureName: '[^']+',)/,
                    `$1\n    features: [],`,
                );
                fixesApplied.push(`Added features array: ${error}`);
                errorFixed = true;
            }
        }

        if (!errorFixed) {
            remainingErrors.push(error);
        }
    }

    // Write the fixed content
    if (!dryRun && content !== originalContent) {
        writeFileSync(specPath, content);
        fixesApplied.push(`Updated spec file: ${specPath}`);
    }

    const success = remainingErrors.length === 0;
    const details = `Fixed ${fixesApplied.length} issues, ${remainingErrors.length} remaining`;

    return {
        success,
        fixesApplied,
        remainingErrors,
        details,
    };
}

/**
 * Automatically fix all detected errors in generated test files
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @param {Object} validationResult - Validation result with errors
 * @param {Object} options - Fix options
 * @returns {Promise<Object>} Combined fix result
 */
export async function autoFixAllErrors(
    cardType,
    testType,
    validationResult,
    options = {},
) {
    const allFixes = [];
    const allRemainingErrors = [];
    let overallSuccess = true;

    // Categorize errors by file type
    const testErrors = [];
    const pageObjectErrors = [];
    const specErrors = [];

    for (const error of validationResult.errors) {
        if (error.includes('Test file:')) {
            testErrors.push(error.replace('Test file: ', ''));
        } else if (error.includes('Page object')) {
            pageObjectErrors.push(error);
        } else if (error.includes('Spec file')) {
            specErrors.push(error);
        } else {
            // General errors, try to fix in test file
            testErrors.push(error);
        }
    }

    // Fix test file errors
    if (testErrors.length > 0) {
        const testFixResult = await fixTestErrors(
            cardType,
            testType,
            testErrors,
            options,
        );
        allFixes.push(...testFixResult.fixesApplied);
        allRemainingErrors.push(...testFixResult.remainingErrors);
        if (!testFixResult.success) overallSuccess = false;
    }

    // Fix page object errors
    if (pageObjectErrors.length > 0) {
        const pageObjectFixResult = await fixPageObjectErrors(
            cardType,
            testType,
            pageObjectErrors,
            options,
        );
        allFixes.push(...pageObjectFixResult.fixesApplied);
        allRemainingErrors.push(...pageObjectFixResult.remainingErrors);
        if (!pageObjectFixResult.success) overallSuccess = false;
    }

    // Fix spec file errors
    if (specErrors.length > 0) {
        const specFixResult = await fixSpecErrors(
            cardType,
            testType,
            specErrors,
            options,
        );
        allFixes.push(...specFixResult.fixesApplied);
        allRemainingErrors.push(...specFixResult.remainingErrors);
        if (!specFixResult.success) overallSuccess = false;
    }

    return {
        success: overallSuccess,
        fixesApplied: allFixes,
        remainingErrors: allRemainingErrors,
        details: `Applied ${allFixes.length} fixes, ${allRemainingErrors.length} errors remaining`,
        originalErrorCount: validationResult.errors.length,
        fixedErrorCount:
            validationResult.errors.length - allRemainingErrors.length,
    };
}
