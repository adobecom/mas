import { expect } from 'chai';
import { main } from '../src/info/index.js';

const REPO_URL = 'https://github.com/adobecom/mas';
const COMMIT = '90f9a3bb2f825f080e4ed401308044eff3bd9ef5';

describe('info', () => {
    it('returns the deployed branch, commit and PR with links to GitHub', () => {
        const response = main({
            DEPLOY_REPO_URL: REPO_URL,
            DEPLOY_BRANCH: 'main',
            DEPLOY_COMMIT: COMMIT,
            DEPLOY_PR: '1641',
            DEPLOY_RUN_ID: '43262985750',
            DEPLOY_TIME: '2026-11-12T16:52:00Z',
        });
        expect(response).to.deep.equal({
            statusCode: 200,
            headers: { 'Cache-Control': 'no-store' },
            body: {
                branch: 'main',
                commit: COMMIT,
                commitUrl: `${REPO_URL}/commit/${COMMIT}`,
                pr: 1641,
                prUrl: `${REPO_URL}/pull/1641`,
                runUrl: `${REPO_URL}/actions/runs/43262985750`,
                deployedAt: '2026-11-12T16:52:00Z',
            },
        });
    });

    it('says when the action was not deployed by CI', () => {
        // aio app deploy binds unset env vars as empty strings.
        const response = main({
            DEPLOY_REPO_URL: '',
            DEPLOY_BRANCH: '',
            DEPLOY_COMMIT: '',
            DEPLOY_PR: '',
            DEPLOY_RUN_ID: '',
            DEPLOY_TIME: '',
        });
        expect(response).to.deep.equal({
            statusCode: 200,
            headers: { 'Cache-Control': 'no-store' },
            body: { message: 'No deploy metadata: this action was last deployed outside CI.' },
        });
    });
});
