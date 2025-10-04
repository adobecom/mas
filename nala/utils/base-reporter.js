// Playwright will include ANSI color characters and regex from below
// https://github.com/microsoft/playwright/issues/13522
// https://github.com/chalk/ansi-regex/blob/main/index.js#L3

const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
].join('|');

const ansiRegex = new RegExp(pattern, 'g');

// limit failed status
const failedStatus = ['failed', 'flaky', 'timedOut', 'interrupted'];

function stripAnsi(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(ansiRegex, '');
}

export default class BaseReporter {
    constructor(options) {
        this.options = options;
        this.results = [];
        this.passedTests = 0;
        this.failedTests = 0;
        this.skippedTests = 0;
    }

    onBegin(config, suite) {
        this.config = config;
        this.rootSuite = suite;
    }

    async onTestEnd(test, result) {
        const { title, retries, _projectId, annotations } = test;
        const { name, tags, url, browser, env, branch, repo } = this.parseTestTitle(title, _projectId);
        const { status, duration, error, retry } = result;
        const errorMessage = error?.message;
        const errorValue = error?.value;
        const errorStack = error?.stack;

        if (retry < retries && status === 'failed') {
            return;
        }

        // Extract test page URL from test annotations
        const testPageAnnotation = annotations?.find((a) => a.type === 'test-page-url');
        const testPageUrl = testPageAnnotation?.description;

        // Extract line number and content from Playwright's error.snippet
        let failedLineNumber = null;
        let failedLineContent = null;
        if (error && status === 'failed' && error.snippet) {
            // Extract line number from error.location
            failedLineNumber = error.location?.line?.toString();

            // Strip ANSI codes from snippet FIRST (it contains color codes)
            const cleanSnippet = stripAnsi(error.snippet);

            // Extract code content from snippet
            const snippetLines = cleanSnippet.split('\n');
            for (const line of snippetLines) {
                // Match lines like "> 243 |             await expect..."
                const match = line.match(/^>\s+(\d+)\s+\|(.*)$/);
                if (match && match[1] === failedLineNumber) {
                    failedLineContent = match[2].trim();
                    break;
                }
            }
        }

        this.results.push({
            title,
            name,
            tags,
            url,
            env,
            browser,
            branch,
            repo,
            status: failedStatus.includes(status) ? 'failed' : status,
            errorMessage: stripAnsi(errorMessage),
            errorValue,
            errorStack: stripAnsi(errorStack),
            stdout: test.stdout,
            stderr: test.stderr,
            duration,
            retry,
            testPageUrl,
            failedLineNumber,
            failedLineContent,
        });
        if (status === 'passed') {
            this.passedTests++;
        } else if (failedStatus.includes(status)) {
            this.failedTests++;
        } else if (status === 'skipped') {
            this.skippedTests++;
        }
    }

    async onEnd() {
        const summary = await this.printResultSummary();
        const resultSummary = { summary };

        if (process.env.SLACK_WH) {
            try {
                console.log('----success to publish result to slack channel----');
                //         await sendSlackMessage(process.env.SLACK_WH, resultSummary);
            } catch (error) {
                console.log('----Failed to publish result to slack channel----');
            }
        }
    }

    async printResultSummary() {
        const totalTests = this.results.length;
        const passPercentage = ((this.passedTests / totalTests) * 100).toFixed(2);
        const failPercentage = ((this.failedTests / totalTests) * 100).toFixed(2);
        const miloLibs = process.env.MILO_LIBS || '';
        const prBranchUrl = process.env.PR_BRANCH_LIVE_URL ? process.env.PR_BRANCH_LIVE_URL + miloLibs : undefined;
        const projectBaseUrl = this.config.projects[0].use.baseURL;
        const envURL = prBranchUrl ? prBranchUrl : projectBaseUrl;

        let exeEnv = 'Local Environment';
        let runUrl = 'Local Environment';
        let runName = 'Nala Local Run';

        if (process.env.GITHUB_ACTIONS === 'true') {
            exeEnv = 'GitHub Actions Environment';
            const repo = process.env.GITHUB_REPOSITORY;
            const runId = process.env.GITHUB_RUN_ID;
            const prNumber = process.env.GITHUB_REF.split('/')[2];
            runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
            runName = `${process.env.WORKFLOW_NAME ? process.env.WORKFLOW_NAME || 'Nala Daily Run' : 'Nala PR Run'} (${prNumber})`;
        } else if (process.env.CIRCLECI) {
            exeEnv = 'CircleCI Environment';
            const workflowId = process.env.CIRCLE_WORKFLOW_ID;
            const jobNumber = process.env.CIRCLE_BUILD_NUM;
            runUrl = `https://app.circle.ci.adobe.com/pipelines/github/wcms/nala/${jobNumber}/workflows/${workflowId}/jobs/${jobNumber}`;
            runName = 'Nala CircleCI/Stage Run';
        }

        const summary = `
    \x1b[1m\x1b[34m---------Nala Test Run Summary------------\x1b[0m
    \x1b[1m\x1b[33m# Total Test executed:\x1b[0m \x1b[32m${totalTests}\x1b[0m
    \x1b[1m\x1b[33m# Test Pass          :\x1b[0m \x1b[32m${this.passedTests} (${passPercentage}%)\x1b[0m
    \x1b[1m\x1b[33m# Test Fail          :\x1b[0m \x1b[31m${this.failedTests} (${failPercentage}%)\x1b[0m
    \x1b[1m\x1b[33m# Test Skipped       :\x1b[0m \x1b[32m${this.skippedTests}\x1b[0m
    \x1b[1m\x1b[33m** Application URL   :\x1b[0m \x1b[32m${envURL}\x1b[0m
    \x1b[1m\x1b[33m** Executed on       :\x1b[0m \x1b[32m${exeEnv}\x1b[0m
    \x1b[1m\x1b[33m** Execution details :\x1b[0m \x1b[32m${runUrl}\x1b[0m
    \x1b[1m\x1b[33m** Workflow name     :\x1b[0m \x1b[32m${runName}\x1b[0m`;

        console.log(summary);

        // Print cleanup summary (2nd - after Nala summary)
        this.printCleanupSummary();

        // Print request summary (3rd)
        await this.printRequestSummary();

        // Print failed tests summary last (4th)
        if (this.failedTests > 0) {
            console.log('\n    \x1b[1m\x1b[34m---------Failed Tests Summary-------------\x1b[0m');
            this.results
                .filter((result) => result.status === 'failed')
                .forEach((failedTest, index) => {
                    // Get first tag (main test identifier) and keep the @ symbol
                    const titleParts = failedTest.title.split('@');
                    const testName = titleParts[1]?.split(',')[0]?.trim() || titleParts[1]?.trim();

                    // Get pre-extracted data from results
                    const testPageUrl = failedTest.testPageUrl;
                    const lineNumber = failedTest.failedLineNumber;
                    const lineContent = failedTest.failedLineContent;

                    console.log(`    ${index + 1}. \x1b[31m\x1b[1m@${testName}\x1b[0m`);
                    if (testPageUrl) {
                        console.log(`    \x1b[36m   🔗 ${testPageUrl}\x1b[0m`);
                    }
                    if (lineNumber) {
                        console.log(`    \x1b[90m   📍 Line ${lineNumber}${lineContent ? ': ' + lineContent : ''}\x1b[0m`);
                    }
                });
            console.log('    \x1b[1m\x1b[34m------------------------------------------\x1b[0m');
        }

        return summary;
    }

