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
| `scripts/test_contract.py`           | Offline checks for ownership references, IO review policy, and preview mappings.                       |

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
This installs the root workspaces, not the separate `io/www` project.
The existing `studio` stage proxy and web-component build scripts are reused.
`preview.yaml` declares `@adobe/aem-cli@16.20.5` as a preview tool. The engine
installs it on demand in this run's scratch directory **outside the checkout**,
and prepends it only to the local preview process's PATH. Other tenants do not
install it unless they explicitly declare an approved tool. No global install
or MAS package-file change is needed.

Installations are reused across captures within the same run, not across runs:
this prevents a tenant from modifying executable tooling used by another run.
The runtime needs npm, public npm registry access, and a compatible Node release
(22.22.2+ or 24.15+). Install scripts are disabled and failed installations stop
the preview rather than falling back to an unrelated global CLI.

Deploy Fiesta's tenant preview-tool support before enabling this configuration;
older engines reject the new `tools` field. Keep this PR in draft until that
engine change is deployed and a MAS preview has been verified.

```sh
python3 -m pip install PyYAML==6.0.2
python3 .pinata/scripts/check-contract.py --skip-registry
python3 -m unittest discover -s .pinata/scripts -p 'test_contract.py' -v
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

### IO changes require manual verification

The first gate, `io-preview-support`, stops changes under `io/www/` or
`io/studio/` for human review. It also applies when a change includes Studio
or web-component files: a working UI preview does not verify changed IO code.
Pasting a preview URL does not remove this gate. A human approval to continue
is an explicit exception, not proof that IO was tested automatically.

Current previews load deployed IO services. `maslibs` points at changed web
components only; `aem.env=stage` selects a deployed Studio service, not the
candidate's IO code. Before removing this gate, provide a separate `io/www`
dependency install and tests, deploy candidate IO to an isolated workspace,
and route previews to it using `mas-io-url` or `io.studio.env` as appropriate.
No IO deployment or additional dependency installation is added by this PR.

### Ownership and configuration protection

Repository ownership is not configured. There is no agreed CODEOWNERS file,
so `manifest.yaml` omits `owners_from`; no reviewers or owners are assigned by
this configuration. The engine schema's default filename is not an ownership
assignment. Once the team agrees on owners, add the ownership file and an
explicit reference. The configuration check rejects declared references to
missing files or files outside the repository.

The vendored `floor/gates.yaml` is a CI comparison snapshot. It is not a
security boundary: editing it together with `gates.yaml` can pass that local
comparison. The engine separately enforces its packaged organization minimums
at runtime. That does not protect every `.pinata/` file from edits. This repo
does not declare a `tcb-guard`, and mandatory protection of `.pinata/**` in the
pinata-code workflow remains a separate engine task. Do not treat a green
configuration check as proof that these files cannot be changed by automation.

### Declared previews and pasted links

The surface catalog selects known pages from the files being changed.
`capture_hosts` filters pasted/generated URLs and supplies authentication
settings; it does not filter URLs already declared in that catalog. The public
CC, Express, and Milo hosts used by the catalog are also listed so those same
links can be pasted into a request. They retain their declared public host;
only entries with `capture_on` switch hosts. Authentication credentials remain
restricted to the existing authentication profiles.

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
   the stage author service, and the selected preview surfaces. Deploy the
   tenant preview-tool support as described above before testing previews.
6. Run Slack → refinement → planning → changes → verification → PR against
   MAS before switching the default repository.

Studio previews are stage-pinned using the stage author proxy and
`aem.env=stage`; automated captures must not edit production content.
External consumer surfaces remain read-only preview targets.
