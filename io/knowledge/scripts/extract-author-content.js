import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUDIO_SRC = join(__dirname, '../../../studio/src');
const OUTPUT_DIR = join(__dirname, '../src/knowledge-chunks');

const SURFACES = {
    acom: { label: 'Adobe.com', description: 'Adobe website pricing and product pages' },
    'adobe-home': { label: 'Adobe Home', description: 'Adobe Home desktop app' },
    ccd: { label: 'Creative Cloud Desktop', description: 'Creative Cloud Desktop app' },
    commerce: { label: 'Commerce', description: 'Checkout and commerce flows' },
    express: { label: 'Express', description: 'Adobe Express pricing pages' },
};

const VARIANTS = [
    {
        value: 'catalog',
        label: 'Catalog',
        surface: 'acom',
        useCase: 'Standard product catalog cards on adobe.com',
        description:
            'The most common card type for displaying products with pricing, features, and CTAs on adobe.com product pages.',
    },
    {
        value: 'plans',
        label: 'Plans',
        surface: 'acom',
        useCase: 'Subscription plans comparison',
        description: 'Shows subscription plans with pricing tiers, perfect for plans comparison pages.',
    },
    {
        value: 'plans-v2',
        label: 'Plans v2',
        surface: 'acom',
        useCase: 'Updated subscription plans with enhanced features',
        description: 'Next generation plans card with improved layout and additional fields for richer content.',
    },
    {
        value: 'plans-students',
        label: 'Plans Students',
        surface: 'acom',
        useCase: 'Student-specific subscription offers',
        description: 'Tailored for student pricing pages with education-specific messaging and verification.',
    },
    {
        value: 'plans-education',
        label: 'Plans Education',
        surface: 'acom',
        useCase: 'Education institution offers',
        description: 'For K-12 and higher education institution pricing, with volume licensing support.',
    },
    {
        value: 'special-offers',
        label: 'Special Offers',
        surface: 'acom',
        useCase: 'Promotional campaigns and limited-time offers',
        description: 'Eye-catching promotional cards for sales events, Black Friday, seasonal campaigns.',
    },
    {
        value: 'ah-try-buy-widget',
        label: 'Try Buy Widget',
        surface: 'adobe-home',
        useCase: 'In-app trial and purchase prompts',
        description: 'Compact widget shown in Adobe Home app prompting users to try or buy products.',
    },
    {
        value: 'ah-promoted-plans',
        label: 'Promoted Plans',
        surface: 'adobe-home',
        useCase: 'Featured plans in Adobe Home',
        description: 'Highlights featured subscription plans within the Adobe Home app experience.',
    },
    {
        value: 'ccd-slice',
        label: 'Slice',
        surface: 'ccd',
        useCase: 'Compact upsell in Creative Cloud Desktop',
        description: 'Slim horizontal card for upselling additional products within CCD.',
    },
    {
        value: 'ccd-suggested',
        label: 'Suggested',
        surface: 'ccd',
        useCase: 'Recommended products in CCD',
        description: 'Shows suggested products based on user context, displayed in Creative Cloud Desktop.',
    },
    {
        value: 'mini',
        label: 'Mini',
        surface: 'ccd',
        useCase: 'Minimal product cards',
        description: 'Smallest card format for tight spaces, shows essential info only.',
    },
    {
        value: 'fries',
        label: 'Fries',
        surface: 'commerce',
        useCase: 'Checkout flow add-ons',
        description:
            'Small add-on cards shown during checkout to upsell additional products (like "would you like fries with that?").',
    },
    {
        value: 'simplified-pricing-express',
        label: 'Simplified Pricing Express',
        surface: 'express',
        useCase: 'Simple Express pricing',
        description: 'Clean, simple pricing card for Adobe Express with minimal fields.',
    },
    {
        value: 'full-pricing-express',
        label: 'Full Pricing Express',
        surface: 'express',
        useCase: 'Detailed Express pricing',
        description: 'Complete pricing card for Adobe Express with all features and options.',
    },
];

