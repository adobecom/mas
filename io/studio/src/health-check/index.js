const COMMIT_SHA = /^[0-9a-f]{40}$/;

async function main(params) {
    const deployedSha = String(params.deployedSha ?? '').toLowerCase();
    return {
        statusCode: 200,
        body: {
            message: 'Hello, world!',
            sha: COMMIT_SHA.test(deployedSha) ? deployedSha : null,
        },
    };
}

export { main };
