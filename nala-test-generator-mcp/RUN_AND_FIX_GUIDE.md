# Run and Fix Card Tests - Complete Guide

The `run-and-fix-card-tests` MCP tool provides intelligent test execution with automatic error fixing for NALA tests.

## Overview

This tool combines test validation, error fixing, and test execution into a single workflow that can:
- Validate generated test files
- Automatically fix common errors
- Run tests with proper configuration
- Support different studio branches and milolibs versions
- Provide detailed reporting of all operations

## Parameters

### Required Parameters
- **`cardId`** (string): The ID of the merch card to test
- **`cardType`** (enum): Type of card (catalog, fries, plans, etc.)
- **`testType`** (enum): Type of test to run (css, edit, save, discard)

### Optional Parameters
- **`branch`** (string, default: "main"): Studio branch name
- **`milolibs`** (string): Milolibs branch (e.g., "MWPW-170520") or "local" for localhost testing
- **`headless`** (boolean, default: true): Run browser in headless mode
- **`browser`** (enum, default: "chromium"): Browser to use (chromium, firefox, webkit)
- **`timeout`** (number, default: 30000): Test timeout in milliseconds
- **`autoFix`** (boolean, default: true): Automatically fix detected errors
- **`maxFixAttempts`** (number, default: 3): Maximum number of fix attempts
- **`dryRun`** (boolean, default: false): Preview fixes without applying them
- **`backupOriginal`** (boolean, default: true): Create backup of original files

## Usage Examples

### Basic Usage
```bash
# Basic command to run and fix tests
run-and-fix-card-tests --cardId "your-card-id" --cardType "fries" --testType "css"

# With studio branch and milolibs
run-and-fix-card-tests --cardId "your-card-id" --cardType "fries" --testType "css" --branch "main" --milolibs "MWPW-170520"

# For localhost testing
run-and-fix-card-tests --cardId "your-card-id" --cardType "fries" --testType "css" --milolibs "local"
```

### Dry Run Mode (Preview Only)
```json
{
  "cardId": "indesign-card-789",
  "cardType": "plans",
  "testType": "save",
  "dryRun": true,
  "autoFix": true
}
```

### Disable Auto-Fix
```json
{
  "cardId": "acrobat-card-101",
  "cardType": "special-offers",
  "testType": "discard",
  "autoFix": false
}
```

### Custom Browser and Timeout
```json
{
  "cardId": "creative-cloud-card",
  "cardType": "promoted-plans",
  "testType": "css",
  "browser": "firefox",
  "headless": false,
  "timeout": 60000
}
```

## Error Types Automatically Fixed

### Import Errors
- Missing `expect` import from `@playwright/test`
- Missing `test` import from `@playwright/test`
- Missing `StudioPage` import
- Missing `WebUtil` import

### Test Structure Errors
- Missing `test.describe` blocks
- Non-async test functions
- Missing `test.beforeEach` setup
- Missing `test.afterEach` cleanup

### Page Object Errors
- Missing default class export
- Missing `constructor(page)` method
- Incorrect class naming

### Spec File Errors
- Missing default export
- Missing `FeatureName` property
- Missing `features` array

### Syntax Errors
- Missing semicolons
- Unclosed brackets and parentheses
- Basic JavaScript syntax issues

## Workflow Process

1. **Initial Validation**: Checks if all required test files exist and are valid
2. **Error Detection**: Identifies specific errors in each file type
3. **Automatic Fixing**: Applies fixes for known error patterns
4. **Re-validation**: Validates files after fixes are applied
5. **Test Execution**: Runs the actual tests if validation passes
6. **Reporting**: Provides detailed report of all operations

## Output Report

The tool provides a comprehensive report including:

### Attempt Details
- File validation status
- Errors found and fixed
- Remaining errors after fixes

### Test Execution Results
- Test pass/fail status
- Execution duration
- Browser and configuration details
- Test output and error messages

### Summary
- Total duration
- Number of attempts made
- Total fixes applied
- Final success/failure status

## Best Practices

### When to Use Dry Run
- First time testing a new card
- Checking what errors would be fixed
- Validating the tool's behavior
- When you want to review fixes before applying

### Branch Management
- Use `main` for stable testing
- Specify feature branches when testing new functionality
- Include `milolibs` when testing with specific library versions

### Error Handling
- Start with `autoFix: true` to let the tool handle common issues
- Use `maxFixAttempts: 3` for most cases (default)
- Increase attempts for complex error scenarios
- Disable auto-fix when you want to handle errors manually

### File Backup
- Keep `backupOriginal: true` (default) for safety
- Backups are created with timestamp: `filename.backup.1234567890`
- Only created on the first fix attempt to avoid clutter

## Troubleshooting

### Common Issues

**Tool times out**
- Increase `timeout` parameter
- Check if test files exist and are accessible
- Verify card type and test type are valid

**Fixes not applied**
- Check if `dryRun` is set to `false`
- Verify file permissions
- Ensure the error patterns match actual errors

**Tests still fail after fixes**
- Some errors require manual intervention
- Check the remaining errors in the report
- Consider the specific test environment requirements

