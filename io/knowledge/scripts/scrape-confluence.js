import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../scraped-docs/confluence');
const AUTH_DIR = join(__dirname, '../.auth');
const AUTH_STATE_FILE = join(AUTH_DIR, 'confluence-state.json');

const CONFLUENCE_BASE_URL = 'https://wiki.corp.adobe.com';
const START_PAGES = [
    '/display/adobedotcom/M@S2+Developer+Onboarding',
    '/display/adobedotcom/M@S+Technical+Documentation+Index',
    '/display/adobedotcom/M@S+Monitoring',
    '/display/adobedotcom/Merch+at+Scale+%28M@S%29+Studio',
    '/display/WP4/M@S+Architecture',
    '/pages/viewpage.action?pageId=3351574680',
];
const MAX_DEPTH = 3;
const DELAY_BETWEEN_PAGES = 1000;

const MAS_PAGE_PATTERNS = [
    /merch.?at.?scale/i,
    /m@s/i,
    /mas[\s-]/i,
    /studio/i,
    /fragment/i,
    /wcs/i,
    /ost/i,
    /offer.?selector/i,
    /checkout/i,
    /pricing/i,
    /commerce/i,
    /web.?component/i,
    /developer/i,
    /onboard/i,
    /technical/i,
    /resource/i,
    /support/i,
    /document/i,
    /aem/i,
    /adobe\.com/i,
];

const EXCLUDE_PATTERNS = [
    /meeting/i,
    /notes/i,
    /archive/i,
    /status/i,
    /standup/i,
    /weekly/i,
    /changelog/i,
    /retrospective/i,
    /sprint/i,
];

const EXCLUDE_SPACES = ['/display/bpdictionary/', '/display/MWPPDM/'];

const INCLUDE_PATTERNS = [
    /architecture/i,
    /api/i,
    /troubleshoot/i,
    /guide/i,
    /how.?to/i,
    /setup/i,
    /config/i,
    /overview/i,
    /component/i,
    /pipeline/i,
    /integration/i,
    /merch.?at.?scale/i,
    /mas/i,
    /studio/i,
    /fragment/i,
    /wcs/i,
    /ost/i,
];

function shouldIncludePage(title, url = '') {
    const lowerTitle = title.toLowerCase();
    const lowerUrl = url.toLowerCase();

    if (EXCLUDE_SPACES.some((space) => lowerUrl.includes(space.toLowerCase()))) {
        return false;
    }

    if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(lowerTitle))) {
        return false;
    }

    if (lowerUrl.includes('/display/adobedotcom/') || lowerUrl.includes('/display/wp4/')) {
        return true;
    }

    if (lowerUrl.includes('/pages/viewpage.action?pageid=')) {
        return true;
    }

    if (MAS_PAGE_PATTERNS.some((pattern) => pattern.test(lowerTitle) || pattern.test(lowerUrl))) {
        return true;
    }

    if (INCLUDE_PATTERNS.some((pattern) => pattern.test(lowerTitle))) {
        return true;
    }

    return false;
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}