const CHECKOUT_CTA_OPTIONS = {
    'buy-now': { label: 'Buy now', useCase: 'Direct purchase, user ready to buy' },
    'free-trial': { label: 'Free trial', useCase: 'Start a trial period' },
    'start-free-trial': { label: 'Start free trial', useCase: 'Emphasized trial start' },
    'save-now': { label: 'Save now', useCase: 'Promotional pricing emphasis' },
    'get-started': { label: 'Get started', useCase: 'Soft onboarding, low commitment' },
    'choose-a-plan': { label: 'Choose a plan', useCase: 'Navigate to plan selection' },
    'learn-more': { label: 'Learn more', useCase: 'Educational, pre-decision stage' },
    upgrade: { label: 'Upgrade', useCase: 'Existing customer upsell' },
    'upgrade-now': { label: 'Upgrade now', useCase: 'Urgent upsell messaging' },
    'get-offer': { label: 'Get offer', useCase: 'Claim a promotional deal' },
    select: { label: 'Select', useCase: 'Generic selection action' },
    'see-more': { label: 'See more', useCase: 'Expand for additional info' },
    'take-the-quiz': { label: 'Take the quiz', useCase: 'Interactive product finder' },
    'see-all-plans-and-pricing': {
        label: 'See all plans & pricing details',
        useCase: 'Navigate to full pricing page',
    },
};

const LOCALES = [
    { code: 'en_US', name: 'United States', region: 'Americas' },
    { code: 'en_CA', name: 'Canada (English)', region: 'Americas' },
    { code: 'fr_CA', name: 'Canada (French)', region: 'Americas' },
    { code: 'pt_BR', name: 'Brazil', region: 'Americas' },
    { code: 'es_MX', name: 'Mexico', region: 'Americas' },
    { code: 'en_AU', name: 'Australia', region: 'Asia Pacific' },
    { code: 'ja_JP', name: 'Japan', region: 'Asia Pacific' },
    { code: 'ko_KR', name: 'South Korea', region: 'Asia Pacific' },
    { code: 'zh_CN', name: 'China', region: 'Asia Pacific' },
    { code: 'zh_TW', name: 'Taiwan', region: 'Asia Pacific' },
    { code: 'id_ID', name: 'Indonesia', region: 'Asia Pacific' },
    { code: 'th_TH', name: 'Thailand', region: 'Asia Pacific' },
    { code: 'vi_VN', name: 'Vietnam', region: 'Asia Pacific' },
    { code: 'fr_FR', name: 'France', region: 'Europe' },
    { code: 'de_DE', name: 'Germany', region: 'Europe' },
    { code: 'it_IT', name: 'Italy', region: 'Europe' },
    { code: 'es_ES', name: 'Spain', region: 'Europe' },
    { code: 'nl_NL', name: 'Netherlands', region: 'Europe' },
    { code: 'sv_SE', name: 'Sweden', region: 'Europe' },
    { code: 'nb_NO', name: 'Norway', region: 'Europe' },
    { code: 'da_DK', name: 'Denmark', region: 'Europe' },
    { code: 'fi_FI', name: 'Finland', region: 'Europe' },
    { code: 'pl_PL', name: 'Poland', region: 'Europe' },
    { code: 'cs_CZ', name: 'Czech Republic', region: 'Europe' },
    { code: 'ru_RU', name: 'Russia', region: 'Europe' },
    { code: 'uk_UA', name: 'Ukraine', region: 'Europe' },
    { code: 'tr_TR', name: 'Türkiye', region: 'Europe' },
    { code: 'hu_HU', name: 'Hungary', region: 'Europe' },
];

function generateVariantGuide() {
    let md = `# Card Variant Guide for Authors

This guide helps you choose the right card variant for your content. Each variant is designed for a specific surface (platform) and use case.

## Quick Reference: Which Variant Should I Use?

| If you're creating content for... | Use this variant |
|-----------------------------------|------------------|
`;

    for (const variant of VARIANTS) {
        const surface = SURFACES[variant.surface];
        md += `| ${surface.label}: ${variant.useCase} | **${variant.label}** |\n`;
    }

    md += `\n---\n\n## Variants by Surface\n\n`;

    for (const [surfaceKey, surface] of Object.entries(SURFACES)) {
        const surfaceVariants = VARIANTS.filter((v) => v.surface === surfaceKey);
        if (surfaceVariants.length === 0) continue;

        md += `### ${surface.label}\n\n`;
        md += `*${surface.description}*\n\n`;

        for (const variant of surfaceVariants) {
            md += `#### ${variant.label}\n`;
            md += `- **When to use:** ${variant.useCase}\n`;
            md += `- **Description:** ${variant.description}\n\n`;
        }
    }

    md += `---\n\n## Variant Details\n\n`;

    for (const variant of VARIANTS) {
        const surface = SURFACES[variant.surface];
        md += `### ${variant.label} (\`${variant.value}\`)\n\n`;
        md += `| Property | Value |\n`;
        md += `|----------|-------|\n`;
        md += `| Surface | ${surface.label} |\n`;
        md += `| Use Case | ${variant.useCase} |\n`;
        md += `| Technical Name | \`${variant.value}\` |\n\n`;
        md += `${variant.description}\n\n`;
    }

    return md;
}

