import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getCardTypeMetadata } from './variant-reader.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '../../..');

/**
 * Get the surface for a given card type
 * @param {string} cardType - The card type (simplified name)
 * @returns {string} The surface (commerce, ccd, acom, adobe-home)
 */
export function getCardSurface(cardType) {
    const metadata = getCardTypeMetadata();
    
    // Find metadata for this card type (try both simplified and full names)
    const meta = metadata.find(m => 
        m.value === cardType || 
        m.value.endsWith(`-${cardType}`) ||
        m.value === `ccd-${cardType}` ||
        m.value === `ah-${cardType}`
    );
    
    if (meta) {
        return meta.surface;
    }
    
    // Fallback mapping for common types
    const surfaceMapping = {
        'suggested': 'ccd',
        'slice': 'ccd',
        'catalog': 'acom',
        'plans': 'acom',
        'plans-students': 'acom',
        'plans-education': 'acom',
        'special-offers': 'acom',
        'fries': 'commerce',
        'promoted-plans': 'adobe-home',
        'try-buy-widget': 'adobe-home'
    };
    
    return surfaceMapping[cardType] || 'acom';
}

/**
 * Get the NALA directory path for a card type
 * @param {string} cardType - The card type (simplified name)
 * @returns {string} The directory path relative to project root
 */
export function getNALADirectoryPath(cardType) {
    const surface = getCardSurface(cardType);
    return join('nala', 'studio', surface, cardType);
}

/**
 * Get the full file path for a NALA test file
 * @param {string} cardType - The card type
 * @param {string} fileName - The file name (e.g., 'fries.page.js', 'fries_css.spec.js')
 * @param {string} [subDir] - Optional subdirectory ('specs' or 'tests')
 * @returns {string} Full file path
 */
export function getNALAFilePath(cardType, fileName, subDir = null) {
    const baseDir = getNALADirectoryPath(cardType);
    if (subDir) {
        return join(projectRoot, baseDir, subDir, fileName);
    }
    return join(projectRoot, baseDir, fileName);
}

/**
 * Save a file to the correct NALA directory structure
 * @param {string} cardType - The card type
 * @param {string} fileName - The file name
 * @param {string} content - The file content
 * @param {string} [subDir] - Optional subdirectory ('specs' or 'tests')
 * @returns {string} The path where the file was saved
 */
export function saveToNALAStructure(cardType, fileName, content, subDir = null) {
    const filePath = getNALAFilePath(cardType, fileName, subDir);
    const dirPath = dirname(filePath);
    
    // Create directory if it doesn't exist
    mkdirSync(dirPath, { recursive: true });
    
    // Write the file
    writeFileSync(filePath, content, 'utf-8');
    
    // Return relative path for display
    const relativePath = join(getNALADirectoryPath(cardType), subDir || '', fileName);
    return relativePath;
}

/**
 * Save all generated test files to NALA structure
 * @param {string} cardType - The card type
 * @param {Object} files - Object containing file contents
 * @param {string} files.pageObject - Page object content
 * @param {string} files.spec - Spec file content
 * @param {string} files.test - Test file content
 * @param {string} testType - The test type (css, edit, save, discard)
 * @returns {Object} Object with saved file paths
 */
export function saveCompleteTestSuite(cardType, files, testType) {
    const savedFiles = {};
    
    // Save page object (in root of card directory)
    if (files.pageObject) {
        savedFiles.pageObject = saveToNALAStructure(
            cardType, 
            `${cardType}.page.js`, 
            files.pageObject
        );
    }
    
    // Save spec file (in specs subdirectory)
    if (files.spec) {
        savedFiles.spec = saveToNALAStructure(
            cardType, 
            `${cardType}_${testType}.spec.js`, 
            files.spec, 
            'specs'
        );
    }
    
    // Save test file (in tests subdirectory)
    if (files.test) {
        savedFiles.test = saveToNALAStructure(
            cardType, 
            `${cardType}_${testType}.test.js`, 
            files.test, 
            'tests'
        );
    }
    
    return savedFiles;
}

/**
 * Get a summary of where files will be saved
 * @param {string} cardType - The card type
 * @param {string} testType - The test type
 * @returns {Object} Summary of file locations
 */
export function getFileSaveSummary(cardType, testType) {
    const surface = getCardSurface(cardType);
    const baseDir = getNALADirectoryPath(cardType);
    
    return {
        surface,
        baseDirectory: baseDir,
        files: {
            pageObject: join(baseDir, `${cardType}.page.js`),
            spec: join(baseDir, 'specs', `${cardType}_${testType}.spec.js`),
            test: join(baseDir, 'tests', `${cardType}_${testType}.test.js`)
        }
    };
} 