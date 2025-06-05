#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';
import { SPECTRUM_COLORS } from '../studio/src/utils/spectrum-colors.js';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

const COLOR_RANGES = {
    red: { hue: [345, 15], sat: [0.4, 1], light: [0.2, 0.8] },
    orange: { hue: [15, 45], sat: [0.4, 1], light: [0.3, 0.8] },
    yellow: { hue: [45, 75], sat: [0.4, 1], light: [0.4, 0.9] },
    green: { hue: [75, 165], sat: [0.3, 1], light: [0.2, 0.8] },
    seafoam: { hue: [165, 195], sat: [0.3, 0.8], light: [0.4, 0.8] },
    blue: { hue: [195, 255], sat: [0.4, 1], light: [0.3, 0.8] },
    purple: { hue: [255, 285], sat: [0.4, 1], light: [0.3, 0.8] },
    magenta: { hue: [285, 345], sat: [0.4, 1], light: [0.3, 0.8] },
    fuchsia: { hue: [300, 330], sat: [0.6, 1], light: [0.4, 0.8] },
    celery: { hue: [75, 105], sat: [0.3, 0.7], light: [0.5, 0.8] },
    chartreuse: { hue: [60, 90], sat: [0.6, 1], light: [0.6, 0.9] },
};

const EXACT_COLOR_MAP = {
    '#000000': 'spectrum-gray-900',
    '#FFFFFF': 'spectrum-gray-50',
    '#212121': 'spectrum-gray-800',
    '#424242': 'spectrum-gray-700',
    '#616161': 'spectrum-gray-600',
    '#757575': 'spectrum-gray-500',
    '#9E9E9E': 'spectrum-gray-400',
    '#BDBDBD': 'spectrum-gray-300',
    '#E0E0E0': 'spectrum-gray-200',
    '#EEEEEE': 'spectrum-gray-100',
    '#F5F5F5': 'spectrum-gray-75',
    '#FAFAFA': 'spectrum-gray-50',
};

const SURFACE_OPTIONS = [
    { label: 'Adobe.com', value: 'acom' },
    { label: 'Creative Cloud Desktop', value: 'ccd' },
    { label: 'Adobe Home', value: 'adobe-home' },
    { label: 'Commerce', value: 'commerce' },
    { label: 'All', value: 'all' },
];

