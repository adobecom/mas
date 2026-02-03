#!/bin/bash

TAGS=""
REPORTER=""
EXCLUDE_TAGS="--grep-invert nopr"
EXIT_STATUS=0

echo "GITHUB_REF: $GITHUB_REF"
echo "GITHUB_HEAD_REF: $GITHUB_HEAD_REF"

if [[ "$GITHUB_REF" == refs/pull/* ]]; then
  # extract PR number and branch name
  PR_NUMBER=$(echo "$GITHUB_REF" | awk -F'/' '{print $3}')
  FEATURE_BRANCH="$GITHUB_HEAD_REF"
elif [[ "$GITHUB_REF" == refs/heads/* ]]; then
  # extract branch name from GITHUB_REF
  FEATURE_BRANCH=$(echo "$GITHUB_REF" | awk -F'/' '{print $3}')
else
  echo "Unknown reference format"
fi

# Replace "/" characters in the feature branch name with "-"
FEATURE_BRANCH=$(echo "$FEATURE_BRANCH" | sed 's/\//-/g')

echo "PR Number: ${PR_NUMBER:-"N/A"}"
echo "Feature Branch Name: $FEATURE_BRANCH"

repository=${GITHUB_REPOSITORY}
repoParts=(${repository//\// }) 
toRepoOrg=${repoParts[0]}
toRepoName=${repoParts[1]}

prRepo=${prRepo:-$toRepoName}
prOrg=${prOrg:-$toRepoOrg}

PR_BRANCH_LIVE_URL_GH="https://$FEATURE_BRANCH--$prRepo--$prOrg.aem.live"

# set pr branch url as env
export PR_BRANCH_LIVE_URL_GH
export PR_NUMBER

echo "PR Branch live URL: $PR_BRANCH_LIVE_URL_GH"

# Convert GitHub Tag(@) labels that can be grepped
for label in ${labels}; do
  if [[ "$label" = \@* ]]; then
    label="${label:1}"
    TAGS+="|$label"
  fi
done

# Remove the first pipe from tags if tags are not empty
[[ ! -z "$TAGS" ]] && TAGS="${TAGS:1}" && TAGS="-g $TAGS"

# Retrieve GitHub reporter parameter if not empty
# Otherwise, use reporter settings in playwright.config.js
REPORTER=$reporter
[[ ! -z "$REPORTER" ]] && REPORTER="--reporter $REPORTER"

echo "Running Nala on branch: $FEATURE_BRANCH "
echo "Tags : ${TAGS:-"No @tags or annotations on this PR"}"
echo "Run Command : npx playwright test ${TAGS} ${EXCLUDE_TAGS} ${REPORTER}"
echo -e "\n"
echo "*******************************"

if [[ -z "$PROJECT" ]]; then
    # Check labels for explicit project indicators
    if [[ "$labels" == *"mas-studio"* ]]; then
        PROJECT="mas-studio-chromium" # Studio tests (requires auth)
    elif [[ "$labels" == *"mas-docs"* ]]; then
        PROJECT="mas-docs-chromium" # Docs tests (no auth needed)
    else
        # Labels don't explicitly indicate project, detect from test files
        # This handles cases like @MAS-Plans, @commerce, or file paths
        LIST_OUTPUT=$(npx playwright test --config=./playwright.config.js --list ${TAGS} ${EXCLUDE_TAGS} 2>/dev/null || echo "")
        
        if [[ -n "$LIST_OUTPUT" ]]; then
            # Check for project names in brackets or relative paths in output
            # Using bash pattern matching (like JS includes()) - more efficient than grep
            if [[ "$LIST_OUTPUT" == *"[mas-studio-chromium]"* ]] || [[ "$LIST_OUTPUT" == *"studio/"* ]]; then
                PROJECT="mas-studio-chromium"
            elif [[ "$LIST_OUTPUT" == *"[mas-docs-chromium]"* ]] || [[ "$LIST_OUTPUT" == *"docs/"* ]]; then
                PROJECT="mas-docs-chromium"
            fi
        fi
        
        # Default to mas-live-chromium if still not determined (safe with auth)
        PROJECT="${PROJECT:-mas-live-chromium}"
    fi
fi

# Run Playwright tests on the specific projects using root-level playwright.config.js
echo "*** Running tests on specific projects ***"
echo "Using project: $PROJECT"
npx playwright test --config=./playwright.config.js ${TAGS} ${EXCLUDE_TAGS} --project=${PROJECT} ${REPORTER} || EXIT_STATUS=$?

# Check if tests passed or failed
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Some tests failed. Exiting with error."
  exit $EXIT_STATUS
else
  echo "All tests passed successfully."
fi