async function extractPageContent(page) {
    return await page.evaluate(() => {
        const content = [];
        const title =
            document.querySelector('#title-text')?.textContent?.trim() ||
            document.querySelector('h1')?.textContent?.trim() ||
            'Untitled';

        const mainContent =
            document.querySelector('#main-content') ||
            document.querySelector('.wiki-content') ||
            document.querySelector('#content');

        if (!mainContent) {
            return { title, markdown: '', links: [] };
        }

        function processNode(node) {
            if (!node) return '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || '';
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            const tagName = node.tagName.toLowerCase();

            if (['script', 'style', 'noscript', 'nav', 'footer'].includes(tagName)) {
                return '';
            }

            if (node.classList.contains('page-metadata') || node.classList.contains('content-metadata')) {
                return '';
            }

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                const level = parseInt(tagName.charAt(1));
                const text = node.textContent?.trim() || '';
                return `${'#'.repeat(level)} ${text}\n\n`;
            }

            if (tagName === 'p') {
                const text = Array.from(node.childNodes)
                    .map((child) => processNode(child))
                    .join('');
                return text.trim() ? `${text.trim()}\n\n` : '';
            }

            if (tagName === 'ul' || tagName === 'ol') {
                const items = Array.from(node.children)
                    .map((li, i) => {
                        const prefix = tagName === 'ol' ? `${i + 1}.` : '-';
                        const text = li.textContent?.trim() || '';
                        return `${prefix} ${text}`;
                    })
                    .join('\n');
                return `${items}\n\n`;
            }

            if (tagName === 'pre' || tagName === 'code') {
                const text = node.textContent?.trim() || '';
                if (tagName === 'pre' || text.includes('\n')) {
                    return `\`\`\`\n${text}\n\`\`\`\n\n`;
                }
                return `\`${text}\``;
            }

            if (tagName === 'a') {
                const href = node.getAttribute('href') || '';
                const text = node.textContent?.trim() || '';
                if (href && text) {
                    return `[${text}](${href})`;
                }
                return text;
            }

            if (tagName === 'strong' || tagName === 'b') {
                const text = node.textContent?.trim() || '';
                return `**${text}**`;
            }

            if (tagName === 'em' || tagName === 'i') {
                const text = node.textContent?.trim() || '';
                return `*${text}*`;
            }

            if (tagName === 'table') {
                const rows = node.querySelectorAll('tr');
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

            if (tagName === 'img') {
                const alt = node.getAttribute('alt') || 'image';
                const src = node.getAttribute('src') || '';
                return `![${alt}](${src})`;
            }

            if (tagName === 'br') {
                return '\n';
            }

            if (tagName === 'hr') {
                return '---\n\n';
            }

            if (tagName === 'blockquote') {
                const text = node.textContent?.trim() || '';
                return `> ${text.replace(/\n/g, '\n> ')}\n\n`;
            }

            return Array.from(node.childNodes)
                .map((child) => processNode(child))
                .join('');
        }

        const markdown = processNode(mainContent);

        const links = [];

        const childPagesContainer = document.querySelector('.plugin_pagetree_children_container');
        if (childPagesContainer) {
            const childLinks = childPagesContainer.querySelectorAll('a[href*="/display/"]');
            childLinks.forEach((a) => {
                const href = a.getAttribute('href');
                const text = a.textContent?.trim();
                if (href && text) {
                    links.push({ href, text, source: 'child-tree' });
                }
            });
        }

        const childrenMacro = document.querySelector('.children-list, .child-pages');
        if (childrenMacro) {
            const macroLinks = childrenMacro.querySelectorAll('a[href*="/display/"]');
            macroLinks.forEach((a) => {
                const href = a.getAttribute('href');
                const text = a.textContent?.trim();
                if (href && text) {
                    links.push({ href, text, source: 'children-macro' });
                }
            });
        }

        if (mainContent) {
            const contentLinks = mainContent.querySelectorAll(
                'a[href*="/display/adobedotcom/"], a[href*="/display/WP4/"], a[href*="/pages/viewpage.action"]',
            );
            contentLinks.forEach((a) => {
                const href = a.getAttribute('href');
                const text = a.textContent?.trim();
                if (href && text && text.length > 1) {
                    links.push({ href, text, source: 'content-link' });
                }
            });
        }

        return { title, markdown, links };
    });
}

async function waitForAuth(page) {
    console.log('\n🔐 Waiting for authentication...');
    console.log('   Please log in via Okta in the browser window.\n');

    try {
        await page.waitForURL('**/wiki.corp.adobe.com/**', { timeout: 300000 });
        console.log('✅ Authentication successful!\n');
        return true;
    } catch {
        console.error('❌ Authentication timeout. Please try again.');
        return false;
    }
}

async function saveAuthState(context) {
    if (!existsSync(AUTH_DIR)) {
        mkdirSync(AUTH_DIR, { recursive: true });
    }
    await context.storageState({ path: AUTH_STATE_FILE });
    console.log('💾 Auth state saved for future runs.\n');
}

function loadAuthState() {
    if (existsSync(AUTH_STATE_FILE)) {
        try {
            const state = JSON.parse(readFileSync(AUTH_STATE_FILE, 'utf-8'));
            if (state.cookies && state.cookies.length > 0) {
                console.log('📂 Loading saved auth state...\n');
                return AUTH_STATE_FILE;
            }
        } catch {
            console.log('⚠️  Could not load auth state, will require login.\n');
        }
    }
    return null;
}

