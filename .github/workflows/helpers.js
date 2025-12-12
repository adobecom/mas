// Those env variables are set by an github action automatically
// For local testing, you should test on your fork.
const owner = process.env.REPO_OWNER || ''; // example owner: adobecom
const repo = process.env.REPO_NAME || ''; // example repo name: mas
const auth = process.env.GH_TOKEN || ''; // https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

const getLocalConfigs = async () => {
  if (!owner || !repo || !auth) {
    throw new Error(`Create a .env file on the root of the project with credentials.
Then run: node --env-file=.env .github/workflows/snow-pr-comment.js`);
  }

  const { Octokit } = await import('@octokit/rest');
  return {
    github: {
      rest: new Octokit({ auth }),
      repos: {
        createDispatchEvent: () => console.log('local mock createDispatch'),
      },
    },
    context: {
      repo: {
        owner,
        repo,
      },
    },
  };
};

const slackNotification = (text, webhook) => {
  console.log(text);
  return fetch(webhook || process.env.MAS_RELEASE_SLACK_WH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
};

export { getLocalConfigs, slackNotification };

