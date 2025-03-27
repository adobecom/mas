# #!/bin/bash

TAGS="@monitor"
REPORTER=""

# Retrieve GitHub reporter parameter if not empty
# Otherwise, use reporter settings in playwright.config.js
REPORTER=$reporter
[[ ! -z "$REPORTER" ]] && REPORTER="--reporter $REPORTER"

# Remove the first pipe from tags if tags are not empty
[[ ! -z "$TAGS" ]] && TAGS="${TAGS:1}" && TAGS="-g $TAGS"

echo "*** Running tests on specific projects ***"
echo "Run Command : npx playwright test ${TAGS} ${REPORTER}"
echo -e "\n"

# Run Playwright tests using root-level playwright.config.js
echo "*******************************"
npx playwright test ${TAGS} --config=./playwright.config.js --project=mas-live-chromium ${REPORTER} || EXIT_STATUS=$?

# Check if tests passed or failed
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Some tests failed. Exiting with error."
  exit $EXIT_STATUS
else
  echo "All tests passed successfully."
fi
