// CI binds the DEPLOY_* params when it deploys this action (.github/workflows/io-deploy.yaml).
const NO_METADATA = 'No deploy metadata: this action was last deployed outside CI.';

function main({ DEPLOY_REPO_URL, DEPLOY_COMMIT, DEPLOY_PR, DEPLOY_RUN_ID, DEPLOY_TIME }) {
    const headers = { 'Cache-Control': 'no-store' };
    if (!DEPLOY_COMMIT) return { statusCode: 200, headers, body: { message: NO_METADATA } };
    return {
        statusCode: 200,
        headers,
        body: {
            commit: DEPLOY_COMMIT,
            commitUrl: `${DEPLOY_REPO_URL}/commit/${DEPLOY_COMMIT}`,
            pr: Number(DEPLOY_PR),
            prUrl: `${DEPLOY_REPO_URL}/pull/${DEPLOY_PR}`,
            runUrl: `${DEPLOY_REPO_URL}/actions/runs/${DEPLOY_RUN_ID}`,
            deployedAt: DEPLOY_TIME,
        },
    };
}

export { main };
