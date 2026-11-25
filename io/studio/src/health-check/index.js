const COMMIT_SHA = /^[0-9a-f]{40}$/;

async function main(params) {
    return {
        statusCode: 200,
        body: {
            message: 'Hello, world!',
            sha: COMMIT_SHA.test(params.deployedSha) ? params.deployedSha : null,
        },
    };
}

export { main };
