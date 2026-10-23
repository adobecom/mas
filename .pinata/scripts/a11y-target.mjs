/**
 * The check of a farm ticket's accessibility target: the `a11y-target` gate in ../gates.yaml.
 *
 *     node .pinata/scripts/a11y-target.mjs <work-item.json>
 *
 * The engine writes the run's work item to a JSON file ({"required": true, "ticket": ..., "target": {page,
 * element, rule, state}}, or {"required": false} on a run that has none) and runs this script with a checkout as
 * the working directory: the candidate's, and the base commit's when it asks whether the target was broken before
 * the change. It runs a private copy of this file from outside the checkout, so Playwright, axe-core and every file
 * the page is served from are resolved from the working directory, never from this file's location; `.mjs` keeps
 * the copy an ES module where no package.json says so.
 *
 * The page is the ticket's page as this checkout would publish it, the way `aem up` serves a local checkout: the
 * page must be on a MAS preview host (https://<branch>--mas--adobecom.aem.page, never the .aem.live production
 * CDN) and must still be there once loaded; a request to such a host for a file the checkout has is answered from
 * the checkout, and content, fragments, services and CDNs come from the network. The page is put in the ticket's
 * state, axe-core (the one @axe-core/playwright ships) runs the ticket's rule, and the result is read for the
 * ticket's element and what it contains, across shadow roots.
 *
 * Exit codes:
 *   0  the rule passes on the element, or the run has no required work item (nothing to check);
 *   3  the rule reports a violation on the element (the gate's violation_exit_code);
 *   1  the target could not be checked: never a verdict (no matching element, the rule does not apply to it or
 *      needs review, the state was not reached, the page left the preview host, nothing on the page came from the
 *      checkout, no page, no browser).
 */
import { accessSync, constants, realpathSync } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { delimiter, join, relative } from 'node:path';

const PASSED = 0;
const UNCHECKED = 1;
const VIOLATION = 3;

const STATES = ['none', 'menu-open', 'dialog-open', 'expanded', 'focus', 'hover'];
const PREVIEW_HOST = /^[a-z0-9-]+--mas--adobecom\.aem\.page$/;
const TIMEOUT_MS = 30_000;
const NAVIGATION_TIMEOUT_MS = 60_000;
const SETTLE_MS = 15_000;
const ANIMATION_MS = 5_000;
const SHOWN = 5;

// A state that already holds is left alone; otherwise the element is the control that opens it, and only a click
// that changed the page from not-in-the-state to in-the-state counts.
const HOLDS = {
    expanded: (now) => now.expanded,
    'menu-open': (now) => now.expanded || now.inMenu,
    'dialog-open': (now) => now.dialogs > 0,
};
const REACHED = {
    expanded: (before, after) => !before.expanded && after.expanded,
    'menu-open': (before, after) => (!before.expanded && after.expanded) || after.menus > before.menus,
    'dialog-open': (before, after) => after.dialogs > before.dialogs,
};

class Unchecked extends Error {}

/** `href` as a URL on a MAS preview host, or Unchecked naming why not (never echoing a user name or password). */
function previewUrl(href) {
    let url;
    try {
        url = new URL(href);
    } catch {
        throw new Unchecked('the target page is not a URL');
    }
    if (url.username || url.password) throw new Unchecked('the target page URL carries a user name or password');
    if (url.protocol !== 'https:' || url.port || !PREVIEW_HOST.test(url.hostname)) {
        throw new Unchecked(
            'the target page is not on a MAS preview host (https://<branch>--mas--adobecom.aem.page), ' +
                'so no page there shows this checkout',
        );
    }
    return url;
}

function readTarget(target) {
    const { page, element, rule, state } = target ?? {};
    const url = previewUrl(page);
    if (typeof element !== 'string' || !element.trim() || element.length > 300) {
        throw new Unchecked('the target element is not a selector');
    }
    if (typeof rule !== 'string' || !/^[a-z0-9-]+$/.test(rule)) throw new Unchecked('the target rule is not an axe rule id');
    if (!STATES.includes(state)) throw new Unchecked('the target state is not one this check can reach');
    return { page: url.href, element, rule, state };
}

/** A redirect or a navigation the page made itself must not move the check off the preview host. */
function stillOnPreviewHost(page) {
    try {
        previewUrl(page.url());
    } catch {
        throw new Unchecked('the page left the MAS preview host (a redirect or a navigation took it elsewhere)');
    }
}