    /**
     * Print request summary from request counter files
     */
    async printRequestSummary() {
        // Import and use the request counting reporter's method
        const { default: RequestCountingReporter } = await import('./request-counting-reporter.js');
        const requestReporter = new RequestCountingReporter({});
        requestReporter.printRequestSummary();
    }

    /**
     * Print cleanup summary from teardown results
     */
    printCleanupSummary() {
        // Read cleanup results from global variable set by teardown
        const cleanupResults = global.nalaCleanupResults;

        if (!cleanupResults) {
            return; // No cleanup results to display
        }

        console.log('\n    \x1b[1m\x1b[34m---------Fragment Cleanup Summary---------\x1b[0m');
        console.log(`    \x1b[1m\x1b[33m# Total Fragments to delete :\x1b[0m \x1b[32m${cleanupResults.totalFound}\x1b[0m`);

        if (cleanupResults.totalDeleted > 0) {
            console.log(
                `    \x1b[32m✓\x1b[0m \x1b[1m\x1b[33m Successfully deleted     :\x1b[0m \x1b[32m${cleanupResults.totalDeleted}\x1b[0m`,
            );
        } else if (cleanupResults.totalFound === 0) {
            console.log(`    \x1b[1m\x1b[33m  ➖ No fragments found to clean up\x1b[0m`);
        }

        if (cleanupResults.totalFailed > 0) {
            console.log(
                `    \x1b[31m✘\x1b[0m \x1b[1m\x1b[33m Failed to delete         :\x1b[0m \x1b[31m${cleanupResults.totalFailed}/${cleanupResults.totalFound}\x1b[0m`,
            );
        }
    }

    /**
  This method takes test title and projectId strings and then processes it .
  @param {string, string} str - The input string to be processed
  @returns {'name', 'tags', 'url', 'browser', 'env', 'branch' and 'repo'}
  */
    parseTestTitle(title, projectId) {
        let env = 'live';
        let browser = 'chrome';
        let branch;
        let repo;
        let url;

        const titleParts = title.split('@');
        const name = titleParts[1].trim();
        const tags = titleParts.slice(2).map((tag) => tag.trim());

        const projectConfig = this.config.projects.find((project) => project.name === projectId);

        // Get baseURL from project config
        if (projectConfig?.use?.baseURL) {
            ({ baseURL: url, defaultBrowserType: browser } = projectConfig.use);
        } else if (this.config.baseURL) {
            url = this.config.baseURL;
        }
        // Get environment from baseURL
        if (url.includes('prod')) {
            env = 'prod';
        } else if (url.includes('stage')) {
            env = 'stage';
        }
        // Get branch and repo from baseURL
        if (url.includes('localhost')) {
            branch = 'local';
            repo = 'local';
        } else {
            const urlParts = url.split('/');
            const branchAndRepo = urlParts[urlParts.length - 1];
            [branch, repo] = branchAndRepo.split('--');
        }

        return { name, tags, url, browser, env, branch, repo };
    }

    async persistData() {}

    printPersistingOption() {
        if (this.options?.persist) {
            console.log(`Persisting results using ${this.options.persist?.type} to ${this.options.persist?.path}`);
        } else {
            console.log('Not persisting data');
        }
        //this.branch1 = process.env.GITHUB_REF_NAME ?? 'local';
        this.branch = process.env.LOCAL_TEST_LIVE_URL;
    }

    getPersistedDataObject() {
        const gitBranch = process.env.GITHUB_REF_NAME ?? 'local';

        // strip out git owner since it can usually be too long to show on the ui
        const [, gitRepo] = /[A-Za-z0-9_.-]+\/([A-Za-z0-9_.-]+)/.exec(process.env.GITHUB_REPOSITORY) ?? [null, 'local'];

        const currTime = new Date();
        return {
            gitBranch,
            gitRepo,
            results: this.results,
            timestamp: currTime,
        };
    }
}
