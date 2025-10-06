/**
 * M@S Developer Knowledge
 *
 * Contains information for developers working on M@S:
 * setup, repositories, testing, deployment, and development workflows.
 */

export const DEVELOPER_KNOWLEDGE = `You are an expert on M@S development, setup, testing, and deployment processes.

# M@S DEVELOPER DOCUMENTATION

## CODE REPOSITORIES

### Main Repositories

**1. MAS Repository** (M@S Studio)
- **GitHub:** https://github.com/adobecom/mas
- **Purpose:** M@S Studio UI and Adobe I/O Runtime backend actions
- **Technology:** Lit web components, Node.js 22+
- **Key Directories:**
  - \`studio/\` - Studio frontend (Lit components)
  - \`io/www/\` - Fragment delivery pipeline (I/O Runtime)
  - \`io/studio/\` - Studio backend actions (OST, AI Chat)
  - \`nala/\` - Automated tests

**2. Milo Repository** (M@S Web Components)
- **GitHub:** https://github.com/adobecom/milo
- **Purpose:** Adobe.com framework + M@S web components
- **Location:** \`/libs/features/mas/\`
- **IMPORTANT:** Web components code is in Milo, NOT in the mas repo! The \`web-components/\` folder in mas repo is outdated.
- **Actual Path:** \`/Users/axelcurenobasurto/Web/milo/libs/features/mas\`

**3. Offer Selector Tool (OST)**
- **GitHub:** https://git.corp.adobe.com/wcms/tacocat.js (internal repo)
- **Purpose:** JavaScript library for offer selection

## DEVELOPER ONBOARDING

### Initial Setup

**1. Request Access:**
- **Slack Channels:**
  - Join #merch-at-scale (main channel)
  - You'll get #onboarding-<yourname>-mas for 3 months
- **IAM Groups:** Request via https://iam.corp.adobe.com
  - GRP-WCMS-COMMERCE-DEV (developer access)
  - GRP-AEMCMS-MAS-STUDIO-USERS-PROD (Studio access)
- **Figma:** Request GRP-AD-FIGMA-VIEWERRESTRICTED for design access
- **Adobe I/O Runtime:** Ask in #milo-dev for workspace setup

**2. Clone Repositories:**
\`\`\`bash
# Main M@S repo
git clone https://github.com/adobecom/mas.git
cd mas
npm install

# Milo repo (for web components)
git clone https://github.com/adobecom/milo.git
cd milo
npm install
\`\`\`

**3. Environment Setup:**

For **mas** repo:
\`\`\`bash
cd studio
npm install
npm run proxy  # Starts proxy to AEM on port 8080
\`\`\`

For **io/studio** actions:
\`\`\`bash
cd io/studio
npm install -g @adobe/aio-cli
aio app use <workspace-config.json>  # Downloads auth from Developer Console
\`\`\`

**4. Local Development:**

**Studio:**
\`\`\`bash
npm run studio  # Starts both proxy and studio
# Or separately:
npm run proxy   # AEM proxy on localhost:8080
# Open studio/index.html in browser
\`\`\`

**I/O Runtime Actions:**
\`\`\`bash
cd io/studio
aio app dev  # Starts local dev server on localhost:9080
\`\`\`

### Branch Strategy

**Feature Branches:**
- Name format: \`mwpw-<ticket-number>\` (e.g., \`mwpw-159269\`)
- **Auto IMS Enabled:** Branches with this format automatically get IMS enabled
- **Branch URLs:** https://mwpw-159269--mas--adobecom.hlx.live/

**Git Worktrees (Recommended):**
Use git worktrees to work on multiple features simultaneously without switching branches:
\`\`\`bash
git worktree add ../mas-feature-branch mwpw-12345
cd ../mas-feature-branch
npm install
\`\`\`

**Main Branch:** \`main\` (use for PRs)

## TESTING

### NALA Tests (End-to-End)

**Location:** \`nala/studio/\` directory in mas repo

**Running Tests:**
\`\`\`bash
# Prerequisites: Ensure AEM server is running
aem up

# Run all Studio tests
LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test nala/studio/ --reporter=list --timeout=60000

# Run specific test
LOCAL_TEST_LIVE_URL="http://localhost:3000" npx playwright test nala/studio/acom/plans/individuals/tests/individuals_edit.test.js --grep "@studio-plans-individuals-edit-title" --reporter=list --timeout=60000

# Run with local Milo libs
LOCAL_TEST_LIVE_URL="http://localhost:3000" MILO_LIBS="&milolibs=local" npx playwright test nala/studio/ --reporter=list --timeout=60000
\`\`\`

**Test Organization:**
Tests are organized by surface and operation:
- \`nala/studio/acom/\` - Adobe.com cards
- \`nala/studio/ccd/\` - CCD cards
- \`nala/studio/commerce/\` - Commerce cards
- \`nala/studio/mnemonic-modal/\` - Mnemonic modal tests
- \`nala/studio/folder-copy/\` - Folder operations

**Writing Tests:**
Use nala-mcp for automated test generation and fixes:
- Auto-generates test files from card properties
- Fixes failing tests automatically
- Generates complete test suites

**Test Assets:**
Gallery pages for visual verification:
- CCD: https://main--milo--adobecom.hlx.page/libs/features/mas/docs/ccd.html
- Adobe Home: https://main--milo--adobecom.hlx.page/libs/features/mas/docs/adobe-home.html
- Plans: https://main--milo--adobecom.hlx.page/libs/features/mas/docs/plans.html
- Commerce: https://main--milo--adobecom.hlx.page/libs/features/mas/docs/commerce.html

### Unit Tests

**Studio Tests:**
\`\`\`bash
cd studio
npm test           # Run with coverage
npm run test:watch # Watch mode
\`\`\`

**I/O Runtime Tests:**
\`\`\`bash
cd io/www
npm test  # 99% coverage required

cd io/studio
npm test
\`\`\`

### Linting

**Run Linter:**
\`\`\`bash
# From project root (mas/)
npm run lint       # Check all workspaces
npm run lint:fix   # Auto-fix issues

# Studio only
cd studio
npm run lint
\`\`\`

**Linter Rules:**
- Never use underscore-prefixed variables
- No inline comments unless asked
- No setTimeout suggestions unless necessary
- No mutationObserver suggestions unless asked
- Run linter after every code change (per CLAUDE.md)

## DEPLOYMENT

### Deploying Adobe I/O Runtime Actions

**IMPORTANT:** Always deploy specific actions, not all at once!

\`\`\`bash
cd io/studio

# Test before deploying
npm test

# Deploy specific action
aio app deploy -a ai-chat
aio app deploy -a ost-products-read

# Force re-deploy if needed
aio app deploy --force-deploy --no-publish -a <action-name>

# Check deployed actions
aio app list
\`\`\`

**Common Actions:**
- \`ai-chat\` - AI Creator backend
- \`ost-products-read\` - OST product list reader
- \`ost-products-write\` - OST product list updater (runs via GitHub Actions)
- \`fragment\` (in io/www) - Fragment delivery pipeline

### GitHub Actions / CI/CD

**OST Products Refresh:**
File: \`.github/workflows/ost-products.yaml\`
- Runs daily to refresh product list from AOS
- Triggers \`ost-products-write\` action
- Caches results for OST searches

**Nala Tests:**
- Run automatically on PRs
- Can be triggered manually

### Building Fragment Client

For **io/www** (fragment delivery):
\`\`\`bash
cd io/www
npm run build:client
# Output: ../../studio/libs/fragment-client.js
\`\`\`

This builds a browser-compatible version of the fragment pipeline.

## DEVELOPMENT WORKFLOWS

### Working with Milo Libs

**Default (Production):**
- Studio loads Milo libs from production: \`https://www.adobe.com/libs/features/mas/mas/dist/mas.js\`

**Local Development:**
Add \`milolibs=local\` parameter to URL:
- Studio URL: \`http://localhost:8080/studio.html?milolibs=local\`
- Tests: Use \`MILO_LIBS="&milolibs=local"\` environment variable

**Feature Branch:**
- \`https://mas-<branch>--milo--adobecom.hlx.live/libs/features/mas/mas/dist/mas.js\`

### Running AEM Server

**Start AEM:**
\`\`\`bash
aem up  # Starts local AEM instance
\`\`\`

**Proxy Configuration:**
When AEM is running, always run proxy from studio:
\`\`\`bash
cd studio
npm run proxy  # Required for CORS handling
\`\`\`

**Proxy Ports:**
- AEM: 8080
- Web Test Runner: 2023

### Creating New Card Variants

If a PM requests a new card layout:

1. **File JIRA Ticket:** Follow project format for new variant request
2. **Design Review:** Work with UX team on Figma designs
3. **Implement in Milo:**
   - Create variant in \`/libs/features/mas/src/variants/\`
   - Add variant to \`variants.js\`
   - Define slots, fields, and CTA styles
4. **Update M@S Studio:**
   - Add variant config to \`variant-configs.js\`
   - Add to variant picker
   - Create content model in Odin (via Odin team)
5. **Add Tests:**
   - Create Nala test suite
   - Add to gallery page
6. **Documentation:**
   - Update AI prompts with new variant structure
   - Add to kitchen sink gallery

## DEBUGGING

### Browser DevTools

**Key Locations:**
- **SessionStorage:** Check \`sessionStorage.masAccessToken\` for IMS token
- **Network Tab:** Monitor fragment API calls, WCS requests
- **Console:** merch-card component logs errors and warnings

**Common Debug Patterns:**
\`\`\`javascript
// Enable debug mode in fragment pipeline
localStorage.setItem('mas-debug', 'true');

// Check fragment data
document.querySelector('merch-card').fragment;

// Check WCS response
document.querySelector('merch-card').wcsData;
\`\`\`

### Splunk Queries

**Find Recent Errors:**
\`\`\`
index=lana_prod l_client=merch-at-scale earliest=-1h
\`\`\`

**Check I/O Runtime Logs:**
\`\`\`
index=adobeio_events_processing_prod "ai-chat" earliest=-1h
\`\`\`

**WCS Requests:**
\`\`\`
index=wcs_prod "com.adobe.asr.logging" INGRESS api_key earliest=-1h
\`\`\`

### Common Issues

**IMS Token Expired:**
- Symptom: 401 errors on API calls
- Solution: Log out and log back in

**Fragment Not Rendering:**
- Check fragment path is correct
- Verify fragment is published (not draft)
- Clear Akamai cache if needed

**WCS 429 Errors:**
- Rate limiting hit
- Check API key configuration
- Review request patterns

**Build Failures:**
- Ensure Node.js version >= 22
- Clear \`node_modules\` and reinstall
- Check for linter errors

### Cache Clearing

**Akamai (Production):**
Use: https://ccp.corp.adobe.com/akamai.php

**Edge Delivery Services:**
- Code: https://www.aem.live/docs/admin.html#tag/code
- Cache: https://www.aem.live/docs/admin.html#tag/cache

## TECHNICAL RESOURCES

**API Documentation:**
- **AEM Sites API:** https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/sites/
- **Freyja API:** https://git.corp.adobe.com/pages/lpalk/aem-sites-api-schema/
- **WCS API:** https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml
- **AOS API:** https://developers.corp.adobe.com/aos/docs/guide/overview.md

**Roadmap & Planning:**
- **Miro Roadmap:** https://miro.com/app/board/uXjVLFAukUo=/
- **Technical Diagrams:** https://miro.com/app/board/uXjVIRQ_2mk=/

**Design Assets:**
- **Figma 2025:** https://www.figma.com/files/1177024566520626109/project/106326416
- Requires GRP-AD-FIGMA-VIEWERRESTRICTED access

## COMMUNICATION

**Slack Channels:**
- **#merch-at-scale** - Main channel for all M@S questions
- **#onboarding-<you>-mas** - Your personal onboarding channel (3 months)
- **#project-freyja** - Freyja/Odin questions
- **#project-odin-stakeholders** - Odin issues (with JIRA ticket)
- **#catalog-support** - WCS, AOS, commerce catalog issues
- **#checkout-support** - Checkout page issues
- **#milo-dev** - Milo framework questions
- **#mas-ux-chat** - Design collaboration

**No DM Policy:**
M@S team enforces strict "no direct messages" policy. Always ask in channels so knowledge is shared.

**Question Protocol:**
1. Generic questions → #merch-at-scale
2. Project-specific questions → #onboarding-<you>-mas
3. Issues with dependencies → Relevant team channel + JIRA ticket
4. Never DM team members directly

## JIRA

**Projects:**
- **MWPW** - M@S work tickets
- **DOTCOM** - Adobe.com integration work
- **ODIN** - Odin infrastructure requests
- **ECOMM** - Checkout/commerce issues

**Ticket Format for New Variants:**
See #merch-at-scale for template link.

**Bug Reports:**
Include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment (prod/stage/local)
- Browser/device info
- Screenshots or video

## BEST PRACTICES

**Code Quality:**
1. Always run linter before committing
2. Write tests for new features (99% coverage for io/www)
3. No commented code unless it has important TODOs
4. Clean up dead code after refactoring (per CLAUDE.md)
5. Use absolute imports in tests

**Git Workflow:**
1. Create feature branch with \`mwpw-*\` format
2. Make atomic commits with clear messages
3. Test locally before pushing
4. Create PR to \`main\`
5. Address review comments
6. Squash merge when approved

**Testing Strategy:**
1. Unit tests for logic
2. Nala tests for workflows
3. Manual testing in Studio
4. Test in all supported browsers
5. Verify in production-like environment

**Performance:**
1. Minimize bundle size
2. Lazy load components when possible
3. Cache API responses appropriately
4. Monitor Splunk for errors
5. Check Grafana for performance metrics

This knowledge will help you set up, develop, test, and deploy M@S features.
`;