/** The checkout file a request path names, or null: no dot segment (so no `..`), nothing outside the checkout. */
async function checkoutFile(root, pathname) {
    let rel;
    try {
        rel = decodeURIComponent(pathname).replace(/^\/+/, '');
    } catch {
        return null;
    }
    if (!rel || rel.split('/').some((part) => !part || part.startsWith('.') || part === 'node_modules')) return null;
    try {
        const file = await realpath(join(root, rel));
        return !relative(root, file).startsWith('..') && (await stat(file)).isFile() ? file : null;
    } catch {
        return null;
    }
}

function onPath(name) {
    for (const dir of (process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
        try {
            accessSync(join(dir, name), constants.X_OK);
            return realpathSync(join(dir, name));
        } catch {
            // not in this directory
        }
    }
    return null;
}

async function launch(chromium) {
    try {
        return await chromium.launch();
    } catch (error) {
        // Where this Playwright's own browser build is not installed, drive the Chromium on PATH (the engine image
        // links one there as `chromium`).
        const executablePath = onPath('chromium');
        if (!executablePath) throw new Unchecked(`no browser to run: ${error.message.split('\n')[0]}`);
        return chromium.launch({ executablePath });
    }
}

async function settle(page) {
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {});
    // Finite transitions (a menu sliding open, a focus ring fading in) end before the check; endless ones do not count.
    await page
        .evaluate(
            (ms) =>
                Promise.race([
                    Promise.all([
                        document.fonts.ready,
                        ...document
                            .getAnimations()
                            .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
                            .map((animation) => animation.finished.catch(() => {})),
                    ]),
                    new Promise((resolve) => setTimeout(resolve, ms)),
                ]).then(() => true),
            ANIMATION_MS,
        )
        .catch(() => {});
}

/** Runs in the page: whether the element's control is expanded or it sits in an open menu, and how many menus and
 *  dialogs are open on the page (shadow roots included). */
function stateOf(el) {
    const visible = (selector) => {
        let count = 0;
        const roots = [document];
        while (roots.length) {
            for (const node of roots.pop().querySelectorAll('*')) {
                if (node.shadowRoot) roots.push(node.shadowRoot);
                if (node.matches(selector) && node.checkVisibility()) count += 1;
            }
        }
        return count;
    };
    const MENU = '[role="menu"], [role="listbox"]';
    // The control is the element itself, else the first one with aria-expanded inside it (its shadow root first).
    const control = [
        el,
        ...(el.shadowRoot?.querySelectorAll('[aria-expanded]') ?? []),
        ...el.querySelectorAll('[aria-expanded]'),
    ].find((node) => node.hasAttribute('aria-expanded'));
    let inMenu = false;
    for (let node = el; node && !inMenu; node = node.parentNode ?? node.host) {
        inMenu = node.nodeType === Node.ELEMENT_NODE && node.matches(MENU) && node.checkVisibility();
    }
    return {
        expanded: el.hasAttribute('open') || control?.getAttribute('aria-expanded') === 'true',
        inMenu,
        menus: visible(MENU),
        dialogs: visible('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]'),
    };
}

/** Puts the page in `state` through `element`; says how, or throws Unchecked when it cannot. */
async function enterState(page, element, state) {
    if (state === 'none') return 'nothing to do';
    if (state === 'focus' || state === 'hover') {
        await (state === 'focus' ? element.focus() : element.hover());
        await settle(page);
        if (state === 'hover') return 'pointer over the element';
        const focused = await element.evaluate((el) => {
            let active = document.activeElement;
            while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
            for (let node = active; node; node = node.parentNode ?? node.host) if (node === el) return true;
            return false;
        });
        if (!focused) throw new Unchecked('the target element did not take focus');
        return 'focus on the element';
    }
    const before = await element.evaluate(stateOf);
    if (HOLDS[state](before)) return 'already held';
    await element.click();
    await settle(page);
    if (!REACHED[state](before, await element.evaluate(stateOf))) {
        throw new Unchecked(`clicking the target element did not reach the state "${state}"`);
    }
    return 'reached by clicking the element';
}

/** Runs in the page: axe's findings for one rule on the matched elements and anything inside them. */
async function judge(elements, rule) {
    if (!window.axe) return null;
    const within = (node) => {
        for (let current = node; current; current = current.parentNode ?? current.host) {
            if (elements.includes(current)) return true;
        }
        return false;
    };
    const results = await window.axe.run(document, {
        runOnly: { type: 'rule', values: [rule] },
        elementRef: true,
        iframes: false,
    });
    const nodes = (type) =>
        results[type]
            .flatMap((result) => result.nodes)
            .filter((node) => within(node.element))
            .map((node) => ({ html: node.html.slice(0, 200), summary: (node.failureSummary ?? '').slice(0, 400) }));
    return { violations: nodes('violations'), incomplete: nodes('incomplete'), passes: nodes('passes') };
}

