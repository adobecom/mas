# SETUP

## Setup your workspace

- install aio cli running `npm install -g @adobe/aio-cli`
- Request access to I/O Runtime in Adobe Corp org (you can do that on #milo-dev)
- navigate to Developer Console https://developer.adobe.com/console
- in 'Merch at Scale Studio' project, create a workspace with your github user id
- to enable the oauth-server flow, navigate to your personal workspace
- if there is no `I/O Management API` card present yet, click on `Add Service`, then select `API`
- in the list of API services, find `I/O Management API` and select it
- click `Next`
- click `Save configured API`
- in your workspace click on 'Download all' and copy the auth .json in root (/io/studio)

## Prepare .aio and .env files

With the aio-cli v11 installed locally, run the following commands in the terminal:

```bash
cd io/studio

# load the workspace config
# this should populate the `.env` and the `.aio` file in the project root (/io/studio)
aio app use <path_to_workspace_json>

# run `aio where` and verify output has your ldap in workspace
aio where

# extract the name of the oauth-credentials with jq and format string
aio config ls --json | jq -r '.project.workspace.details.credentials[] | select(.integration_type == "oauth_server_to_server") | .name' | tr '[:upper:]' '[:lower:]'

# set the returned string from above as current IMS context
aio context -s <string_from_above_command>
```

`aio app use` only writes the `AIO_runtime_*` connection vars. Ask a colleague (or read from Vault) for the remaining action-input values and add them to `.env`. See `env_template` for the full annotated list:

Ask a colleague for secret values and add them to your `.env` file:

| Name                              | Description                                                           | Default             | Required        |
| --------------------------------- | --------------------------------------------------------------------- | ------------------- | --------------- |
| `ODIN_ENDPOINT`                   | AEM author API base URL                                               | —                   | Local dev only¹ |
| `AOS_URL`                         | Adobe OST service URL                                                 | —                   | Local dev only² |
| `AOS_API_KEY`                     | Adobe OST service API key                                             | —                   | Local dev only² |
| `OST_WRITE_API_KEY`               | API key used to authenticate inbound requests to `ost-products-write` | —                   | Local dev only² |
| `TRANSLATION_JOB_PAYLOAD_TTL`     | TTL in seconds for translation job payloads in the state store        | `86400` (24 h)      | No              |
| `TRANSLATION_PROJECT_SUMMARY_TTL` | TTL in seconds for translation project summaries in the state store   | `2592000` (30 days) | No              |
| `WORKER_CONCURRENCY`              | Max concurrent translation worker slots                               | `2`                 | No              |
| `BATCH_SIZE`                      | Fragments processed per batch in the translation worker               | `2`                 | No              |
| `RPS_LIMIT`                       | Max Odin API requests per second in the translation worker            | `2`                 | No              |

¹ For CI deployments, `ODIN_ENDPOINT` is set automatically from the target environment's `odin_bucket` (QA for PR deploys, stage/prod on merge), so it does **not** need to be present in the `.env` stored in Vault. Add it only for running the actions locally.

² Stored once in the shared Vault path `cloudtech_wcms/merch-at-scale/aio-studio/common` (identical across all environments) and injected by CI at deploy time, so they do **not** need to be in the `.env` stored in Vault. Add them only for running the actions locally.

With these steps, your local `.aio` and `.env` are ready for local dev. To make them available to CI/CD, store them in Vault — see **Seed your Vault secrets** below.

## CI/CD for I/O studio

Using Github workflows, the CI/CD of I/O studio is automated. Deployment secrets are fetched from the corporate **Vault** (HashiCorp, KV v2, mount `cloudtech_wcms`) at runtime via AppRole auth — they are **no longer stored as GitHub Action secrets**. The workflows do the following:

- detect PRs touching `io/studio/**`
- **preflight**: confirm the PR author's Vault path exists, failing fast if it isn't seeded yet
- build and run tests
- auto-deploy the I/O studio actions to the personal I/O runtime workspace of the person who opened the PR (`github.event.pull_request.user.login`), reading that workspace's `env`/`aio` from their Vault path and the `odin_bucket` from the shared QA path
- run a health-check against the deployed workspace
- on merge, auto-deploy to stage (with health-check) then prod, reading each environment's secrets from its own Vault path

There is no QA fallback: if your personal Vault path is missing, the PR run fails at preflight.

## CI/CD Prerequisites

Two repository-level GitHub secrets provide Vault access (set once, shared by every workflow — independent of team size):

| Name              | Value               |
| ----------------- | ------------------- |
| `VAULT_ROLE_ID`   | AppRole `role_id`   |
| `VAULT_SECRET_ID` | AppRole `secret_id` |

Beyond that, each developer who wants PR auto-deploy to their personal workspace seeds their **own** Vault path (self-service, see below). There are no longer any per-developer GitHub secrets.

## Seed your Vault secrets

Your personal workspace secrets live in Vault at `cloudtech_wcms/merch-at-scale/aio-studio/<gh_user_id>` (the path is lowercased and matches your GitHub username / personal workspace name). Seed it with the contents of your local `.env` and `.aio` files:

| Field | Value                              |
| ----- | ---------------------------------- |
| `env` | contents of your local `.env` file |
| `aio` | contents of your local `.aio` file |

The workspace **namespace** is read from the `.env` blob (`AIO_runtime_namespace`) at deploy time, so it does **not** need its own field.

The field names are `env` and `aio` — **no leading dot**. The dot-prefixed filenames (`.env`, `.aio`) are produced by CI when it writes the files at deploy time; the Vault field name is just an identifier.

`odin_bucket` is **not** part of a developer path — PR deploys always use the shared QA `odin_bucket` from `cloudtech_wcms/merch-at-scale/aio-studio/qa`. Likewise, the shared service credentials (`aos_url`, `aos_api_key`, `ost_write_api_key`, `ai_foundry_api_key`) live once in the shared `cloudtech_wcms/merch-at-scale/aio-studio/common` path (admin-managed) and are injected by CI — you don't seed them. `ai_foundry_api_key` authenticates the ai-chat action against Adobe AI Foundry; the matching endpoint and model ids are not secrets and are set in the deploy workflow.

Using the Vault CLI (after `export VAULT_ADDR=https://vault-amer.adobe.net` or `export VAULT_ADDR=https://vault-emea.adobe.net` and logging in):

```bash
vault kv put cloudtech_wcms/merch-at-scale/aio-studio/<gh_user_id> \
  env=@.env \
  aio=@.aio
```

Once seeded, opening a PR against `io/studio` deploys to your personal workspace.

### Bot PR authors

`.github/workflows/resolve-aio-identity.yaml` resolves every PR author to the credentials their deploy uses. A GitHub App login carries a `[bot]` suffix (`pinatacode[bot]`) that is not legal in a GitHub secret name, so its `AIO_WWW_ENV_<login>` can never resolve. Bots on the resolver's allowlist deploy `io/www` to the shared **QA** namespace instead. QA is safe to share because no other workflow deploys to it, unlike `STAGE`, which `io-merge.yaml` owns for `main`. Every other author still needs their own secrets, and fails the check without them.

`io/studio` has **no** QA mapping. Its credentials come from Vault, and the `qa` path holds only `odin_bucket`, no `env`/`aio`. The resolver only strips a trailing `[bot]` to produce a legal path segment, so `pinatacode[bot]` reads `cloudtech_wcms/merch-at-scale/aio-studio/pinatacode`, seeded exactly like a developer path above.

## How the `vault-secrets` action works

CI fetches secrets through the reusable composite action `.github/actions/vault-secrets`, which wraps [`hashicorp/vault-action`](https://github.com/hashicorp/vault-action) (AppRole auth, KV v2, mount `cloudtech_wcms`, `https://vault-amer.adobe.net`). It reads one Vault path and exposes each field in one of two ways, depending on how you request it.

### Inputs

| Input               | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `role-id`           | AppRole `role_id` (from the `VAULT_ROLE_ID` GH secret)                        |
| `secret-id`         | AppRole `secret_id` (from the `VAULT_SECRET_ID` GH secret)                    |
| `path`              | Secret path relative to the `cloudtech_wcms` mount (lowercased before lookup) |
| `file-fields`       | Comma-separated `field=filename` pairs — written verbatim as files            |
| `env-fields`        | Comma-separated field names — exported as environment variables               |
| `working-directory` | Directory the `file-fields` files are written to (default: repo root)         |

At least one of `file-fields` / `env-fields` must be provided.

### How secrets are exposed

- **`file-fields`** → **files.** Each `field=filename` writes that field's value verbatim to `working-directory/filename`. Used for whole-file blobs (`env=.env,aio=.aio` recreates the `.env` and `.aio` files `aio app deploy` expects). Writing blobs to files avoids multi-line-env masking pitfalls.
- **`env-fields`** → **environment variables.** Each field is exported to `$GITHUB_ENV` as a **masked** variable named after the field, **UPPERCASED**: `odin_bucket` → `$ODIN_BUCKET`, `aos_url` → `$AOS_URL`. Used for scalar values. These are available to **every subsequent step in the same job**. Because they are masked, they cannot be reliably passed to a _different_ job via job outputs (GitHub empties masked outputs) — derive such values from a non-masked source instead (see the namespace note below).

All fetched values — and the Vault token — are masked in the workflow logs.

### Example

```yaml
- uses: ./.github/actions/vault-secrets
  with:
      role-id: ${{ secrets.VAULT_ROLE_ID }}
      secret-id: ${{ secrets.VAULT_SECRET_ID }}
      path: merch-at-scale/aio-studio/<path>
      file-fields: env=.env,aio=.aio # → io/studio/.env and io/studio/.aio
      env-fields: odin_bucket # → $ODIN_BUCKET
      working-directory: io/studio
```

### Notes

- **Same job only.** The files and env vars live on that job's runner and do not cross to other jobs. The separate health-check job gets the `namespace` it needs via a job **output**: the deploy job reads `AIO_runtime_namespace` from the deployed `.env` and emits it. It deliberately does **not** fetch `namespace` as a masked Vault field, because GitHub empties job outputs whose value is a masked secret.
- **Precedence over `.env`.** Env vars exported here win over values in the `.env` file — `aio`'s dotenv loader does not override variables already set in the environment. This is how CI forces the QA `odin_bucket` (→ `ODIN_ENDPOINT`) and the shared AOS/OST credentials regardless of what a developer put in their `.env`.
- The deploy job calls the action **three times**: workspace creds (`env`/`aio` files) from the workspace path, `odin_bucket` from the environment path (QA for PRs, stage/prod on merge), and the AOS/OST creds from the shared `common` path.
- After core deployment, it separately fetches the AI key and deploys AI actions. Missing AI secrets or an AI deployment failure produce a warning without blocking core Studio. Set the reusable workflow's `deploy_ai` input to `false` to skip that rollout; this does not remove previously deployed AI actions.

## Local Dev

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default
- open https://localhost:9080/api/v1/web/MerchAtScale/health-check

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions

### Shared MASA knowledge

The assistant searches only mas-agent's author corpus. Maintain product facts, authoring guidance
and troubleshooting in `adobecom/mas-agent/knowledge/`; Studio has no authored corpus or local
knowledge fallback. Intent schemas, guided UI flows and confirmation rules remain in Studio.

Test and deployment jobs download `knowledge-author.json` from the `knowledge-latest` release of
`adobecom/mas-agent` with Contents read access. CI mints a short-lived token when repository variable
`MAS_AGENT_READER_APP_ID` is configured, using repository secret `MAS_AGENT_READER_APP_KEY`.
Set the key first and then the App-ID variable. Use only the MASA knowledge reader App, installed
on `adobecom/mas-agent`; MASA's writing App key stays on its host. Installation IDs are discovered
by the token action and need no repository variable. Fork and Dependabot PRs receive no repository
secrets, so the repository-wide Unit Tests workflow skips io/studio for them. The imported
module, `src/ai-chat/masa-knowledge.js`, is generated and gitignored. It contains the corpus revision
and is bundled with the assistant; answering a question does not call mas-agent.

`npm test` fetches the corpus in its pretest hook. Local development and CI require a valid,
nonempty author export; coverage suites never skip a missing source. To work without a read token,
export from a local mas-agent checkout with `npm run knowledge:export -- --profile author --out
/absolute/path/knowledge-author.json`, then run:

```sh
MAS_AGENT_KNOWLEDGE_FILE=/absolute/path/knowledge-author.json npm test
```

Without the reader App-ID variable, workflows use the existing `MAS_AGENT_KNOWLEDGE_TOKEN` secret.
Keep that fallback during activation, then remove it after App-authenticated tests and deployment
succeed. Clearing the App-ID variable restores the fallback while the secret is retained. An App
token failure does not silently use a personal token. Local downloads still accept
`MAS_AGENT_KNOWLEDGE_TOKEN` directly.

The import accepts only the version 1 author profile and records its revision, generation date
and SHA-256 digest. An invalid or failed fetch leaves the existing generated module intact;
it never writes an empty replacement. Before deploying assistant actions locally,
run `npm run fetch:masa-knowledge -- --required` with a read token or a local export configured.
In CI, a failed corpus fetch skips the optional AI deployment and reports a warning; already
deployed core Studio actions are unaffected.

### Snapshot refresh

`IO Studio Knowledge Refresh` runs daily at 07:17 UTC on `main`, and can also be dispatched manually
on `main` for an urgent knowledge correction. The target lag is one day plus GitHub queue and
validation/deployment time; this is a snapshot, not a live API. Failed runs need operator attention
in Actions and keep the previous deployed knowledge when fetching or validation fails.

The workflow uses the reader App, runs the Studio suite against the fetched export, and records
the revision and digest in its summary. It then deploys only the AI action to stage, runs the
existing workspace health check, and deploys the same tested export to production. Deployment
re-downloads the export with `--expected-sha256`; if the release changes in the meantime, the run
fails and must be retried. Corpus contents are not committed or uploaded as workflow artifacts.
Workspace deployments share a lock with normal Studio deployments, and a refresh refuses to
deploy application code older than current `main`.

The workspace health check does not grade live model answers. Validate representative questions
in the stage assistant for the initial cutover and for changes to retrieval or prompt behavior.
The scheduled job checks source coverage, import failure paths and offline chat behavior; live
investigation parity is a later API deliverable.

If a source change breaks coverage, fix or revert it in mas-agent and retry the refresh. Do not
reintroduce a Studio corpus. The initial cutover requires the mas-agent migration export to be
published first; its inventory is `config/knowledge-export/studio-migration.md` in mas-agent.

## Deploy & Cleanup

From `io/studio`, use `node scripts/deploy-actions.mjs core` for existing Studio services or `node scripts/deploy-actions.mjs assistant` for AI actions. The groups are derived from the manifest and preserve existing action URLs. The normal workspace credentials are required for both groups.

Do not deploy all actions at the same time - this increases risks, provide -a <action-name> to specify what you are deploying.

- `aio app test && aio app deploy -a ost-products-read` to test and deploy an action to Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

If you need to force re-deploy:

- `aio app deploy --force-deploy --no-publish`
  To deploy specific action
- `aio app deploy --force-deploy -a ost-products-read`

## Config

### `.env`

You can generate this file using the command `aio app use`. Be aware that it would remove all custom env vars, you will need to re-add them — see `env_template` for the complete annotated list of variables the I/O runtime actions require.

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`

Main configuration file that defines an application's implementation.
