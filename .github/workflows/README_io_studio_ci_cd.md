# CI/CD for I/O studio

Using Github workflows, the CI/CD of I/O studio has been automated. The workflows have been setup to do the following:

- detect PR creations with files in io/studio
- build and run tests
- auto-deploy the I/O studio actions in a personal workspace of the github.actor (with fallback mechanism to QA workspace)
- runs health-check on deployed actions
- post merge of PR, auto-deployment to stage with tests, then to prod if successful

## Prerequisites

In order for the auto-deployment to work, a number of Github action secrets are required. In addition, every developer who wants to get his/her PR changes deployed to their personal I/O studio workspace, needs his/her own set of github secrets. For this purpose, the workspace JSON file from a personal I/O studio workspace is required for above secrets.

Starting with aio-cli v11, I/O runtime workspace authentication has changed to an oauth-server flow. Before downloading the above workspace JSON file, the following step is required:

- to enable the oauth-server flow, navigate to your personal workspace
- if there is no `I/O Management API` card present yet, click on `Add Service`, then select `API`
- in the list of API services, find `I/O Management API` and select it
- click `Next`
- click `Save configured API`

This adds the oauth-server flow with a corresponding auto-generated technical account for authentication to your personal workspace. Please note that the default workspaces Stage and Production automatically have this oauth-server flow added.

The workspace JSON file is available in the Merch At Scale Studio project via https://developer.adobe.com/console and can now be downloaded from the personal workspace overview page.

## Prepare .aio and .env files

With the aio-cli v11 installed locally, run the following commands in the terminal:

```bash
# load the workspace config
aio app use <path_to_workspace_json>

# extract the name of the oauth-credentials with jq and format string
aio config ls --json | ^C -r '.project.workspace.details.credentials[] | select(.integration_type == "oauth_server_to_server") | .name' | tr '[:upper:]' '[:lower:]'

# set the returned string from above as current IMS context
aio config -s <string_from_above_command>
```

With these steps, both the `.aio` and `.env` files are ready to be used as GH action secrets.

## Set GH action secrets

The following secrets need to be added to the mas repository in order for the CI/CD workflows for I/O studio to auto-deploy the studio actions to your personal workspace.

Please note that your GH user-id matches the personal workspace name.

The following secrets need to be added per workspace:

| Name                          | Value         | Comment                                          |
| ----------------------------- | ------------- | ------------------------------------------------ |
| `AIO_STUDIO_ENV_<gh_user_id>` | `<.env_file>` | content of the local `.env` file                 |
| `AIO_STUDIO_AIO_<gh_user_id>` | `<.aio_file>` | content of the local `.aio` file                 |
| `AIO_STUDIO_NS_<gh_user_id>`  | `<namespace>` | see `AIO_runtime_namespace` value in `.env` file |

With these secrets in place, any github user's I/O studio workspace that has the above set of secrets created will be used when raising a PR against `io/studio`.