async function scrapePage(page, url, depth, visited, results) {
    if (depth > MAX_DEPTH) return;
    if (visited.has(url)) return;

    visited.add(url);

    const fullUrl = url.startsWith('http') ? url : `${CONFLUENCE_BASE_URL}${url}`;

    console.log(`${'  '.repeat(depth)}📄 Scraping: ${fullUrl}`);

    try {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(DELAY_BETWEEN_PAGES);

        const { title, markdown, links } = await extractPageContent(page);

        if (!shouldIncludePage(title, fullUrl)) {
            console.log(`${'  '.repeat(depth)}   ⏭️  Skipping (filtered): ${title}`);
            return;
        }

        if (markdown.trim()) {
            results.push({
                title,
                url: fullUrl,
                markdown,
                depth,
            });
            console.log(`${'  '.repeat(depth)}   ✅ Extracted: ${title}`);
        }

        const uniqueLinks = [...new Map(links.map((l) => [l.href, l])).values()];
        for (const link of uniqueLinks) {
            const linkUrl = link.href.startsWith('http') ? link.href : `${CONFLUENCE_BASE_URL}${link.href}`;

            if (visited.has(linkUrl)) continue;

            if (shouldIncludePage(link.text, linkUrl)) {
                console.log(`${'  '.repeat(depth)}   → Following: ${link.text} [${link.source}]`);
                await scrapePage(page, linkUrl, depth + 1, visited, results);
            } else {
                console.log(`${'  '.repeat(depth)}   ⏭️  Skipping: ${link.text} (not MAS-related)`);
            }
        }
    } catch (err) {
        console.error(`${'  '.repeat(depth)}   ❌ Error scraping ${url}: ${err.message}`);
    }
}

function saveResults(results) {
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const result of results) {
        const filename = `${slugify(result.title)}.md`;
        const filepath = join(OUTPUT_DIR, filename);

        let content = `# ${result.title}\n\n`;
        content += `> Source: ${result.url}\n`;
        content += `> Scraped: ${new Date().toISOString()}\n\n`;
        content += '---\n\n';
        content += result.markdown;

        writeFileSync(filepath, content);
        console.log(`💾 Saved: ${filename}`);
    }

    const indexContent = results.map((r) => `- [${r.title}](${slugify(r.title)}.md)`).join('\n');

    writeFileSync(
        join(OUTPUT_DIR, 'index.md'),
        `# MAS Confluence Documentation\n\nScraped: ${new Date().toISOString()}\n\n${indexContent}\n`,
    );
}

async function main() {
    console.log('🚀 Starting Confluence scraper for MAS documentation\n');
    console.log(`📍 Starting pages (${START_PAGES.length}):`);
    START_PAGES.forEach((p) => console.log(`   - ${CONFLUENCE_BASE_URL}${p}`));
    console.log(`📊 Max depth: ${MAX_DEPTH} levels\n`);

    const authState = loadAuthState();
    const headless = authState !== null;

    const browser = await chromium.launch({
        headless,
        slowMo: headless ? 0 : 100,
    });

    const contextOptions = {
        viewport: { width: 1920, height: 1080 },
    };

    if (authState) {
        contextOptions.storageState = authState;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
        await page.goto(`${CONFLUENCE_BASE_URL}${START_PAGES[0]}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        const currentUrl = page.url();
        if (currentUrl.includes('okta') || currentUrl.includes('login')) {
            const authSuccess = await waitForAuth(page);
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }
            await saveAuthState(context);
        }

        const visited = new Set();
        const results = [];

        for (const startPage of START_PAGES) {
            console.log(`\n📂 Processing starting page: ${startPage}`);
            await scrapePage(page, startPage, 0, visited, results);
        }

        console.log(`\n📊 Scrape Summary`);
        console.log(`   Pages visited: ${visited.size}`);
        console.log(`   Pages extracted: ${results.length}`);

        if (results.length > 0) {
            saveResults(results);
            console.log(`\n✅ Scraping complete! Files saved to: ${OUTPUT_DIR}`);
        } else {
            console.log('\n⚠️  No pages were extracted.');
        }
    } catch (err) {
        console.error('\n❌ Scraping failed:', err.message);
        throw err;
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
