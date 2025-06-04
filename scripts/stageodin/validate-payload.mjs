import fs from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';

async function getItems(host, path) {
    const response = await fetch(
        `https://${host}/adobe/sites/cf/fragments?path=/content/dam/mas/${path}`,
    );
    if (response.ok) {
        const data = await response.json();
        return data.items;
    }
    return [];
}

async function getFragmentMap(host, path, filter) {
    const items = await getItems(host, path);
    console.log(`Found ${items.length} items in ${host}`);
    const promises = [];
    const filteredItems = [];

    for (const item of items) {
        if (filter(item)) {
            filteredItems.push(item);
            const url = `https://${host}/adobe/sites/fragments/${item.id}?references=all-hydrated`;
            console.log(`fetching: ${url}`);

            promises.push(
                fetch(url)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(
                                `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
                            );
                        }
                        return response.json();
                    })
                    .catch((error) => {
                        console.error(`Error fetching ${url}:`, error.message);
                        return Promise.reject(error);
                    }),
            );
        }
    }

    console.log(
        `Filtered ${filteredItems.length} items out of ${items.length}`,
    );

    if (filteredItems.length === 0) {
        console.log('No items matched the filter criteria');
        return {};
    }

    const map = {};
    const results = await Promise.allSettled(promises);

    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
        if (result.status === 'fulfilled') {
            const item = result.value;
            if (item && item.path) {
                delete item.id;
                map[item.path] = item;
                successCount++;
            } else {
                console.error('Received invalid item without path:', item);
                failureCount++;
            }
        } else {
            console.error('Promise rejected:', result.reason);
            failureCount++;
        }
    }

    console.log(
        `Successfully processed ${successCount} items, ${failureCount} failed`,
    );
    return map;
}

async function getProdMap(path, prodIds) {
    return getFragmentMap('odin.adobe.com', path, (item) =>
        prodIds.includes(item.id),
    );
}

async function getStageMap(prodMap, path) {
    return getFragmentMap(
        'stage-odin.adobe.com',
        path,
        (item) => prodMap[item.path],
    );
}

async function main() {
    let args = process.argv.slice(2);
    if (!args.length) {
        console.log('you should provide at least one URL to audit');
        return;
    }
    const contentPath = args[0];
    const prodIds = JSON.parse(fs.readFileSync(args[1], 'utf8'));
    console.log(`Comparing ${contentPath}`);
    const prodMap = await getProdMap(contentPath, prodIds);
    const stageMap = await getStageMap(prodMap, contentPath);
    const tempDir = tmpdir();
    let diffCount = 0;
    let onlyInProdCount = 0;
    let onlyInStageCount = 0;
    for (const [key, value] of Object.entries(prodMap)) {
        if (stageMap[key]) {
            const prodItem = value;
            const stageItem = stageMap[key];
            if (JSON.stringify(prodItem) !== JSON.stringify(stageItem)) {
                diffCount++;
                console.log(`\nDifferences for ${key}:`);
                // Create temp files for diff
                const prodFile = path.join(
                    tempDir,
                    `prod-${path.basename(key)}.json`,
                );
                const stageFile = path.join(
                    tempDir,
                    `stage-${path.basename(key)}.json`,
                );
                fs.writeFileSync(prodFile, JSON.stringify(prodItem, null, 2));
                fs.writeFileSync(stageFile, JSON.stringify(stageItem, null, 2));
                try {
                    // Run diff command
                    const result = execSync(
                        `diff --color=always -u ${prodFile} ${stageFile}`,
                        {
                            encoding: 'utf-8',
                            stdio: ['pipe', 'pipe', 'ignore'],
                        },
                    );
                    // Strip first two lines (file paths)
                    const lines = result.split('\n');
                    console.log(lines.slice(2).join('\n'));
                } catch (error) {
                    // diff returns non-zero exit code if files differ, which throws an exception
                    // but we actually want to show the differences
                    if (error.stdout) {
                        // Strip first two lines (file paths)
                        const lines = error.stdout.split('\n');
                        console.log(lines.slice(2).join('\n'));
                    }
                } finally {
                    // Clean up temp files
                    fs.unlinkSync(prodFile);
                    fs.unlinkSync(stageFile);
                }
            }
        } else {
            onlyInProdCount++;
            console.log(`\n${key}: Only in prod, not in stage`);
        }
    }

    // Check for items in stage that aren't in prod
    for (const key of Object.keys(stageMap)) {
        if (!prodMap[key]) {
            onlyInStageCount++;
            console.log(`\n${key}: Only in stage, not in prod`);
        }
    }
    // Print summary
    console.log('\n\n--- Summary ---');
    console.log(`Files with differences: ${diffCount}`);
    console.log(`Files only in prod: ${onlyInProdCount}`);
    console.log(`Files only in stage: ${onlyInStageCount}`);
    console.log(
        `Total issues: ${diffCount + onlyInProdCount + onlyInStageCount}`,
    );
}

main();
