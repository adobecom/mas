#!/usr/bin/env node
// io-candidate-current gate: after `visual`, confirm the shared bot workspace still
// serves this candidate. Candidates share one workspace and the CI lock ends after
// the health check, so a later candidate can replace this one's IO before or during
// its screenshots; this turns that stale green into a failure.
//
// Usage: node .pinata/scripts/check-candidate-io-current.mjs <changed file>...
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveIoBaseUrl } from '../../studio/src/io-base-url.js';
import { touchesIoStudio } from './deploy-candidate-io.mjs';

/** Same IO routing as the studio-io-candidate surface in preview.yaml. */
export const CANDIDATE_IO_QUERY = '?io.project=merchatscale&io.studio.env=pinata';

async function fetchDeployedSha(url, fetchImpl) {
    const response = await fetchImpl(url);
    if (!response.ok) throw new Error(`health check answered ${response.status}`);
    return (await response.json()).sha;
}

/** Returns the process exit code. */
export async function checkCandidateCurrent(files, { headSha, fetchImpl = fetch, out = console }) {
    if (!touchesIoStudio(files)) {
        out.log('SKIP: no io/studio changes');
        return 0;
    }
    const url = `${resolveIoBaseUrl(CANDIDATE_IO_QUERY)}/health-check`;
    let deployed;
    try {
        deployed = await fetchDeployedSha(url, fetchImpl);
    } catch (error) {
        out.error(`FAIL: could not read the deployed commit from ${url}: ${error.message}`);
        return 1;
    }
    if (!deployed) {
        out.error(`FAIL: ${url} reports no deployed commit; redeploy the candidate and recapture.`);
        return 1;
    }
    if (deployed !== headSha) {
        out.error(
            `FAIL: the bot workspace serves ${deployed}, not this candidate ${headSha}. ` +
                'Another candidate deployed over it, so screenshots may show its IO. Redeploy and recapture.',
        );
        return 1;
    }
    out.log(`OK: the bot workspace still serves ${headSha}`);
    return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    process.exitCode = await checkCandidateCurrent(process.argv.slice(2), { headSha });
}