function generateCTAGuide() {
    let md = `# CTA (Call-to-Action) Guide for Authors

Choose the right button text to match your card's purpose and the user's journey stage.

## Available CTA Options

| CTA Text | Best Used When... |
|----------|-------------------|
`;

    for (const [key, cta] of Object.entries(CHECKOUT_CTA_OPTIONS)) {
        md += `| ${cta.label} | ${cta.useCase} |\n`;
    }

    md += `\n## CTA Selection Tips\n\n`;
    md += `### For Trial Offers\n`;
    md += `- Use **"Free trial"** or **"Start free trial"** for trial-focused cards\n`;
    md += `- These work best when the primary goal is getting users to try the product\n\n`;

    md += `### For Promotional Campaigns\n`;
    md += `- Use **"Save now"** or **"Get offer"** during sales events\n`;
    md += `- Creates urgency and emphasizes the deal\n\n`;

    md += `### For Existing Customers\n`;
    md += `- Use **"Upgrade"** or **"Upgrade now"** for upsell cards\n`;
    md += `- These are more direct for users who already have a subscription\n\n`;

    md += `### For Educational Content\n`;
    md += `- Use **"Learn more"** when users need more information before deciding\n`;
    md += `- Good for complex products or new users\n\n`;

    return md;
}

function generateLocaleGuide() {
    let md = `# Supported Locales

MAS Studio supports the following locales for card content. When creating cards, you can create locale variations to serve different regions.

## Locales by Region\n\n`;

    const byRegion = {};
    for (const locale of LOCALES) {
        if (!byRegion[locale.region]) byRegion[locale.region] = [];
        byRegion[locale.region].push(locale);
    }

    for (const [region, locales] of Object.entries(byRegion)) {
        md += `### ${region}\n\n`;
        md += `| Locale Code | Country |\n`;
        md += `|-------------|--------|\n`;
        for (const locale of locales) {
            md += `| \`${locale.code}\` | ${locale.name} |\n`;
        }
        md += `\n`;
    }

    md += `## How Locale Variations Work\n\n`;
    md += `1. **Parent Fragment**: Create your card in the default locale (usually \`en_US\`)\n`;
    md += `2. **Create Variation**: In Studio, select "Create Locale Variation"\n`;
    md += `3. **Inherit or Override**: Fields inherit from parent unless you override them\n`;
    md += `4. **Same Language Only**: You can only create variations for locales that share the same language (e.g., \`en_US\` → \`en_AU\`)\n\n`;

    return md;
}

function main() {
    console.log('Extracting author content from Studio...\n');

    const authoringDir = join(OUTPUT_DIR, 'authoring');
    if (!existsSync(authoringDir)) {
        mkdirSync(authoringDir, { recursive: true });
    }

    const variantGuide = generateVariantGuide();
    const variantPath = join(authoringDir, 'variant-guide.md');
    writeFileSync(variantPath, variantGuide);
    console.log(`Generated: ${variantPath}`);

    const ctaGuide = generateCTAGuide();
    const ctaPath = join(authoringDir, 'cta-guide.md');
    writeFileSync(ctaPath, ctaGuide);
    console.log(`Generated: ${ctaPath}`);

    const localeGuide = generateLocaleGuide();
    const localePath = join(authoringDir, 'locale-guide.md');
    writeFileSync(localePath, localeGuide);
    console.log(`Generated: ${localePath}`);

    console.log('\nAuthor content extraction complete!');
}

main();
