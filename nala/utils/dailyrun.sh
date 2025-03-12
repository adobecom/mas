# #!/bin/bash

REPORTER=""

# Retrieve GitHub reporter parameter if not empty
# Otherwise, use reporter settings in playwright.config.js
REPORTER=$reporter
[[ ! -z "$REPORTER" ]] && REPORTER="--reporter $REPORTER"

# echo "Run Command : npx playwright test ${TAGS} ${EXCLUDE_TAGS} ${REPORTER}"
# echo -e "\n"
# echo "*******************************"

echo "*** Installing playwright dependencies ***"
# Navigate to the GitHub Action path and install dependencies
cd "$GITHUB_ACTION_PATH" || exit
npm ci
npx playwright install --with-deps

# Run Playwright tests using root-level playwright.config.js
echo "*** Running tests on specific projects ***"
npx playwright test --config=./playwright.config.js --project=mas-live-chromium ${REPORTER} || EXIT_STATUS=$?

# Check if tests passed or failed
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Some tests failed. Exiting with error."
  exit $EXIT_STATUS
else
  echo "All tests passed successfully."
fi