const STYLE_MAPPINGS = {
    // Heading styles based on global.css.js
    'heading-xxxs': {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-xxs': {
        fontSize: 16,
        lineHeight: 20,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-xs': {
        fontSize: 18,
        lineHeight: 22.5,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-s': {
        fontSize: 20,
        lineHeight: 25,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-m': {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-l': {
        fontSize: 20,
        lineHeight: 30,
        fontWeight: [400, 500, 600, 700],
    },
    'heading-xl': {
        fontSize: 36,
        lineHeight: 45,
        fontWeight: [400, 500, 600, 700],
    },

    // Body styles
    'body-xxs': { fontSize: 12, lineHeight: 18, fontWeight: [400, 500] },
    'body-xs': { fontSize: 14, lineHeight: 21, fontWeight: [400, 500] },
    'body-s': { fontSize: 16, lineHeight: 24, fontWeight: [400, 500] },
    'body-m': { fontSize: 18, lineHeight: 27, fontWeight: [400, 500] },
    'body-l': { fontSize: 20, lineHeight: 30, fontWeight: [400, 500] },
    'body-xl': { fontSize: 22, lineHeight: 33, fontWeight: [400, 500] },
    'body-xxl': { fontSize: 24, lineHeight: 33, fontWeight: [400, 500] },

    // Detail styles
    'detail-s': { fontSize: 11, lineHeight: 14, fontWeight: [700] },
    'detail-m': { fontSize: 12, lineHeight: 15, fontWeight: [700] },
};

class FigmaToMerchCardMCP {
    constructor() {
        this.server = new Server(
            {
                name: 'figma-to-merch-card',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.setupToolHandlers();
    }

    getAccessToken(providedToken) {
        const token = process.env.FIGMA_ACCESS_TOKEN || providedToken;

        if (!token) {
            throw new Error(
                'Figma access token is required. Either:\n' +
                    '1. Set FIGMA_ACCESS_TOKEN environment variable, or\n' +
                    '2. Provide accessToken parameter\n\n' +
                    'To set environment variable:\n' +
                    'export FIGMA_ACCESS_TOKEN=your_token_here',
            );
        }

        return token;
    }

    /**
     * Resolves the output path to an absolute path to prevent file creation issues
     */
    resolveOutputPath(outputPath) {
        if (isAbsolute(outputPath)) {
            return outputPath;
        }
        // Convert relative path to absolute path based on current working directory
        return resolve(process.cwd(), outputPath);
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'convert_figma_to_merch_card',
                    description:
                        'Convert a Figma file or frame to a merch card variant and save to variants directory',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            figmaUrl: {
                                type: 'string',
                                description: 'Figma file URL or file key',
                            },
                            accessToken: {
                                type: 'string',
                                description:
                                    'Figma API access token (optional if FIGMA_ACCESS_TOKEN env var is set)',
                            },
                            frameId: {
                                type: 'string',
                                description:
                                    'Specific frame ID to convert (optional)',
                            },
                            variantName: {
                                type: 'string',
                                description: 'Name for the new variant',
                            },
                            outputPath: {
                                type: 'string',
                                description:
                                    'Base path for output files (default: web-components/src)',
                                default: 'web-components/src',
                            },
                        },
                        required: ['figmaUrl', 'variantName'],
                    },
                },
                {
                    name: 'analyze_figma_design',
                    description:
                        'Analyze a Figma design and extract component structure',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            figmaUrl: {
                                type: 'string',
                                description: 'Figma file URL or file key',
                            },
                            accessToken: {
                                type: 'string',
                                description:
                                    'Figma API access token (optional if FIGMA_ACCESS_TOKEN env var is set)',
                            },
                            frameId: {
                                type: 'string',
                                description:
                                    'Specific frame ID to analyze (optional)',
                            },
                        },
                        required: ['figmaUrl'],
                    },
                },
                {
                    name: 'update_variant_picker',
                    description:
                        'Add a new variant to the studio variant picker',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            variantName: {
                                type: 'string',
                                description: 'Name of the variant to add',
                            },
                            outputPath: {
                                type: 'string',
                                description:
                                    'Base path for output files (default: web-components/src)',
                                default: 'web-components/src',
                            },
                        },
                        required: ['variantName'],
                    },
                },
                {
                    name: 'generate_variant_code',
                    description:
                        'Generate merch card variant code from design analysis',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            designAnalysis: {
                                type: 'object',
                                description:
                                    'Design analysis object from analyze_figma_design',
                            },
                            variantName: {
                                type: 'string',
                                description: 'Name for the variant',
                            },
                        },
                        required: ['designAnalysis', 'variantName'],
                    },
                },
                {
                    name: 'convert_figma_with_surface_selection',
                    description:
                        'Convert a Figma design to merch card variant with surface selection and improved style matching',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            figmaUrl: {
                                type: 'string',
                                description: 'Figma file URL or file key',
                            },
                            accessToken: {
                                type: 'string',
                                description:
                                    'Figma API access token (optional if FIGMA_ACCESS_TOKEN env var is set)',
                            },
                            frameId: {
                                type: 'string',
                                description:
                                    'Specific frame ID to convert (optional)',
                            },
                            variantName: {
                                type: 'string',
                                description: 'Name for the new variant',
                            },
                            surface: {
                                type: 'string',
                                description:
                                    'Target surface (acom, ccd, adobe-home, commerce, all)',
                                enum: [
                                    'acom',
                                    'ccd',
                                    'adobe-home',
                                    'commerce',
                                    'all',
                                ],
                            },
                            outputPath: {
                                type: 'string',
                                description:
                                    'Base path for output files (default: web-components/src)',
                                default: 'web-components/src',
                            },
                        },
                        required: ['figmaUrl', 'variantName', 'surface'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request) => {
                const { name, arguments: args } = request.params;

                switch (name) {
                    case 'convert_figma_to_merch_card':
                        return this.convertFigmaToMerchCard(args);
                    case 'convert_figma_with_surface_selection':
                        return this.convertFigmaWithSurfaceSelection(args);
                    case 'analyze_figma_design':
                        return this.analyzeFigmaDesign(args);
                    case 'update_variant_picker':
                        return this.handleUpdateVariantPicker(args);
                    case 'generate_variant_code':
                        return this.generateVariantCode(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            },
        );
    }

    static extractFileKey(figmaUrl) {
        const match = figmaUrl.match(
            /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
        );
        return match ? match[1] : figmaUrl;
    }

    /**
     * Extracts frame ID from Figma URL and converts from URL format (6-32191) to API format (6:32191)
     * This is a critical conversion that prevents frame targeting issues
     */
    static extractFrameIdFromUrl(figmaUrl) {
        try {
            const url = new URL(figmaUrl);
            const nodeId = url.searchParams.get('node-id');
            if (nodeId) {
                // Convert URL format (6-32191) to API format (6:32191)
                // This is the key conversion that fixes frame targeting issues
                const convertedId = nodeId.replace(/-/g, ':');
                console.log(`Frame ID conversion: ${nodeId} -> ${convertedId}`);
                return convertedId;
            }
        } catch (error) {
            console.error('Failed to extract frame ID from URL:', error);
        }
        return null;
    }

    /**
     * Normalizes frame ID format to ensure consistent API calls
     */
    static normalizeFrameId(frameId) {
        if (!frameId) return null;
        // Convert dash format to colon format if needed
        const normalized = frameId.replace(/-/g, ':');
        if (frameId !== normalized) {
            console.log(`Frame ID normalized: ${frameId} -> ${normalized}`);
        }
        return normalized;
    }

    static async fetchFigmaFile(fileKey, accessToken) {
        const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
            headers: { 'X-Figma-Token': accessToken },
        });

        if (!response.ok) {
            throw new Error(
                `Figma API error: ${response.status} ${response.statusText}`,
            );
        }

        return response.json();
    }

    static async fetchFigmaImages(fileKey, nodeIds, accessToken) {
        const nodeIdsParam = nodeIds.join(',');
        const response = await fetch(
            `${FIGMA_API_BASE}/images/${fileKey}?ids=${nodeIdsParam}&format=png&scale=2`,
            {
                headers: { 'X-Figma-Token': accessToken },
            },
        );

        if (!response.ok) {
            throw new Error(
                `Figma Images API error: ${response.status} ${response.statusText}`,
            );
        }

        return response.json();
    }

    static rgbToHex(r, g, b) {
        return `#${[r, g, b]
            .map((x) => {
                const hex = Math.round(x * 255).toString(16);
                return hex.length === 1 ? `0${hex}` : hex;
            })
            .join('')
            .toUpperCase()}`;
    }

    static hexToHsl(hex) {
        const r = parseInt(hex.substr(1, 2), 16) / 255;
        const g = parseInt(hex.substr(3, 2), 16) / 255;
        const b = parseInt(hex.substr(5, 2), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [h * 360, s, l];
    }

    static findBestSpectrumColor(hex) {
        if (EXACT_COLOR_MAP[hex.toUpperCase()]) {
            return EXACT_COLOR_MAP[hex.toUpperCase()];
        }

        const [hue, sat, light] = FigmaToMerchCardMCP.hexToHsl(hex);

        if (sat < 0.1) {
            if (light < 0.1) return 'spectrum-gray-900';
            if (light < 0.2) return 'spectrum-gray-800';
            if (light < 0.3) return 'spectrum-gray-700';
            if (light < 0.4) return 'spectrum-gray-600';
            if (light < 0.5) return 'spectrum-gray-500';
            if (light < 0.6) return 'spectrum-gray-400';
            if (light < 0.7) return 'spectrum-gray-300';
            if (light < 0.8) return 'spectrum-gray-200';
            if (light < 0.9) return 'spectrum-gray-100';
            if (light < 0.95) return 'spectrum-gray-75';
            return 'spectrum-gray-50';
        }

        let bestColorFamily = 'gray';
        for (const [family, ranges] of Object.entries(COLOR_RANGES)) {
            const { hue: hueRange, sat: satRange, light: lightRange } = ranges;

            const hueMatch =
                (hue >= hueRange[0] && hue <= hueRange[1]) ||
                (hueRange[0] > hueRange[1] &&
                    (hue >= hueRange[0] || hue <= hueRange[1]));

            if (
                hueMatch &&
                sat >= satRange[0] &&
                sat <= satRange[1] &&
                light >= lightRange[0] &&
                light <= lightRange[1]
            ) {
                bestColorFamily = family;
                break;
            }
        }

        const availableColors = SPECTRUM_COLORS.filter((color) =>
            color.startsWith(`spectrum-${bestColorFamily}-`),
        );

        if (availableColors.length === 0) {
            return `spectrum-${bestColorFamily}-500`;
        }

        let bestWeight = 500;
        if (light < 0.3) bestWeight = 800;
        else if (light < 0.4) bestWeight = 700;
        else if (light < 0.5) bestWeight = 600;
        else if (light < 0.6) bestWeight = 500;
        else if (light < 0.7) bestWeight = 400;
        else if (light < 0.8) bestWeight = 300;
        else if (light < 0.9) bestWeight = 200;
        else bestWeight = 100;

        const targetColor = `spectrum-${bestColorFamily}-${bestWeight}`;
        if (availableColors.includes(targetColor)) {
            return targetColor;
        }

        return (
            availableColors.find((color) => color.includes('500')) ||
            availableColors[0]
        );
    }

    mapToSpectrumColor(color) {
        if (typeof color === 'object' && color.r !== undefined) {
            const hex = FigmaToMerchCardMCP.rgbToHex(color.r, color.g, color.b);
            return FigmaToMerchCardMCP.findBestSpectrumColor(hex);
        }
        return FigmaToMerchCardMCP.findBestSpectrumColor(color);
    }

    analyzeNode(node, depth = 0) {
        const analysis = {
            id: node.id,
            name: node.name,
            type: node.type,
            depth,
            styles: {},
            children: [],
        };

        if (node.fills && node.fills.length > 0) {
            const fill = node.fills[0];
            if (fill.type === 'SOLID') {
                analysis.styles.backgroundColor = this.mapToSpectrumColor(
                    fill.color,
                );
            }
        }

        if (node.strokes && node.strokes.length > 0) {
            const stroke = node.strokes[0];
            if (stroke.type === 'SOLID') {
                analysis.styles.borderColor = this.mapToSpectrumColor(
                    stroke.color,
                );
                analysis.styles.borderWidth = node.strokeWeight || 1;
            }
        }

        if (node.cornerRadius) {
            analysis.styles.borderRadius = node.cornerRadius;
        }

        if (node.style) {
            analysis.textStyle = {
                fontSize: node.style.fontSize,
                fontWeight: node.style.fontWeight,
                fontFamily: node.style.fontFamily,
                textAlign: node.style.textAlignHorizontal?.toLowerCase(),
            };
        }

        if (node.characters) {
            analysis.text = node.characters;
        }

        if (node.children) {
            analysis.children = node.children.map((child) =>
                this.analyzeNode(child, depth + 1),
            );
        }

        return analysis;
    }

    static determineSlotType(node) {
        const name = node.name.toLowerCase();
        const text = node.text?.toLowerCase() || '';
        const textStyle = node.textStyle;

        // Special slot types that don't match text styles
        if (name.includes('button') || name.includes('cta')) {
            return 'cta';
        }

        if (name.includes('badge') || name.includes('label')) {
            return 'badge';
        }

        if (name.includes('icon') || name.includes('mnemonic')) {
            return 'icons';
        }

        if (
            name.includes('price') ||
            text.includes('$') ||
            text.includes('price') ||
            text.includes('/mo') ||
            text.includes('per license')
        ) {
            return 'price';
        }

        if (name.includes('trial') && name.includes('badge')) {
            return 'trial-badge';
        }

        if (name.includes('callout') || name.includes('highlight')) {
            return 'callout-content';
        }

        if (name.includes('promo') || name.includes('offer')) {
            return 'promo-text';
        }

        // Match text styles to existing CSS variables
        if (textStyle) {
            const bestMatch = FigmaToMerchCardMCP.findBestStyleMatch(
                textStyle,
                name,
                text,
            );
            if (bestMatch) return bestMatch;
        }

        // Fallback based on semantic meaning
        if (name.includes('title') || name.includes('heading')) {
            return 'heading-xs';
        }

        if (name.includes('description') || name.includes('body')) {
            return 'body-xs';
        }

        return 'body-xs';
    }

    static findBestStyleMatch(textStyle, name = '', text = '') {
        const { fontSize, fontWeight, lineHeight } = textStyle;
        let bestMatch = null;
        let bestScore = 0;

        // Determine if this should be a heading or body based on weight and context
        const isHeading =
            fontWeight >= 600 ||
            name.includes('title') ||
            name.includes('heading') ||
            name.includes('price') ||
            text.includes('$');

        for (const [styleName, styleProps] of Object.entries(STYLE_MAPPINGS)) {
            let score = 0;

            // Skip if heading/body type doesn't match
            if (
                isHeading &&
                !styleName.startsWith('heading') &&
                !styleName.startsWith('detail')
            )
                continue;
            if (!isHeading && styleName.startsWith('heading')) continue;

            // Font size match (most important)
            if (Math.abs(styleProps.fontSize - fontSize) <= 2) {
                score += 50;
                if (styleProps.fontSize === fontSize) score += 20;
            } else if (Math.abs(styleProps.fontSize - fontSize) <= 4) {
                score += 20;
            }

            // Font weight match
            if (styleProps.fontWeight.includes(fontWeight)) {
                score += 30;
            }

            // Line height match (if available)
            if (
                lineHeight &&
                Math.abs(styleProps.lineHeight - lineHeight) <= 2
            ) {
                score += 20;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = styleName;
            }
        }

        return bestScore > 40 ? bestMatch : null;
    }

    generateAEMFragmentMapping(analysis) {
        const detectedSlots = {
            headingSlots: new Set(),
            bodySlots: new Set(),
            hasIcons: false,
            hasPrice: false,
            hasBadge: false,
            hasCta: false,
        };

        const processNode = (node) => {
            if (node.type === 'TEXT' && node.text && node.textStyle) {
                const slotType = FigmaToMerchCardMCP.determineSlotType(node);

                if (slotType === 'icons') {
                    detectedSlots.hasIcons = true;
                } else if (slotType === 'price') {
                    detectedSlots.hasPrice = true;
                } else if (slotType === 'badge' || slotType === 'trial-badge') {
                    detectedSlots.hasBadge = true;
                } else if (slotType === 'cta') {
                    detectedSlots.hasCta = true;
                } else if (slotType.startsWith('heading-')) {
                    detectedSlots.headingSlots.add(slotType);
                } else if (slotType.startsWith('body-')) {
                    detectedSlots.bodySlots.add(slotType);
                }
            }

            if (node.children) {
                node.children.forEach(processNode);
            }
        };

        processNode(analysis);

        // Build the standard AEM fragment mapping
        const mapping = {};

        // Always include mnemonics for icons (standard in merch cards)
        if (detectedSlots.hasIcons || true) {
            // Keep icons available even if not detected
            mapping.mnemonics = { size: 's' };
        }

        // Add detected heading slots
        if (detectedSlots.headingSlots.size > 0) {
            // Determine primary title slot (usually the largest or most prominent)
            const headingSizes = [
                'heading-xl',
                'heading-l',
                'heading-m',
                'heading-s',
                'heading-xs',
                'heading-xxs',
                'heading-xxxs',
            ];
            const primaryHeading =
                headingSizes.find((size) =>
                    detectedSlots.headingSlots.has(size),
                ) || 'heading-xxs';

            mapping.title = {
                tag: 'h3',
                slot: primaryHeading,
                maxCount: 250,
                withSuffix: true,
            };

            // Add secondary headings if present
            const remainingHeadings = Array.from(
                detectedSlots.headingSlots,
            ).filter((h) => h !== primaryHeading);
            if (remainingHeadings.length > 0) {
                mapping.subtitle = {
                    tag: 'h4',
                    slot: remainingHeadings[0],
                    maxCount: 200,
                    withSuffix: true,
                };
            }
        }

        // Add detected body slots
        if (detectedSlots.bodySlots.size > 0) {
            // Determine primary body slot
            const bodySizes = [
                'body-xl',
                'body-l',
                'body-m',
                'body-s',
                'body-xs',
                'body-xxs',
            ];
            const primaryBody =
                bodySizes.find((size) => detectedSlots.bodySlots.has(size)) ||
                'body-s';

            mapping.description = {
                tag: 'div',
                slot: primaryBody,
                maxCount: 2000,
                withSuffix: false,
            };
        }

        // Add badge support if detected or as standard
        mapping.badge = {
            tag: 'div',
            slot: 'badge',
            default: 'spectrum-yellow-300',
        };

        mapping.trialBadge = {
            tag: 'div',
            slot: 'trial-badge',
            default: 'spectrum-green-800',
        };

        // Add price support if detected or as standard
        if (detectedSlots.hasPrice || true) {
            // Keep price available even if not detected
            mapping.prices = { tag: 'p', slot: 'price' };
        }

        // Add CTA support if detected or as standard
        if (detectedSlots.hasCta || true) {
            // Keep CTA available even if not detected
            mapping.ctas = { slot: 'cta', size: 'M' };
        }

        // Always include addon confirmation (standard in merch cards)
        mapping.addonConfirmation = { tag: 'div', slot: 'addon-confirmation' };

        // Border color customization (standard)
        mapping.borderColor = {
            attribute: 'border-color',
            specialValues: {
                gray: '--spectrum-gray-300',
            },
        };

        return mapping;
    }

    generateVariantCSS(analysis, variantName) {
        const styles = [];

        styles.push(':root {');
        styles.push(`    --consonant-merch-card-${variantName}-width: 300px;`);
        styles.push('}');
        styles.push('');

        styles.push(`merch-card[variant="${variantName}"] {`);
        styles.push(
            `    width: var(--consonant-merch-card-${variantName}-width);`,
        );

        if (analysis.styles && analysis.styles.backgroundColor) {
            styles.push(
                `    background-color: var(--${analysis.styles.backgroundColor});`,
            );
        }

        if (analysis.styles && analysis.styles.borderColor) {
            styles.push(
                `    border: 1px solid var(--${analysis.styles.borderColor});`,
            );
        }

        if (analysis.styles && analysis.styles.borderRadius) {
            styles.push(
                `    border-radius: ${analysis.styles.borderRadius}px;`,
            );
        }

        styles.push('}');

        return styles.join('\n');
    }

    generateVariantClass(analysis, variantName) {
        const className = variantName
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        const aemMapping = this.generateAEMFragmentMapping(analysis);
        const constantName = variantName.toUpperCase().replace(/-/g, '_');

        return `import { html, css } from 'lit';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './${variantName}.css.js';

export const ${constantName}_AEM_FRAGMENT_MAPPING = ${JSON.stringify(aemMapping, null, 4)};

export class ${className} extends VariantLayout {
    getGlobalCSS() {
        return CSS;
    }

    get aemFragmentMapping() {
        return ${constantName}_AEM_FRAGMENT_MAPPING;
    }

    renderLayout() {
        return html\`
${this.generateSlotHTML(aemMapping)}
        \`;
    }

    static variantStyle = css\`
        :host([variant='${variantName}']) {
            --merch-card-${variantName}-max-width: 620px;
            --merch-card-${variantName}-padding: 24px;
            --merch-card-${variantName}-min-height: 204px;
            --merch-card-${variantName}-header-min-height: 36px;
            --merch-card-${variantName}-gray-background: rgba(248, 248, 248);
            --merch-card-${variantName}-text-color: rgba(19, 19, 19);
            --merch-card-${variantName}-price-line-height: 17px;
            --merch-card-${variantName}-outline: transparent;
            --merch-card-custom-border-width: 1px;
            max-width: var(--merch-card-${variantName}-max-width);
            min-height: var(--merch-card-${variantName}-min-height);
            background-color: var(
                --merch-card-custom-background-color,
                var(--spectrum-gray-300)
            );
            color: var(--consonant-merch-card-heading-xxxs-color);
            border-radius: 4px;
            border: 1px solid var(--merch-card-custom-border-color, transparent);
            display: flex;
            flex-direction: row;
            overflow: hidden;
            padding: var(--merch-card-${variantName}-padding) !important;
            gap: 16px;
            justify-content: space-between;
            box-sizing: border-box !important;
        }

        :host([variant='${variantName}']) .content {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            flex-grow: 1;
        }

        :host([variant='${variantName}']) .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: var(--consonant-merch-spacing-xxs);
            padding-bottom: 15px;
            padding-top: 5px;
        }

        :host([variant='${variantName}']) .footer {
            display: flex;
            width: fit-content;
            flex-wrap: nowrap;
            gap: 8px;
            flex-direction: row;
            margin-top: auto;
            align-items: end;
            width: 100%;
            justify-content: space-between;
        }

        :host([variant='${variantName}']) .cta {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            margin-top: 15px;
        }
    \`;
}

customElements.define('${variantName}-card', ${className});`;
    }

    generateSlotHTML(aemMapping) {
        const slots = {
            hasIcons: !!aemMapping.mnemonics,
            hasTitle: !!aemMapping.title,
            hasSubtitle: !!aemMapping.subtitle,
            hasDescription: !!aemMapping.description,
            hasPrice: !!aemMapping.prices,
            hasCta: !!aemMapping.ctas,
            hasBadge: !!aemMapping.badge,
            hasTrialBadge: !!aemMapping.trialBadge,
        };

        // Generate template structure similar to existing variants
        const template = [];
        template.push('            <div class="content">');
        template.push('                <div class="header">');

        if (slots.hasIcons) {
            template.push('                    <slot name="icons"></slot>');
        }

        if (slots.hasTitle) {
            template.push(`                    <slot name="${aemMapping.title.slot}"></slot>`);
        }

        if (slots.hasSubtitle) {
            template.push(`                    <slot name="${aemMapping.subtitle.slot}"></slot>`);
        }

        if (slots.hasTrialBadge) {
            template.push('                    <slot name="trial-badge"></slot>');
        }

        template.push('                </div>');

        if (slots.hasBadge) {
            template.push('                <slot name="badge"></slot>');
        }

        if (slots.hasDescription) {
            template.push(`                <slot name="${aemMapping.description.slot}"></slot>`);
        }

        template.push('                <div class="footer">');
        template.push('                    <div class="cta">');

        if (slots.hasCta) {
            template.push('                        <slot name="cta"></slot>');
        }

        template.push('                        <slot name="addon-confirmation"></slot>');
        template.push('                    </div>');

        if (slots.hasPrice) {
            template.push('                    <slot name="price"></slot>');
        }

        template.push('                </div>');
        template.push('            </div>');
        template.push('            <slot></slot>');

        return template.join('\n');
    }

    static generateCSSFile(css) {
        return `export const CSS = \`
${css}
\`;`;
    }

    saveVariantFiles(
        variantName,
        variantClass,
        cssFile,
        outputPath = 'web-components/src',
    ) {
        // Resolve path to absolute to prevent file creation issues
        const resolvedOutputPath = this.resolveOutputPath(outputPath);
        const variantsDir = join(resolvedOutputPath, 'variants');
        const variantJsPath = join(variantsDir, `${variantName}.js`);
        const variantCssPath = join(variantsDir, `${variantName}.css.js`);

        try {
            // Ensure the variants directory exists
            if (!existsSync(variantsDir)) {
                console.log(`Creating variants directory: ${variantsDir}`);
                mkdirSync(variantsDir, { recursive: true });
            }

            console.log(`Saving variant files:`);
            console.log(`- JS: ${variantJsPath}`);
            console.log(`- CSS: ${variantCssPath}`);

            writeFileSync(variantJsPath, variantClass);
            writeFileSync(variantCssPath, cssFile);

            return {
                variantJsPath,
                variantCssPath,
                success: true,
            };
        } catch (error) {
            console.error(`Failed to save variant files:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    updateMasJs(variantName, outputPath = 'web-components/src') {
        const resolvedOutputPath = this.resolveOutputPath(outputPath);
        const masJsPath = join(resolvedOutputPath, 'mas.js');

        if (!existsSync(masJsPath)) {
            return {
                success: false,
                error: 'mas.js file not found',
            };
        }

        try {
            const masJsContent = readFileSync(masJsPath, 'utf8');
            const className = variantName
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
            const constantName = variantName.toUpperCase().replace(/-/g, '_');

            const importStatement = `import {
  ${constantName}_AEM_FRAGMENT_MAPPING,
  ${className},
} from './variants/${variantName}.js';`;

            const registerStatement = `registerVariant(
  '${variantName}',
  ${className},
  ${constantName}_AEM_FRAGMENT_MAPPING,
  ${className}.variantStyle,
);`;

            const lines = masJsContent.split('\n');
            let importInserted = false;
            let registerInserted = false;
            const newLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (
                    !importInserted &&
                    line.includes("from './variants/") &&
                    line.includes(".js';")
                ) {
                    newLines.push(line);
                    newLines.push('');
                    newLines.push(`// Import ${variantName}`);
                    newLines.push(importStatement);
                    importInserted = true;
                } else if (
                    !registerInserted &&
                    line.includes('registerVariant(') &&
                    i > 0
                ) {
                    if (
                        !newLines[newLines.length - 1].includes(
                            'registerVariant(',
                        )
                    ) {
                        newLines.push(registerStatement);
                        newLines.push('');
                        registerInserted = true;
                    }
                    newLines.push(line);
                } else {
                    newLines.push(line);
                }
            }

            if (!registerInserted) {
                newLines.push('');
                newLines.push(registerStatement);
            }

            writeFileSync(masJsPath, newLines.join('\n'));

            return {
                success: true,
                masJsPath,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    updateVariantPicker(
        variantName,
        surface = 'acom',
        outputPath = 'web-components/src',
    ) {
        const resolvedOutputPath = this.resolveOutputPath(outputPath);
        const variantPickerPath = join(
            resolvedOutputPath,
            '..',
            'studio',
            'src',
            'editors',
            'variant-picker.js',
        );

        if (!existsSync(variantPickerPath)) {
            return {
                success: false,
                error: 'variant-picker.js file not found',
            };
        }

        try {
            const variantPickerContent = readFileSync(
                variantPickerPath,
                'utf8',
            );
            const lines = variantPickerContent.split('\n');

            const variantLabel = variantName
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const newVariantEntry = `    { label: '${variantLabel}', value: '${variantName}', surface: '${surface}' },`;

            let variantInserted = false;
            const newLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (
                    !variantInserted &&
                    line.includes('{ label:') &&
                    line.includes('surface:') &&
                    i < lines.length - 1 &&
                    lines[i + 1].includes('];')
                ) {
                    newLines.push(line);
                    newLines.push(newVariantEntry);
                    variantInserted = true;
                } else {
                    newLines.push(line);
                }
            }

            if (!variantInserted) {
                const variantsEndIndex = lines.findIndex((line) =>
                    line.includes('];'),
                );
                if (variantsEndIndex > 0) {
                    lines.splice(variantsEndIndex, 0, newVariantEntry);
                    writeFileSync(variantPickerPath, lines.join('\n'));
                }
            } else {
                writeFileSync(variantPickerPath, newLines.join('\n'));
            }

            return {
                success: true,
                variantPickerPath,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async handleUpdateVariantPicker(args) {
        try {
            const { variantName, outputPath = 'web-components/src' } = args;
            const result = this.updateVariantPicker(variantName, outputPath);

            return {
                content: [
                    {
                        type: 'text',
                        text: result.success
                            ? `Successfully added variant "${variantName}" to variant picker`
                            : `Failed to update variant picker: ${result.error}`,
                    },
                    {
                        type: 'text',
                        text: result.success
                            ? `\n✅ Updated ${result.variantPickerPath}`
                            : '',
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error updating variant picker: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    async convertFigmaToMerchCard(args) {
        try {
            const {
                figmaUrl,
                accessToken,
                frameId,
                variantName,
                outputPath = 'web-components/src',
            } = args;
            const fileKey = FigmaToMerchCardMCP.extractFileKey(figmaUrl);

            const fileData = await FigmaToMerchCardMCP.fetchFigmaFile(
                fileKey,
                this.getAccessToken(accessToken),
            );

            let targetFrameId = frameId;

            // Auto-extract frameId from URL if not provided or try to normalize it
            if (!targetFrameId) {
                targetFrameId =
                    FigmaToMerchCardMCP.extractFrameIdFromUrl(figmaUrl);
            } else {
                targetFrameId =
                    FigmaToMerchCardMCP.normalizeFrameId(targetFrameId);
            }

            let targetNode;
            if (targetFrameId) {
                const findNode = (node) => {
                    if (node.id === targetFrameId) return node;
                    if (node.children) {
                        for (const child of node.children) {
                            const found = findNode(child);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                targetNode = findNode(fileData.document);

                // If not found with normalized ID, try fallback approach
                if (!targetNode && frameId && frameId !== targetFrameId) {
                    const fallbackFindNode = (node) => {
                        if (node.id === frameId) return node;
                        if (node.children) {
                            for (const child of node.children) {
                                const found = fallbackFindNode(child);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    targetNode = fallbackFindNode(fileData.document);
                }
            } else {
                targetNode = fileData.document.children[0]?.children[0];
            }

            if (!targetNode) {
                throw new Error('Target frame not found');
            }

            const analysis = this.analyzeNode(targetNode);
            const variantClass = this.generateVariantClass(
                analysis,
                variantName,
            );
            const css = this.generateVariantCSS(analysis, variantName);
            const cssFile = FigmaToMerchCardMCP.generateCSSFile(css);

            const saveResult = this.saveVariantFiles(
                variantName,
                variantClass,
                cssFile,
                outputPath,
            );

            if (!saveResult.success) {
                throw new Error(`Failed to save files: ${saveResult.error}`);
            }

            const masUpdateResult = this.updateMasJs(variantName, outputPath);
            const variantPickerUpdateResult = this.updateVariantPicker(
                variantName,
                outputPath,
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: `Successfully converted Figma design to merch card variant "${variantName}"`,
                    },
                    {
                        type: 'text',
                        text: `\n📁 Files saved to variants directory:\n• ${saveResult.variantJsPath}\n• ${saveResult.variantCssPath}`,
                    },
                    {
                        type: 'text',
                        text: masUpdateResult.success
                            ? `\n✅ Automatically registered variant in ${masUpdateResult.masJsPath}`
                            : `\n⚠️  Could not auto-register in mas.js: ${masUpdateResult.error}`,
                    },
                    {
                        type: 'text',
                        text: variantPickerUpdateResult.success
                            ? `\n✅ Automatically added variant to ${variantPickerUpdateResult.variantPickerPath}`
                            : `\n⚠️  Could not auto-update variant-picker.js: ${variantPickerUpdateResult.error}`,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Generated Variant Class:\n\`\`\`javascript\n${variantClass}\n\`\`\``,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Generated CSS:\n\`\`\`javascript\n${cssFile}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error converting Figma to merch card: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    async analyzeFigmaDesign(args) {
        try {
            const { figmaUrl, accessToken, frameId } = args;
            const fileKey = FigmaToMerchCardMCP.extractFileKey(figmaUrl);

            const fileData = await FigmaToMerchCardMCP.fetchFigmaFile(
                fileKey,
                this.getAccessToken(accessToken),
            );

            let targetFrameId = frameId;

            // Auto-extract frameId from URL if not provided or try to normalize it
            if (!targetFrameId) {
                targetFrameId =
                    FigmaToMerchCardMCP.extractFrameIdFromUrl(figmaUrl);
            } else {
                targetFrameId =
                    FigmaToMerchCardMCP.normalizeFrameId(targetFrameId);
            }

            let targetNode;
            if (targetFrameId) {
                const findNode = (node) => {
                    if (node.id === targetFrameId) return node;
                    if (node.children) {
                        for (const child of node.children) {
                            const found = findNode(child);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                targetNode = findNode(fileData.document);

                // If not found with normalized ID, try fallback approach
                if (!targetNode && frameId && frameId !== targetFrameId) {
                    const fallbackFindNode = (node) => {
                        if (node.id === frameId) return node;
                        if (node.children) {
                            for (const child of node.children) {
                                const found = fallbackFindNode(child);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    targetNode = fallbackFindNode(fileData.document);
                }
            } else {
                targetNode = fileData.document.children[0]?.children[0];
            }

            if (!targetNode) {
                throw new Error('Target frame not found');
            }

            const analysis = this.analyzeNode(targetNode);

            return {
                content: [
                    {
                        type: 'text',
                        text: 'Design Analysis Complete',
                    },
                    {
                        type: 'text',
                        text: `\n\n## Structure Analysis:\n\`\`\`json\n${JSON.stringify(analysis, null, 2)}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error analyzing Figma design: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    async generateVariantCode(args) {
        try {
            const { designAnalysis, variantName } = args;

            const variantClass = this.generateVariantClass(
                designAnalysis,
                variantName,
            );
            const css = this.generateVariantCSS(designAnalysis, variantName);
            const cssFile = FigmaToMerchCardMCP.generateCSSFile(css);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated variant code for "${variantName}"`,
                    },
                    {
                        type: 'text',
                        text: `\n\n### ${variantName}.js\n\`\`\`javascript\n${variantClass}\n\`\`\``,
                    },
                    {
                        type: 'text',
                        text: `\n\n### ${variantName}.css.js\n\`\`\`javascript\n${cssFile}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error generating variant code: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    async convertFigmaWithSurfaceSelection(args) {
        try {
            const {
                figmaUrl,
                accessToken,
                frameId,
                variantName,
                surface,
                outputPath = 'web-components/src',
            } = args;

            // Show available surface options if not provided
            if (!surface) {
                const surfaceList = SURFACE_OPTIONS.map(
                    (opt) => `• ${opt.label} (${opt.value})`,
                ).join('\n');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Please specify a surface. Available options:\n\n${surfaceList}`,
                        },
                    ],
                };
            }

            const fileKey = FigmaToMerchCardMCP.extractFileKey(figmaUrl);

            const fileData = await FigmaToMerchCardMCP.fetchFigmaFile(
                fileKey,
                this.getAccessToken(accessToken),
            );

            let targetFrameId = frameId;

            // Auto-extract frameId from URL if not provided or try to normalize it
            if (!targetFrameId) {
                targetFrameId =
                    FigmaToMerchCardMCP.extractFrameIdFromUrl(figmaUrl);
            } else {
                targetFrameId =
                    FigmaToMerchCardMCP.normalizeFrameId(targetFrameId);
            }

            let targetNode;
            if (targetFrameId) {
                const findNode = (node) => {
                    if (node.id === targetFrameId) return node;
                    if (node.children) {
                        for (const child of node.children) {
                            const found = findNode(child);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                targetNode = findNode(fileData.document);

                // If not found with normalized ID, try fallback approach
                if (!targetNode && frameId && frameId !== targetFrameId) {
                    const fallbackFindNode = (node) => {
                        if (node.id === frameId) return node;
                        if (node.children) {
                            for (const child of node.children) {
                                const found = fallbackFindNode(child);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    targetNode = fallbackFindNode(fileData.document);
                }
            } else {
                targetNode = fileData.document.children[0]?.children[0];
            }

            if (!targetNode) {
                throw new Error('Target frame not found');
            }

            const analysis = this.analyzeNode(targetNode);
            const variantClass = this.generateVariantClass(
                analysis,
                variantName,
            );
            const css = this.generateVariantCSS(analysis, variantName);
            const cssFile = FigmaToMerchCardMCP.generateCSSFile(css);

            const saveResult = this.saveVariantFiles(
                variantName,
                variantClass,
                cssFile,
                outputPath,
            );

            if (!saveResult.success) {
                throw new Error(`Failed to save files: ${saveResult.error}`);
            }

            const masUpdateResult = this.updateMasJs(variantName, outputPath);
            const variantPickerUpdateResult = this.updateVariantPicker(
                variantName,
                surface,
                outputPath,
            );

            return {
                content: [
                    {
                        type: 'text',
                        text: `Successfully converted Figma design to merch card variant "${variantName}" for surface "${surface}"`,
                    },
                    {
                        type: 'text',
                        text: `\n📁 Files saved to variants directory:\n• ${saveResult.variantJsPath}\n• ${saveResult.variantCssPath}`,
                    },
                    {
                        type: 'text',
                        text: masUpdateResult.success
                            ? `\n✅ Automatically registered variant in ${masUpdateResult.masJsPath}`
                            : `\n⚠️  Could not auto-register in mas.js: ${masUpdateResult.error}`,
                    },
                    {
                        type: 'text',
                        text: variantPickerUpdateResult.success
                            ? `\n✅ Automatically added variant to ${variantPickerUpdateResult.variantPickerPath} with surface "${surface}"`
                            : `\n⚠️  Could not auto-update variant-picker.js: ${variantPickerUpdateResult.error}`,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Style Matching Summary:\nUsing improved style matching that maps Figma text styles to existing CSS variables in global.css.js`,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Generated Variant Class:\n\`\`\`javascript\n${variantClass}\n\`\`\``,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Generated CSS:\n\`\`\`javascript\n${cssFile}\n\`\`\``,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error converting Figma to merch card: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}

export { FigmaToMerchCardMCP };

const server = new FigmaToMerchCardMCP();
server.run().catch(console.error);
