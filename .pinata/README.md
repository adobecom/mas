# Piñata configuration for MAS

This directory describes MAS to the shared **pinata-code** workflow: what to
read, how to verify changes, which pages to preview, and how to format a PR.
It is repository configuration, not a second workflow engine or an installable
ecosystem package.

## What is included

| File                                 | Purpose                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `manifest.yaml`                      | MAS identity and shared planning models.                                                               |
| `gates.yaml`                         | Lint, formatting, generated-file checks, visual evidence, independent review, and lockfile protection. |
| `floor/gates.yaml`                   | Organization minimums checked alongside the repository gates.                                          |
| `preview.yaml`                       | Preview startup, test surfaces, and authentication requirements.                                       |
| `pr.yaml`                            | Jira-first branch names and MAS before/after links.                                                    |
| `scripts/check-contract.py`          | Configuration and model-reference checks.                                                              |
| `scripts/check-dist-sync.sh`         | Rebuild and detect stale web-component bundles/docs.                                                   |
| `scripts/test-preview-supervisor.sh` | Isolated tests of preview startup and cleanup.                                                         |

The migration uses the tested configuration from mas-pinata commit
`4da6ea3f141e174aead3f158ec9bf3365d53b088`, retargeted to `adobecom/mas`.
The preview CLI is supplied by the Piñata runtime, not by MAS. Both
`package.json` and `package-lock.json` remain unchanged, as do MAS's content
mount, application code, and existing CI tests.

The old `.config.json`, issue-triggered agent/SDLC/review workflows, demo
`restyle-component` workflow, and `justfile` are intentionally not migrated.
They configure separate automation, not the installed pinata-code workflow.
No secrets, generated run history, or shared package copies belong here.

## Verification

After `npm ci`, command gates use the repository's installed tools.
The existing `studio` stage proxy and web-component build scripts are reused.
The preview runner preserves the runtime PATH alongside repository tool paths.
It fails immediately with setup instructions if `aem` is unavailable.

Provision the preview CLI once in the runtime image or a dedicated tool prefix,
**outside the MAS checkout**, using a supported Node release (22.22.2+ or 24.15+):

```sh
# Example runtime image setup; the prefix must be writable during installation.
npm install --prefix /opt/pinata-tools/aem --no-save --package-lock=false @adobe/aem-cli@16.20.5
export PATH="/opt/pinata-tools/aem/node_modules/.bin:$PATH"
aem --version
```

Persist that PATH in the engine service configuration or container image, not
just an interactive terminal. For local development, use a dedicated writable
directory outside MAS instead of `/opt/pinata-tools/aem`. This PR documents the
runtime prerequisite; it does not install tools into existing runtimes.

```sh
python3 -m pip install PyYAML==6.0.2
python3 .pinata/scripts/check-contract.py --skip-registry
bash .pinata/scripts/test-preview-supervisor.sh
bash .pinata/scripts/check-dist-sync.sh
```

To also validate model IDs against an accessible pinata-tool-shelf checkout:

```sh
python3 .pinata/scripts/check-contract.py --registry /path/to/pinata-tool-shelf
```

The configuration CI check does not need secrets, call a model, launch real
preview servers, or publish a PR. Model availability must additionally be
verified in the runtime environment.

The imported gate policy preserves the fork's explicit disabled unit-test
gate; it does **not** claim unit tests passed. MAS's existing unit-test CI
remains unchanged and must still pass before merge. Re-enabling that gate is
a separate policy decision once its order-dependent failures are addressed.

## Activation outside this PR

Merging these files alone does not route Slack requests to MAS.

1. Add or update the ecosystem catalog installation for `adobecom/mas`,
   pointing to the released shared pinata-code package. Update repository
   routing/defaults deliberately; keep the mas-pinata installation available
   until the MAS end-to-end test succeeds.
2. Give the runtime GitHub App access to MAS for checkout, branches, and PRs.
   Review any cross-repository policy and protected-branch requirements.
3. Verify AEM GitHub integration/branch publication and IMS redirect approval
   for `MWPW-XXXXXX--mas--adobecom.aem.page`. These external settings are not
   established by this commit.
4. Provide runtime credentials through the existing secret store:
   `IMS_PASS` for the declared automation account and
   `AEM_SITE_TOKEN_DA_CC` / `AEM_SITE_TOKEN_DA_DC` for gated consumer pages.
   Site tokens must be provisioned by an authorized site administrator; the
   AEM CLI admin token is not a substitute. Do not put credentials in Git.
5. Check access to the shared `mas-web-components` and `mas-studio` models,
   the stage author service, and the selected preview surfaces. Provision the
   runtime CLI as described above and verify `aem --version` from the engine's
   service environment before testing previews.
6. Run Slack → refinement → planning → changes → verification → PR against
   MAS before switching the default repository.

Studio previews are stage-pinned using the stage author proxy and
`aem.env=stage`; automated captures must not edit production content.
External consumer surfaces remain read-only preview targets.
