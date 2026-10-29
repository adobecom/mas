import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { release } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function runnerDependencyKey(environment) {
    return createHash('sha256').update(JSON.stringify(environment)).digest('hex');
}

export async function verifyNalaDependencies(directory = process.cwd()) {
    const {
        dependencies = {},
        devDependencies = {},
        scripts = {},
    } = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    if (['preinstall', 'install', 'postinstall', 'prepare'].some((name) => scripts[name]))
        throw new Error('Root installation hooks require a fresh npm ci for this checkout');
    const { packages } = JSON.parse(readFileSync(join(directory, 'package-lock.json'), 'utf8'));
    for (const name of Object.keys({ ...dependencies, ...devDependencies })) {
        const location = `node_modules/${name}`;
        const installed = JSON.parse(readFileSync(join(directory, location, 'package.json'), 'utf8'));
        if (installed.version !== packages[location].version)
            throw new Error(`Cached ${name}@${installed.version} does not match locked ${packages[location].version}`);
    }
    await import('@playwright/test');
    await import('@axe-core/playwright');
    const { transform } = await import('esbuild');
    await transform('const dependencyCheck = 1;', { minify: true });
}

export async function checkChromiumDependencies(chromium) {
    let browser;
    try {
        browser = await chromium.launch({ timeout: 15000, args: ['--disable-web-security', '--disable-gpu'] });
        const page = await browser.newPage();
        await page.setContent('<title>Nala dependency check</title>');
        if ((await page.title()) !== 'Nala dependency check') throw new Error('Chromium dependency check did not render');
        return true;
    } catch (error) {
        if (
            !/Host system is missing dependencies|error while loading shared libraries|cannot open shared object file/.test(
                error.message,
            )
        )
            throw error;
        console.warn(`Chromium requires system dependency repair:\n${error.message}`);
        return false;
    } finally {
        await browser?.close();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const command = process.argv[2];
    let output;
    if (command === 'fingerprint') {
        const key = runnerDependencyKey({
            platform: process.platform,
            arch: process.arch,
            osRelease: readFileSync('/etc/os-release', 'utf8'),
            kernel: release(),
            node: process.version,
            abi: process.versions.modules,
            npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
            glibc: process.report.getReport().header.glibcVersionRuntime,
            imageOS: process.env.ImageOS ?? '',
            imageVersion: process.env.ImageVersion ?? '',
        });
        output = `runner-key=${key}`;
    } else if (command === 'dependencies') {
        await verifyNalaDependencies();
        output = 'dependencies-ready=true';
    } else if (command === 'chromium') {
        const { chromium } = await import('@playwright/test');
        output = `system-deps-ready=${await checkChromiumDependencies(chromium)}`;
    } else {
        throw new Error(`Unknown Nala dependency command: ${command}`);
    }
    console.info(output);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
}
