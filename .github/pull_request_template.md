Resolves https://jira.corp.adobe.com/browse/MWPW-NUMBER
QA Checklist: https://wiki.corp.adobe.com/display/adobedotcom/M@S+Engineering+QA+Use+Cases

Please do the steps below before submitting your PR for a code review or QA

- [ ] C1. Cover code with Unit Tests
- [ ] C2. Add a Nala test (double check with #fishbags if nala test is needed)
- [ ] C3. Verify all Checks are green (unit tests, nala tests)
- [ ] C4. PR description contains working Test Page link where the feature can be tested
- [ ] C5: you are ready to do a demo from Test Page in PR (bonus: write a working demo script that you'll use on Thursday, you can eventually put in your PR)
- [ ] C.6 read your Jira one more time to validate that you've addressed all AC's and nothing is missing

## 🧪 Nala E2E Tests

Nala tests run automatically when you **open this PR**.

### To run Nala tests again:
1. Add the `run nala` label to this PR (in the right sidebar)
2. Tests will run automatically on the current commit
3. Any future commits will also trigger tests **as long as the label remains**

### To stop automatic Nala tests:
- Remove the `run nala` label

> **Note**: Tests only run on commits if the `run nala` label is present. Add the label whenever you need tests to run on new changes.

## Test URLs:

- Before: https://main--mas--adobecom.aem.live/
- After: https://mwpw-NUMBER--mas--adobecom.aem.live/