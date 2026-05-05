# Release mas.js

Release the `@adobecom/mas` npm package and create a GitHub release at `adobecom/mas`.

## Arguments

`$ARGUMENTS` may contain a version string (e.g. `0.7.0`). If absent, ask the user for the version before proceeding.

## Steps

### 1. Determine the version

Read `web-components/package.json` to show the current version.

If `$ARGUMENTS` is empty or not a valid semver, use the AskUserQuestion tool to ask the user for the target version.

### 2. Bump the version in package.json

Edit `web-components/package.json` — update the `"version"` field to the new version.

### 3. Run npm install

```bash
cd web-components && npm install
```

This updates `package-lock.json` with the new version.

### 4. Find the previous release

```bash
gh release list --repo adobecom/mas --limit 10 --json tagName,publishedAt,name
```

Identify the most recent `mas-js-v*` release tag and its `publishedAt` date.

### 5. Collect merged PRs since the last release

```bash
gh pr list --repo adobecom/mas --state merged --limit 200 \
  --json number,title,mergedAt,body,url,author \
  --search "is:merged merged:>LAST_RELEASE_DATE"
```

Replace `LAST_RELEASE_DATE` with the ISO date from step 4 (format: `YYYY-MM-DDTHH:MM:SSZ`).

### 6. Extract JIRAs and build release notes

For each merged PR, extract JIRA ticket IDs matching:

- `MWPW-\d+` in the PR title or body
- `https://jira.corp.adobe.com/browse/(MWPW-\d+)` in the body

Build release notes in this format:

```markdown
## What's Changed

### Highlights

{2-5 bullet points written as plain functional descriptions of what changed — what the feature does, what was fixed, what behavior changed. Do not reference PR numbers, JIRA IDs, version numbers, or author names here. Example: "Added support for quantity selector on merch cards" or "Fixed price display overflow on mini compare cards".}

### All Changes

- {PR title} by @{author} in {PR URL} — [MWPW-XXXXX](https://jira.corp.adobe.com/browse/MWPW-XXXXX) (include one link per JIRA found; omit if none)

### JIRAs

{deduplicated list of all MWPW-\* tickets found, one per line}
```

Show the draft release notes to the user and ask for confirmation or edits before proceeding to the next step.

### 7. Build

```bash
cd web-components && npm run build
```

This runs tests, bundles, and builds docs. If this step fails, stop and report the error to the user — do not proceed to packing.

### 8. Pack the npm package

```bash
cd web-components && npm pack
```

This produces `adobecom-mas-{VERSION}.tgz` in the `web-components/` directory.

### 9. Create the GitHub release

Verify the active GitHub account has access to `adobecom/mas`:

```bash
gh auth status
```

Create the release:

```bash
gh release create mas-js-v{VERSION} \
  --repo adobecom/mas \
  --title "mas-js v{VERSION}" \
  --notes "{RELEASE_NOTES}" \
  web-components/adobecom-mas-{VERSION}.tgz
```

### 10. Commit the version bump

Stage and commit only the package.json and package-lock.json changes:

```bash
git add web-components/package.json web-components/package-lock.json
git commit -m "chore(release): bump @adobecom/mas to v{VERSION}"
```

### 11. Verify and report

```bash
gh release view mas-js-v{VERSION} --repo adobecom/mas
```

Report the release URL and the commit SHA to the user.

### 12. Generate Slack announcement

Print a ready-to-copy Slack message for the user to share in team channels:

```
🚀 *mas-js v{VERSION}* is out!

*Highlights:*
{bullet list of highlights from the release notes, one line each}

📦 Full release notes: {GitHub release URL}
```

### 13. Clean up local artifacts

Remove the tarball produced by `npm pack`:

```bash
rm web-components/adobecom-mas-{VERSION}.tgz
```

## Notes

- Tag format: `mas-js-v{VERSION}` (e.g. `mas-js-v0.7.0`)
- Tarball is uploaded as a release asset, not published to npm registry
- `"private": true` in package.json is intentional — do not remove it
