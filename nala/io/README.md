# IO Automation Tests

This directory contains automated tests for the IO project using Playwright.

## Test Types

The test suite includes two types of tests:

- **Health Check** (`@health`): Verifies the health check endpoint is responding correctly
- **E2E Tests** (`@E2E`): End-to-end tests verifying the UI functionality

## Running Tests Locally

### Prerequisites

- Node.js installed
- Navigate to the correct directory:
    ```bash
    cd nala/io
    ```

### Environment Variables

Set the following environment variables before running tests:

````bash
# For Unix/Mac:
 export TEST_URL=https://stage--milo--adobecom.hlx.live/libs/features/mas/docs/ccd.html?mas-io-url=https://14257-merchatscale-Stage.adobeioruntime.net/api/v1/web/MerchAtScale
 export HEALTH_CHECK_URL=https://14257-merchatscale-Stage.adobeioruntime.net/api/v1/web/MerchAtScale/health-check

### Running Tests

1. Run Health Check Test Only:
```bash
npx playwright test ioAutomation.js --grep "@health" --config=playwright.config.js
````

2. Run E2E Tests Only:

```bash
npx playwright test ioAutomation.js --grep "@e2e" --config=playwright.config.js
```

3. Run E2E Tests with French Locale:

```bash
TEST_URL="${TEST_URL}&locale=fr_FR" npx playwright test ioAutomation.js --grep "@e2e" --config=playwright.config.js
```

## CI/CD Integration

The tests are integrated into the GitHub Actions workflow (`.github/workflows/io-tests.yaml`). In the CI environment:

1. Health check runs first
2. If health check passes, E2E tests run for both default and French locales
3. Tests run automatically on pull requests and pushes to main branch

## Test Structure

- `ioAutomation.js`: Contains both health check and E2E tests
    - Tests marked with `@health` tag verify the health check endpoint
    - Tests marked with `@e2e` tag verify UI functionality
