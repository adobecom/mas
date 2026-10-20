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
 * The page is the ticket's page as this checkout would publish it, the way `aem up` serves a local checkout: a
 * request to a MAS branch host (<branch>--mas--adobecom.aem.page or .aem.live) for a file the checkout has is
 * answered from the checkout; content, fragments and services come from the network. The page is put in the
 * ticket's state, axe-core (the one @axe-core/playwright ships) runs the ticket's rule, and the result is read for
 * the ticket's element and what it contains, across shadow roots.
 *
 * Exit codes:
 *   0  the rule passes on the element, or the run has no required work item (nothing to check);
 *   3  the rule reports a violation on the element (the gate's violation_exit_code);
 *   1  the target could not be checked: never a verdict (no matching element, the rule does not apply to it or
 *      needs review, the state was not reached, nothing on the page came from the checkout, no page, no browser).
 */
import { accessSync, constants, realpathSync } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { delimiter, join, relative } from 'node:path';

const PASSED = 0;
const UNCHECKED = 1;
const VIOLATION = 3;

const STATES = ['none', 'menu-open', 'dialog-open', 'expanded', 'focus', 'hover'];
const MAS_HOST = /^[a-z0-9-]+--mas--adobecom\.aem\.(page|live)$/;
const TIMEOUT_MS = 30_000;
const NAVIGATION_TIMEOUT_MS = 60_000;
const SETTLE_MS = 15_000;
const SHOWN = 5;

class Unchecked extends Error {}

function readTarget(target) {
    const { page, element, rule, state } = target ?? {};
    let url;
    try {
        url = new URL(page);
    } catch {
        throw new Unchecked('the target page is not a URL');
    }
    if (url.protocol !== 'https:' || url.port || !MAS_HOST.test(url.hostname)) {
        throw new Unchecked('the target page is not on a MAS branch host, so no page there shows this checkout');
    }
    if (typeof element !== 'string' || !element.trim() || element.length > 300) {
        throw new Unchecked('the target element is not a selector');
    }
    if (typeof rule !== 'string' || !/^[a-z0-9-]+$/.test(rule)) throw new Unchecked('the target rule is not an axe rule id');
    if (!STATES.includes(state)) throw new Unchecked('the target state is not one this check can reach');
    return { page: url.href, element, rule, state };
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
    await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => {});
}

async function enterState(page, element, state) {
    if (state === 'none') return;
    if (state === 'focus') {
        await element.focus();
        const focused = await element.evaluate((el) => {
            let active = document.activeElement;
            while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
            for (let node = active; node; node = node.parentNode ?? node.host) if (node === el) return true;
            return false;
        });
        if (!focused) throw new Unchecked('the target element did not take focus');
        return;
    }
    if (state === 'hover') {
        await element.hover();
        return;
    }
    // menu-open, expanded and dialog-open: the element is the control that opens what the state names.
    await element.click();
    await settle(page);
    const reached =
        state === 'dialog-open'
            ? await page.evaluate(() => {
                  const roots = [document];
                  while (roots.length) {
                      for (const node of roots.pop().querySelectorAll('*')) {
                          if (node.shadowRoot) roots.push(node.shadowRoot);
                          const dialog = node.matches(
                              'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
                          );
                          if (dialog && node.checkVisibility()) return true;
                      }
                  }
                  return false;
              })
            : await element.evaluate((el) =>
                  [
                      el,
                      ...el.querySelectorAll('[aria-expanded]'),
                      ...(el.shadowRoot?.querySelectorAll('[aria-expanded]') ?? []),
                  ].some((node) => node.getAttribute('aria-expanded') === 'true' || node.hasAttribute('open')),
              );
    if (!reached) throw new Unchecked(`activating the target element did not reach the state "${state}"`);
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
    const load = createRequire(join(root, 'package.json'));
    const { chromium } = load('@playwright/test');
    const axe = createRequire(load.resolve('@axe-core/playwright'))('axe-core');
    let served = 0;
    let documentServed = false;
    const browser = await launch(chromium);
    try {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
        context.setDefaultTimeout(TIMEOUT_MS);
        await context.route(
            (url) => MAS_HOST.test(url.hostname),
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
        if (!response?.ok()) throw new Unchecked(`the target page answered HTTP ${response?.status() ?? 'nothing'}`);
        if (!documentServed) {
            // A content page arrives with the published head.html in it; it shows this checkout only while the
            // checkout's own head.html is that one.
            const published = await context.request.get(new URL('/head.html', target.page).href);
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
        await enterState(page, element.first(), target.state);
        await page.evaluate(axe.source);
        let found;
        try {
            found = await element.evaluateAll(judge, target.rule);
        } catch (error) {
            throw new Unchecked(`axe could not run the rule: ${error.message.split('\n')[0]}`);
        }
        if (!found) throw new Unchecked('axe did not load in the page');
        return { ...found, matched: await element.count(), served, version: axe.version };
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
    const { violations, incomplete, passes, matched, served, version } = await check(target, root);
    console.log(
        `axe-core ${version}, ${matched} matching element(s), ${served} file(s) served from the checkout: ` +
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
