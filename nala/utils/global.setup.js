import { exit } from 'process';
import { execSync } from 'child_process';
import { isBranchURLValid } from '../libs/baseurl.js';
import GlobalAEMCounter from '../libs/global-aem-counter.js';

const MAIN_BRANCH_LIVE_URL = 'https://main--mas--adobecom.aem.live';
const STAGE_URL = 'https://mas.stage.adobe.com';
const PROD_URL = 'https://mas.adobe.com';

async function getGitHubPRBranchLiveUrl() {
    // get the pr number
    const prReference = process.env.GITHUB_REF;
    const prNumber = prReference.split('/')[2];

    // get the pr branch name
    const branch = process.env.GITHUB_HEAD_REF;
    const prBranch = branch ? branch.replace(/\//g, '-') : prReference.split('/')[2].replace(/\//g, '-');

    // get the org and repo
    const repository = process.env.GITHUB_REPOSITORY;
    const repoParts = repository.split('/');
    const toRepoOrg = repoParts[0];
    const toRepoName = repoParts[1];

    // Get the org and repo from the environment variables
    const prFromOrg = process.env.prOrg;
    const prFromRepoName = process.env.prRepo;

    const prBranchLiveUrl = `https://${prBranch}--${prFromRepoName}--${prFromOrg}.aem.live`;

    try {
        if (await isBranchURLValid(prBranchLiveUrl)) {
            process.env.PR_BRANCH_LIVE_URL = prBranchLiveUrl;
        }
        console.info('PR Repository : ', repository);
        console.info('PR TO ORG     : ', toRepoOrg);
        console.info('PR TO REPO    : ', toRepoName);
        console.info('PR From ORG   : ', prFromOrg);
        console.info('PR From REPO  : ', prFromRepoName);
        console.info('PR Branch     : ', branch);
        console.info('PR Branch(U)  : ', prBranch);
        console.info('PR Number     : ', prNumber);
        console.info('PR From Branch live url : ', prBranchLiveUrl);
    } catch (err) {
        console.error(`Error => Error in setting PR Branch test URL : ${prBranchLiveUrl}`);
        console.info(`Note: PR branch test url  ${prBranchLiveUrl} is not valid, Exiting test execution.`);
        process.exit(1);
    }
}

async function getGitHubMiloLibsBranchLiveUrl() {
    const repository = process.env.GITHUB_REPOSITORY;
    const prBranchLiveUrl = process.env.PR_BRANCH_MILOLIBS_LIVE_URL;
    const miloLibs = process.env.MILO_LIBS;

    try {
        if (await isBranchURLValid(prBranchLiveUrl)) {
            process.env.PR_BRANCH_LIVE_URL = prBranchLiveUrl;
        }
        console.info('PR Repository : ', repository);
        console.info('PR Branch live url : ', prBranchLiveUrl);
        console.info('Milo Libs : ', miloLibs);
    } catch (err) {
        console.error(`Error => Error in setting PR Branch test URL : ${prBranchLiveUrl}`);
        console.info(`Note: PR branch test url  ${prBranchLiveUrl} is not valid, Exiting test execution.`);
        process.exit(1);
    }
}

async function getCircleCIBranchLiveUrl() {
    const stageUrl = STAGE_URL;

    try {
        if (await isBranchURLValid(stageUrl)) {
            process.env.PR_BRANCH_LIVE_URL = stageUrl;
        }
        console.info('Stage Branch Live URL : ', stageUrl);
    } catch (err) {
        console.error('Error => Error in setting Stage Branch test URL : ', stageUrl);
        console.info('Note: Stage branch test url is not valid, Exiting test execution.');
        process.exit(1);
    }
}

async function getProdWorkflowLiveUrl() {
    const prodUrl = PROD_URL;

    try {
        if (await isBranchURLValid(prodUrl)) {
            process.env.PR_BRANCH_LIVE_URL = prodUrl;
        }
        console.info('Workflow Live URL : ', prodUrl);
    } catch (err) {
        console.error('Error => Error in setting worflow test URL : ', prodUrl);
        console.info('Note: Worflow test url is not valid, Exiting test execution.');
        process.exit(1);
    }
}

async function getLocalBranchLiveUrl() {
    let localTestLiveUrl;
    try {
        const localGitRootDir = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();

        if (localGitRootDir) {
            const gitRemoteOriginUrl = execSync('git config --get remote.origin.url', {
                cwd: localGitRootDir,
                encoding: 'utf-8',
            }).trim();
            const match = gitRemoteOriginUrl.match(/github\.com\/(.*?)\/(.*?)\.git/);

            if (match) {
                const [localOrg, localRepo] = match.slice(1, 3);
                const localBranch = execSync('git rev-parse --abbrev-ref HEAD', {
                    cwd: localGitRootDir,
                    encoding: 'utf-8',
                }).trim();
                localTestLiveUrl = process.env.LOCAL_TEST_LIVE_URL || MAIN_BRANCH_LIVE_URL;
                if (await isBranchURLValid(localTestLiveUrl)) {
                    console.info('Git ORG      : ', localOrg);
                    console.info('Git REPO     : ', localRepo);
                    console.info('Local Branch : ', localBranch);
                    console.info('Local Test Live URL    : ', localTestLiveUrl);
                }
            }
        }
    } catch (error) {
        console.error(`Error => Error in setting local test URL : ${localTestLiveUrl}\n`);
        console.info(`Note: Local or branch test url is not valid, Exiting test execution.\n`);
        process.exit(1);
    }
}

async function globalSetup() {
    console.info('---- Executing Nala Global setup ----\n');

    // Reset ODIN AEM request counter for fresh test run
    console.log('🔄 Resetting ODIN AEM request counter for new test run');
    try {
        GlobalAEMCounter.reset();
        console.log('✅ ODIN AEM request counter reset to 0\n');
    } catch (error) {
        console.log(`⚠️  Warning: Could not reset ODIN AEM counter: ${error.message}\n`);
    }

    if (process.env.GITHUB_ACTIONS === 'true') {
        console.info('---- Running Nala Tests in the GitHub environment ----\n');

        if (process.env.MILO_LIBS_RUN === 'true') {
            await getGitHubMiloLibsBranchLiveUrl();
        } else if (process.env.DAILY_RUN === 'true') {
            await getProdWorkflowLiveUrl();
        } else {
            await getGitHubPRBranchLiveUrl();
        }
    } else if (process.env.CIRCLECI) {
        console.info('---- Running Nala Tests in the CircleCI environment ----\n');
        await getCircleCIBranchLiveUrl();
    } else {
        console.info('---- Running Nala Tests in the Local environment ----\n');
        await getLocalBranchLiveUrl();
    }
}

export default globalSetup;
