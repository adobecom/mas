# NALA Cloned Cards Cleanup System

This system automatically cleans up cloned cards created during NALA tests to prevent them from persisting in AEM after test failures.

## Overview

When NALA tests clone cards for testing purposes, they should be cleaned up after the test completes. However, if tests fail, these cloned cards can remain in AEM. This cleanup system addresses that issue through multiple mechanisms.

## Components

### 1. Global Teardown (`global.teardown.js`)
- Automatically runs after all Playwright tests complete
- Configured in `playwright.config.js`
- Cleans up cards created by the automation user in the last 1-2 days

### 2. GitHub Workflow Integration
- Added to both `run-nala.yml` and `nala-daily.yml` workflows
- Runs cleanup step with `if: always()` to ensure it executes even if tests fail
- Uses the same cleanup logic as global teardown

### 3. Standalone Cleanup Utility (`cleanup-cloned-cards.js`)
- Can be run manually or scheduled independently
- Supports dry-run mode to preview what would be deleted
- Configurable options for days back, verbosity, etc.

## Usage

### Automatic Cleanup
The cleanup runs automatically:
- After every test suite completion (via global teardown)
- After every GitHub workflow run (via workflow steps)
- Daily via the scheduled NALA workflow

### Manual Cleanup

#### Basic cleanup:
```bash
node nala/utils/cleanup-cloned-cards.js
```

#### Dry run (preview only):
```bash
node nala/utils/cleanup-cloned-cards.js --dry-run
```

#### Cleanup with verbose output:
```bash
node nala/utils/cleanup-cloned-cards.js --verbose
```

#### Cleanup cards from last 7 days:
```bash
node nala/utils/cleanup-cloned-cards.js --days 7
```

#### Cleanup with custom URL:
```bash
node nala/utils/cleanup-cloned-cards.js --url https://stage--mas--adobecom.aem.live
```

#### Get help:
```bash
node nala/utils/cleanup-cloned-cards.js --help
```

## How It Works

The cleanup system:

1. **Identifies Target Cards**: Finds `aem-fragment` elements created by `cod23684+masautomation@adobetest.com`
2. **Date Filtering**: Only targets cards created within the specified time range (default: last 2 days)
3. **Safe Deletion**: Uses the same `repo.aem.deleteFragment()` method that the tests use
4. **Error Handling**: Gracefully handles failures and provides detailed logging

## Original Cleanup Script

The implementation is based on this original script:
```javascript
repo = document.querySelector('mas-repository');
cache = document.createElement('aem-fragment').cache;
[...document.querySelectorAll('aem-fragment')]
    .map((fragment) => cache.get(fragment.data.id))
    .filter(
        (fragment) =>
            /2025-03-21/.test(fragment.created.at) &&
            fragment.created.by === 'cod23684+masautomation@adobetest.com',
    )
    .map((fragment) => repo.aem.deleteFragment(fragment));
```

## Configuration

### Environment Variables
- `PR_BRANCH_LIVE_URL`: Target URL for PR branch testing
- `LOCAL_TEST_LIVE_URL`: Target URL for local testing
- `IMS_EMAIL`: Authentication email (for GitHub workflows)
- `IMS_PASS`: Authentication password (for GitHub workflows)

### Authentication
The cleanup system uses the same authentication as the tests:
- Local: Uses stored auth state in `nala/.auth/user.json`
- CI/CD: Uses `IMS_EMAIL` and `IMS_PASS` environment variables

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Ensure `nala/.auth/user.json` exists and is valid
   - For CI/CD, verify `IMS_EMAIL` and `IMS_PASS` secrets are set

2. **No Cards Found**
   - Check if the automation user email is correct
   - Verify the date range includes when cards were created
   - Use `--verbose` flag for detailed logging

3. **Cleanup Failures**
   - Check network connectivity to the target URL
   - Verify the MAS Studio page loads correctly
   - Ensure the `mas-repository` element is present

### Debugging

Use the standalone utility with verbose output:
```bash
node nala/utils/cleanup-cloned-cards.js --dry-run --verbose
```

This will show:
- What cards would be deleted
- Detailed browser console output
- Any errors encountered

## Maintenance

### Updating the Automation User
If the automation user email changes, update it in:
- `nala/utils/global.teardown.js`
- `nala/utils/cleanup-cloned-cards.js`

### Adjusting Time Ranges
The default cleanup looks back 2 days. To change this:
- For global teardown: modify the date logic in `global.teardown.js`
- For manual cleanup: use the `--days` parameter

### Adding New Workflows
To add cleanup to new GitHub workflows:
1. Add the cleanup step after the test execution
2. Use `if: always()` to ensure it runs even on failure
3. Include the necessary environment variables

## Security Considerations

- The cleanup only targets cards created by the specific automation user
- Date filtering prevents accidental deletion of older cards
- Dry-run mode allows safe testing of cleanup logic
- Authentication is required to perform deletions 