async function check(target, root) {
    let chromium;
    let axe;
    try {
        const load = createRequire(join(root, 'package.json'));
        ({ chromium } = load('@playwright/test'));
        axe = createRequire(load.resolve('@axe-core/playwright'))('axe-core');
    } catch {
        throw new Unchecked('this checkout has no @playwright/test or @axe-core/playwright installed (run npm ci)');
    }
    let served = 0;
    let documentServed = false;
    const browser = await launch(chromium);
    try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
        context.setDefaultTimeout(TIMEOUT_MS);
        await context.route(
            (url) => PREVIEW_HOST.test(url.hostname),
            async (route) => {
                const request = route.request();
                const file = ['GET', 'HEAD'].includes(request.method())
                    ? await checkoutFile(root, new URL(request.url()).pathname)
                    : null;
                if (!file) return route.continue();
                served += 1;
                if (request.isNavigationRequest() && !request.frame().parentFrame()) documentServed = true;
                return route.fulfill({ path: file });
            },
        );
        const page = await context.newPage();
        const response = await page.goto(target.page, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
        stillOnPreviewHost(page);
        if (!response?.ok()) throw new Unchecked(`the target page answered HTTP ${response?.status() ?? 'nothing'}`);
        if (!documentServed) {
            // A content page arrives with the published head.html in it; it shows this checkout only while the
            // checkout's own head.html is that one.
            const published = await context.request.get(new URL('/head.html', page.url()).href);
            const local = await readFile(join(root, 'head.html'), 'utf8').catch(() => '');
            if (!published.ok() || (await published.text()).trim() !== local.trim()) {
                throw new Unchecked('the page is published content whose head.html differs from this checkout');
            }
        }
        await settle(page);
        const element = page.locator(target.element);
        try {
            await element.first().waitFor({ state: 'attached' });
        } catch {
            throw new Unchecked('no element on the page matches the target element');
        }
        await settle(page);
        if (!served) throw new Unchecked('nothing on the page came from this checkout, so it cannot show the change');
        const entered = await enterState(page, element.first(), target.state);
        stillOnPreviewHost(page);
        await page.evaluate(axe.source);
        let found;
        try {
            found = await element.evaluateAll(judge, target.rule);
        } catch (error) {
            throw new Unchecked(`axe could not run the rule: ${error.message.split('\n')[0]}`);
        }
        if (!found) throw new Unchecked('axe did not load in the page');
        return { ...found, entered, matched: await element.count(), served, version: axe.version };
    } finally {
        await browser.close();
    }
}

async function main(file) {
    let item;
    try {
        item = JSON.parse(await readFile(file, 'utf8'));
    } catch {
        throw new Unchecked('the work item file is missing or is not JSON');
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Unchecked('the work item is not an object');
    if (item.required !== true) {
        console.log('No required work item on this run: nothing to check.');
        return PASSED;
    }
    const target = readTarget(item.target);
    const root = await realpath(process.cwd());
    console.log(`Checking axe rule "${target.rule}" on ${JSON.stringify(target.element)} (state: ${target.state})`);
    console.log(`at ${target.page}`);
    const { violations, incomplete, passes, entered, matched, served, version } = await check(target, root);
    console.log(
        `State ${target.state}: ${entered}. axe-core ${version}, ${matched} matching element(s), ` +
            `${served} file(s) served from the checkout: ` +
            `${violations.length} violation(s), ${incomplete.length} needing review, ${passes.length} passing`,
    );
    if (violations.length) {
        for (const node of violations.slice(0, SHOWN)) console.log(`- ${node.html}\n  ${node.summary.replace(/\n/g, '\n  ')}`);
        console.log('The violation is still there.');
        return VIOLATION;
    }
    if (incomplete.length) throw new Unchecked('axe needs a person to review the element for this rule');
    if (!passes.length) throw new Unchecked(`the rule does not apply to the target element in state "${target.state}"`);
    console.log('The rule passes on the target element.');
    return PASSED;
}

main(process.argv[2]).then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.log(`Could not check the target: ${error instanceof Unchecked ? error.message : error.stack}`);
        process.exitCode = UNCHECKED;
    },
);
