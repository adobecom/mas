import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(currentDir, '../../..');

/**
 * Extract card variants from the variant picker file
 * @returns {Array<string>} Array of card variant values
 */
export function getCardVariantsFromSource() {
    try {
        const variantPickerPath = join(
            projectRoot,
            'studio/src/editors/variant-picker.js',
        );
        const content = readFileSync(variantPickerPath, 'utf-8');

        // Extract the VARIANTS array using regex
        const variantsMatch = content.match(
            /export const VARIANTS = \[([\s\S]*?)\];/,
        );
        if (!variantsMatch) {
            throw new Error(
                'Could not find VARIANTS array in variant-picker.js',
            );
        }

        const variantsContent = variantsMatch[1];

        // Extract all value properties using regex
        const valueMatches = variantsContent.matchAll(
            /value:\s*['"`]([^'"`]+)['"`]/g,
        );
        const variants = Array.from(valueMatches, (match) => match[1]);

        // Filter out 'all' as it's not a real card type
        const cardTypes = variants.filter((variant) => variant !== 'all');

        console.error(`Found ${cardTypes.length} card types:`, cardTypes);
        return cardTypes;
    } catch (error) {
        console.error('Error reading variants from source:', error.message);
        // Fallback to hardcoded list
        return [
            'suggested',
            'catalog',
            'plans',
            'segment',
            'special-offers',
            'twp',
            'inline-heading',
            'product',
            'mini-compare-chart',
            'fries',
            'ccd-slice',
            'ccd-suggested',
            'plans-students',
            'plans-education',
            'ah-try-buy-widget',
            'ah-promoted-plans',
        ];
    }
}

/**
 * Get simplified card types (remove prefixes for easier use)
 * @returns {Array<string>} Array of simplified card type names
 */
export function getSimplifiedCardTypes() {
    const variants = getCardVariantsFromSource();

    // Create a mapping of simplified names
    const simplifiedTypes = variants.map((variant) => {
        // Remove common prefixes
        if (variant.startsWith('ccd-')) {
            return variant.replace('ccd-', '');
        }
        if (variant.startsWith('ah-')) {
            return variant.replace('ah-', '');
        }
        return variant;
    });

    // Remove duplicates and sort
    return [...new Set(simplifiedTypes)].sort();
}

/**
 * Get the full variant name from a simplified type
 * @param {string} simplifiedType - Simplified card type
 * @returns {string} Full variant name
 */
export function getFullVariantName(simplifiedType) {
    const variants = getCardVariantsFromSource();

    // Direct match first
    if (variants.includes(simplifiedType)) {
        return simplifiedType;
    }

    // Try with prefixes
    const withCcd = `ccd-${simplifiedType}`;
    if (variants.includes(withCcd)) {
        return withCcd;
    }

    const withAh = `ah-${simplifiedType}`;
    if (variants.includes(withAh)) {
        return withAh;
    }

    return simplifiedType;
}

/**
 * Get card type metadata from variant picker
 * @returns {Array<Object>} Array of card type objects with label, value, and surface
 */
export function getCardTypeMetadata() {
    try {
        const variantPickerPath = join(
            projectRoot,
            'studio/src/editors/variant-picker.js',
        );
        const content = readFileSync(variantPickerPath, 'utf-8');

        // Extract the VARIANTS array
        const variantsMatch = content.match(
            /export const VARIANTS = \[([\s\S]*?)\];/,
        );
        if (!variantsMatch) {
            throw new Error('Could not find VARIANTS array');
        }

        const variantsContent = variantsMatch[1];

        // Parse each variant object
        const variants = [];
        const objectMatches = variantsContent.matchAll(/\{([^}]+)\}/g);

        for (const match of objectMatches) {
            const objectContent = match[1];
            const labelMatch = objectContent.match(
                /label:\s*['"`]([^'"`]+)['"`]/,
            );
            const valueMatch = objectContent.match(
                /value:\s*['"`]([^'"`]+)['"`]/,
            );
            const surfaceMatch = objectContent.match(
                /surface:\s*['"`]([^'"`]+)['"`]/,
            );

            if (labelMatch && valueMatch && surfaceMatch) {
                const value = valueMatch[1];
                if (value !== 'all') {
                    // Skip the 'all' option
                    variants.push({
                        label: labelMatch[1],
                        value: value,
                        surface: surfaceMatch[1],
                    });
                }
            }
        }

        return variants;
    } catch (error) {
        console.error('Error parsing variant metadata:', error.message);
        return [];
    }
}
