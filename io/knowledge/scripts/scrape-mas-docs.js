import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../scraped-docs');
const DEMOS_DIR = join(OUTPUT_DIR, 'demos');

const MAS_DOCS_URL = 'https://milo.adobe.com/libs/features/mas/docs/mas.html';

async function scrapeStaticContent(page) {
    return await page.evaluate(() => {
        const content = [];
        const processedSections = new Set();

        function extractText(element) {
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent?.trim() || '';

            if (['script', 'style', 'noscript'].includes(tagName)) {
                return '';
            }

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                const level = parseInt(tagName.charAt(1));
                const anchor = element.id || '';
                const heading = `${'#'.repeat(level)} ${text}`;
                if (anchor && !processedSections.has(anchor)) {
                    processedSections.add(anchor);
                    return `${heading} {#${anchor}}\n`;
                }
                return `${heading}\n`;
            }

            if (tagName === 'p') {
                return `${text}\n\n`;
            }

            if (tagName === 'li') {
                return `- ${text}\n`;
            }

            if (tagName === 'pre' || tagName === 'code') {
                const lang = element.className.match(/language-(\w+)/)?.[1] || '';
                if (tagName === 'pre') {
                    return `\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
                }
                return `\`${text}\``;
            }

            if (tagName === 'a') {
                const href = element.getAttribute('href') || '';
                return `[${text}](${href})`;
            }

            if (tagName === 'table') {
                const rows = element.querySelectorAll('tr');
                let tableMarkdown = '';
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('th, td');
                    const rowContent = Array.from(cells)
                        .map((cell) => cell.textContent?.trim() || '')
                        .join(' | ');
                    tableMarkdown += `| ${rowContent} |\n`;
                    if (rowIndex === 0) {
                        tableMarkdown += `|${Array.from(cells)
                            .map(() => '---')
                            .join('|')}|\n`;
                    }
                });
                return `${tableMarkdown}\n`;
            }

            return '';
        }

        const main = document.querySelector('main') || document.body;
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                const tag = node.tagName.toLowerCase();
                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'pre', 'table'].includes(tag)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            },
        });

        let node;
        while ((node = walker.nextNode())) {
            const extracted = extractText(node);
            if (extracted) {
                content.push(extracted);
            }
        }

        const links = {
            internal: [],
            external: [],
        };

        document.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href');
            const text = a.textContent?.trim();
            if (href && text) {
                if (href.startsWith('#') || href.startsWith('/')) {
                    links.internal.push({ text, href });
                } else if (href.startsWith('http')) {
                    links.external.push({ text, href });
                }
            }
        });

        return {
            markdown: content.join(''),
            links,
            title: document.title,
        };
    });
}

async function captureDemos(page) {
    const demos = await page.locator('.demo').all();
    const demoData = [];

    for (let i = 0; i < demos.length; i++) {
        const demo = demos[i];
        try {
            await demo.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            const screenshotPath = join(DEMOS_DIR, `demo-${i + 1}.png`);
            await demo.screenshot({ path: screenshotPath });

            const markup = await demo.evaluate((el) => {
                const clone = el.cloneNode(true);
                clone.querySelectorAll('script').forEach((s) => s.remove());
                return clone.innerHTML.substring(0, 2000);
            });

            const analytics = await demo.evaluate((el) => {
                const attrs = {};
                for (const attr of el.attributes) {
                    if (attr.name.startsWith('daa-') || attr.name.startsWith('data-analytics')) {
                        attrs[attr.name] = attr.value;
                    }
                }
                const merchCards = el.querySelectorAll('merch-card');
                const cardData = [];
                merchCards.forEach((card) => {
                    cardData.push({
                        variant: card.getAttribute('variant'),
                        size: card.getAttribute('size'),
                    });
                });
                return { attributes: attrs, merchCards: cardData };
            });

            demoData.push({
                index: i + 1,
                screenshot: `demos/demo-${i + 1}.png`,
                markup: markup,
                analytics,
            });
        } catch (err) {
            console.error(`Failed to capture demo ${i + 1}:`, err.message);
        }
    }

    return demoData;
}

async function main() {
    console.log('Starting MAS documentation scrape...\n');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!existsSync(DEMOS_DIR)) {
        mkdirSync(DEMOS_DIR, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    try {
        console.log(`Navigating to ${MAS_DOCS_URL}...`);
        await page.goto(MAS_DOCS_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        console.log('Extracting static content...');
        const staticContent = await scrapeStaticContent(page);

        let markdown = `# ${staticContent.title}\n\n`;
        markdown += `> Scraped from: ${MAS_DOCS_URL}\n`;
        markdown += `> Date: ${new Date().toISOString()}\n\n`;
        markdown += '---\n\n';
        markdown += staticContent.markdown;

        if (staticContent.links.external.length > 0) {
            markdown += '\n\n## External References\n\n';
            staticContent.links.external.forEach((link) => {
                markdown += `- [${link.text}](${link.href})\n`;
            });
        }

        const markdownPath = join(OUTPUT_DIR, 'mas-documentation.md');
        writeFileSync(markdownPath, markdown);
        console.log(`Saved static content to: ${markdownPath}`);

        console.log('\nCapturing demo components...');
        const demos = await captureDemos(page);
        console.log(`Captured ${demos.length} demo screenshots`);

        const demosDataPath = join(OUTPUT_DIR, 'demos-data.json');
        writeFileSync(demosDataPath, JSON.stringify(demos, null, 2));
        console.log(`Saved demo data to: ${demosDataPath}`);

        console.log('\n--- Scrape Summary ---');
        console.log(`Static content: ${markdown.length} characters`);
        console.log(`External links: ${staticContent.links.external.length}`);
        console.log(`Internal links: ${staticContent.links.internal.length}`);
        console.log(`Demo screenshots: ${demos.length}`);
    } catch (err) {
        console.error('Scrape failed:', err);
        throw err;
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