**Authentication errors**
- Set `IMS_EMAIL` and `IMS_PASS` environment variables
- Use dry run mode if authentication is not available
- Check with team for proper test credentials

### Getting Help

1. Check the detailed error report for specific issues
2. Use dry run mode to understand what would be fixed
3. Review the backup files if fixes caused issues
4. Consult the main documentation for general NALA test setup

## Integration with Other Tools

This tool works well with other MCP tools:

1. **`auto-extract-card-properties`** - Extract card data first
2. **`generate-complete-test-suite`** - Generate test files
3. **`run-and-fix-card-tests`** - Validate, fix, and run tests
4. **`validate-generated-tests`** - Additional validation if needed

## Example Workflow

```bash
# 1. Extract card properties
auto-extract-card-properties: { "cardId": "my-card", "branch": "main" }

# 2. Generate complete test suite  
generate-complete-test-suite: { "cardId": "my-card", "cardType": "fries", "testTypes": ["css", "edit"] }

# 3. Run and fix tests
run-and-fix-card-tests: { "cardId": "my-card", "cardType": "fries", "testType": "css" }
run-and-fix-card-tests: { "cardId": "my-card", "cardType": "fries", "testType": "edit" }
```

This provides a complete end-to-end workflow for NALA test generation and execution.

## Localhost Testing

To test cards on localhost, use the `milolibs` parameter with value `'local'`:

```bash
run-and-fix-card-tests --cardId "26f091c2-995d-4a96-a193-d62f6c73af2f" --cardType "fries" --testType "css" --milolibs "local"
```

This will:
1. Configure tests to use `http://localhost:3000` as the base URL
2. Set the correct URL structure: `/studio.html?milolibs=local#page=content&path=nala&query=<cardid>`
3. Generate a manual run command that sets `LOCAL_TEST_LIVE_URL`

### Manual Localhost Test Execution

After generating tests for localhost, you can run them manually:

```bash
LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test nala/studio/commerce/fries/tests/fries_css.test.js --project=mas-live-chromium --headed
```

## Common Fixes Applied

The tool can automatically fix these common issues:

### 1. Missing Imports
- Adds missing `@playwright/test` imports
- Adds missing page object imports
- Adds missing utility imports

### 2. Structural Issues
- Adds missing `test.describe` blocks
- Fixes async test declarations
- Adds proper beforeEach/afterEach hooks

### 3. Syntax Errors
- Fixes missing semicolons
- Fixes unclosed brackets
- Fixes unexpected tokens

### 4. Page Object Issues
- Adds missing default exports
- Fixes constructor signatures
- Adds required properties

## Example Workflows

### 1. Generate and Test New Card

```bash
# Generate tests for a new card and run them
run-and-fix-card-tests --cardId "new-card-id" --cardType "catalog" --testType "css"
```

### 2. Fix Existing Failing Tests

```bash
# Run with auto-fix enabled (default)
run-and-fix-card-tests --cardId "existing-card-id" --cardType "plans" --testType "edit"
```

### 3. Preview Fixes Without Applying

```bash
# Dry run to see what would be fixed
run-and-fix-card-tests --cardId "card-id" --cardType "fries" --testType "save" --dryRun
```

### 4. Localhost Development Testing

```bash
# Test a card on localhost with local milolibs
run-and-fix-card-tests --cardId "26f091c2-995d-4a96-a193-d62f6c73af2f" --cardType "fries" --testType "css" --milolibs "local" --headed
```

### 5. Test with Specific Branch

```bash
# Test with specific studio branch and milolibs
run-and-fix-card-tests --cardId "card-id" --cardType "special-offers" --testType "discard" --branch "feature-branch" --milolibs "MWPW-170520"
```

## Report Output

The tool generates a comprehensive report including:

1. **Summary** - Card details, test type, and configuration
2. **Generated Files** (if tests were created)
3. **Validation Results** - Errors found and warnings
4. **Fix Attempts** - Details of each fix attempt
5. **Test Execution** - Results, duration, and output
6. **Final Status** - Success or failure with actionable next steps

## Error Handling

If tests continue to fail after all fix attempts:

1. Review the detailed error messages in the report
2. Check for card-specific issues not covered by auto-fix
3. Manually inspect the generated files
4. Consider running with `--dryRun` to preview fixes
5. Use backup files to restore original state if needed

## Best Practices

1. **Start with CSS tests** - They're the simplest and most likely to succeed
2. **Use dry run first** - Preview fixes before applying them
3. **Keep backups enabled** - Allows easy rollback if needed
4. **Run headed mode** - Use `--headed` to visually debug failing tests
5. **Check localhost setup** - Ensure your local server is running when testing with `milolibs="local"`

## Troubleshooting

### Tests fail on localhost
- Ensure localhost:3000 is running
- Verify the card exists with the given ID
- Check authentication is set up for localhost

### Auto-fix doesn't resolve all errors
- Some errors require manual intervention
- Check for custom card configurations
- Review the specific error messages

### Tests pass locally but fail in CI
- Check for environment-specific issues
- Verify branch and milolibs settings
- Ensure authentication is properly configured 