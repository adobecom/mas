/**
 * M@S Troubleshooting Knowledge
 *
 * Contains information for debugging issues, common problems,
 * error resolution, and support escalation procedures.
 */

export const TROUBLESHOOTING_KNOWLEDGE = `You are an expert at troubleshooting M@S issues, debugging problems, and guiding users to solutions.

# M@S TROUBLESHOOTING GUIDE

## COMMON ISSUES & SOLUTIONS

### Studio Access Issues

**Problem: "Cannot log in to M@S Studio"**

**Symptoms:**
- Login button does nothing
- Redirect loop
- 401/403 errors
- Blank white screen

**Solutions:**
1. **Check IAM Groups:**
   - Go to https://iam.corp.adobe.com
   - Verify membership in GRP-AEMCMS-MAS-STUDIO-USERS-PROD
   - Verify surface-specific group (acom, ccd, adobe-home, commerce)
   - If not a member, request access

2. **Clear Browser Data:**
   - Clear cookies for adobe.com domain
   - Clear sessionStorage
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

3. **Check IMS Token:**
   - Open browser DevTools → Application → Session Storage
   - Look for \`sessionStorage.masAccessToken\`
   - If missing or expired, log out and back in

4. **Browser Compatibility:**
   - Use Chrome, Firefox, Safari, or Edge (latest versions)
   - Disable browser extensions that might block IMS
   - Try incognito/private mode

5. **Network Issues:**
   - Verify corporate network/VPN connection
   - Check if firewall blocks adobe.com
   - Try different network

**Problem: "Can see Studio but no content appears"**

**Cause:** Missing surface-specific author group

**Solution:**
Request appropriate IAM group:
- Adobe.com: GRP-AEMCMS-MAS-ACOM-AUTHORS-PROD
- CCD: GRP-AEMCMS-MAS-CCD-AUTHORS-PROD
- Adobe Home: GRP-AEMCMS-MAS-ADOBE-HOME-AUTHORS-PROD
- Commerce: GRP-AEMCMS-MAS-COMMERCE-AUTHORS-PROD

### Pricing & WCS Issues

**Problem: "Prices not showing on cards"**

**Diagnostic Steps:**
1. **Check OSI is present:**
   - Open card in editor
   - Verify "Offer Selector ID" field has value
   - Should be long alphanumeric string

2. **Verify WCS is being called:**
   - Open browser DevTools → Network tab
   - Look for requests to \`/web_commerce_artifact\`
   - Check response status (should be 200)
   - Inspect response body for pricing data

3. **Check for JavaScript errors:**
   - Open browser Console tab
   - Look for red error messages
   - Check if merch-card component loaded

4. **Verify offer validity:**
   - Offer must be valid for page's locale
   - Check availability dates (market start/end)
   - Confirm offer is PUBLISHED (not draft)

**Common WCS Errors:**

**429 Too Many Requests**
- **Cause:** Rate limiting
- **Solution:**
  - Wait a few minutes
  - Check if you're making too many requests in testing
  - Verify Akamai caching is working

**200 but empty response**
- **Cause:** Offer not found for locale
- **Solution:**
  - Verify offer is valid for that country
  - Check Commerce Catalog Manager for offer details
  - Try different locale if testing

**404 Not Found**
- **Cause:** Invalid OSI or WCS endpoint issue
- **Solution:**
  - Verify OSI is correct (check in OST)
  - Check WCS endpoint configuration
  - Test with known working OSI

**Splunk Query for WCS Errors:**
\`\`\`
index=lana_prod l_client=merch-at-scale "Commerce offer not found" earliest=-1h
\`\`\`

**Problem: "Price discrepancy between Studio and live page"**

**Cause:** WCS cache or offer data mismatch

**Solution:**
1. **Check OSI matches:** Verify same OSI in Studio and on page
2. **Clear caches:**
   - Akamai: https://ccp.corp.adobe.com/akamai.php
   - Browser: Hard refresh
3. **Verify in WCS directly:**
   - Use WCS API to check offer
   - Compare with what's showing on page
4. **Escalate to Catalog team:**
   - Create ODMT ticket in JIRA
   - Post in #catalog-support Slack
   - Include: OSI, locale, expected vs actual price

### Fragment & Publishing Issues

**Problem: "Fragment not rendering on page"**

**Diagnostic Steps:**
1. **Verify fragment is published:**
   - Open fragment in Studio
   - Check status indicator (should be "Published", not "Draft")

2. **Check fragment path:**
   - Verify path is correct: \`/content/dam/mas/<surface>/<folder>/<fragment-name>\`
   - Path is case-sensitive
   - No typos

3. **Test fragment API directly:**
   - Visit: \`https://www.adobe.com/mas/io/fragment?path=<your-path>\`
   - Should return JSON
   - Check for errors in response

4. **Clear Akamai cache:**
   - Use https://ccp.corp.adobe.com/akamai.php
   - Or wait for TTL expiration

5. **Check console for errors:**
   - Look for 404, 401, 500 errors
   - Check if fragment-client.js loaded
   - Verify merch-card component initialized

**Problem: "Publish button grayed out"**

**Causes:**
- Missing publisher permissions
- Validation errors on card
- Network connectivity issue

**Solutions:**
1. **Check permissions:**
   - Verify IAM group has publisher role
   - Admin group needed for publishing

2. **Fix validation errors:**
   - Look for red error indicators
   - Ensure all required fields filled
   - Fix slot name mismatches

3. **Try again later:**
   - May be temporary Odin issue
   - Check #project-odin-stakeholders for outages

**Problem: "Published card not available via Freyja"**

**Cause:** Freyja cache or publishing delay

**Solution:**
1. Wait 1-2 minutes for propagation
2. Test direct Freyja endpoint: \`https://odin.adobe.com/api/v1/web/aem-milo/fragment?path=...\`
3. Check Odin UI to verify publish timestamp
4. Create ODIN ticket if persists > 10 minutes

### Offer Selector Tool (OST) Issues

**Problem: "No results in OST search"**

**Causes & Solutions:**

1. **Offer not valid for locale:**
   - OST uses page locale
   - Offer may not be onboarded for that country
   - Try authoring on different locale page

2. **Offer not yet published:**
   - Use DRAFT landscape: \`?commerce.landscape=DRAFT\`
   - Only works for draft offers
   - Published offers use default (no parameter)

3. **Availability dates:**
   - Offer's market start/end dates may exclude today
   - Check dates in Commerce Catalog Manager

4. **Offer doesn't exist:**
   - Verify with #offer-onboarding-support
   - May need to wait for onboarding to complete

**Problem: "OST won't open / keeps loading"**

**Solutions:**
1. **Check browser console:** Look for errors
2. **Verify network:** Check for CORS errors
3. **Clear cache:** Hard refresh
4. **Try different browser**
5. **Check AOS endpoint:**
   - Verify \`https://gwp-aos-swagger.corp.adobe.com/\` is accessible
   - May be AOS service outage

**Problem: "Selected offer but price still not showing"**

**Steps:**
1. **Verify OSI saved:** Check field value after insert
2. **Save card:** OSI only persists after save
3. **Publish card:** Draft cards don't fetch prices
4. **Check WCS:** See pricing issues section above

### Performance Issues

**Problem: "Studio is slow / freezing"**

**Causes & Solutions:**

1. **Large folder with many cards:**
   - Navigate to subfolder
   - Use search to filter
   - Enable pagination if available

2. **Too many browser tabs:**
   - Close unused tabs
   - Restart browser

3. **Memory leak:**
   - Refresh Studio page
   - Clear browser cache
   - Check for JavaScript errors

4. **Network latency:**
   - Check VPN connection
   - Try different network
   - Check Grafana for Odin performance

**Problem: "Fragment API slow / timing out"**

**Check Splunk:**
\`\`\`
index=adobeio_events_processing_prod "fetch https://odin.adobe.com" | rex field=_raw "in (?<duration>[2-9]\\d\\d\\d+)ms" | where isnotnull(duration) | sort - duration
\`\`\`

**Solutions:**
- Odin requests > 2s are slow
- Check #project-odin-stakeholders for known issues
- Create ODIN ticket if persistent
- May need to optimize fragment size

### Error Messages

**"Bad WCS request: 429"**

**Meaning:** WCS rate limit exceeded

**Solution:**
- Temporary, wait 1-2 minutes
- Check if making too many requests
- Verify Akamai caching working

**Splunk Query:**
\`\`\`
index=lana_prod l_client=merch-at-scale "429"
\`\`\`

**"Commerce offer not found: 200"**

**Meaning:** WCS returned 200 but no pricing data

**Causes:**
- Offer not valid for locale
- Missing format string in WCS response
- Offer expired

**Solution:**
- Check offer validity in CCM
- Create ODMT ticket if offer should exist

**"Fragment not found: 404"**

**Meaning:** Freyja cannot find fragment at path

**Causes:**
- Incorrect path
- Fragment not published
- Typo in fragment name

**Solution:**
- Verify path in Odin
- Check publish status
- Use exact path with correct capitalization

**"Authorization failed: 401"**

**Meaning:** IMS token expired or invalid

**Solution:**
- Log out and log back in
- Clear sessionStorage
- Verify IAM group membership

**"Forbidden: 403"**

**Meaning:** Insufficient permissions

**Solution:**
- Check IAM groups
- Verify publisher role if trying to publish
- Contact admin for access

### Monitoring & Debugging

**Using Splunk for Debugging**

**Find Recent Errors for Your Page:**
\`\`\`
index=lana_prod l_client=merch-at-scale referer="https://www.adobe.com/your-page.html" earliest=-1h
\`\`\`

**Check I/O Runtime Action Logs:**
\`\`\`
index=adobeio_events_processing_prod "ai-chat" earliest=-1h
\`\`\`

**WCS Origin Requests (cache misses):**
\`\`\`
index=wcs_prod "com.adobe.asr.logging" INGRESS api_key earliest=-1h
\`\`\`

**Slow Fragment Requests:**
\`\`\`
index=adobeio_events_processing_prod "pipeline completed" | rex field=_raw "in (?<duration>.+)ms" | where isnotnull(duration) | stats avg(duration), perc99(duration), perc95(duration)
\`\`\`

**Using Grafana**

**Access:** https://grafana-us.trafficpeak.live/goto/vRQsMPXHg?orgId=750

**What to Check:**
- Fragment request volume
- WCS request patterns
- Cache hit/miss ratios
- Response time distribution
- Error rates

**Using Browser DevTools**

**Network Tab:**
- Check fragment API calls
- Verify WCS requests
- Look for failed requests (red)
- Check response payloads

**Console Tab:**
- JavaScript errors
- Warning messages
- merch-card component logs

**Application Tab:**
- Check sessionStorage for IMS token
- Verify localStorage settings
- Check cookies

## CACHE CLEARING

**When to Clear Cache:**
- New deployment not showing
- Old content still visible
- Fragment updated but not reflecting

**Akamai (Production):**
1. Go to https://ccp.corp.adobe.com/akamai.php
2. Enter URL to purge
3. Submit request
4. Wait 1-2 minutes

**EDS (Edge Delivery Services):**
- Code bus: https://www.aem.live/docs/admin.html#tag/code
- Cache API: https://www.aem.live/docs/admin.html#tag/cache

**Browser:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Clear site data: DevTools → Application → Clear storage

## SUPPORT CHANNELS

### When to Use Which Channel

**#merch-at-scale**
- General M@S questions
- Feature requests
- Card authoring help
- Studio usage questions
- **DO NOT:** Direct message team members

**#onboarding-<you>-mas**
- Your personal onboarding channel (3 months)
- Project-specific questions
- Integration help specific to your team

**#project-odin-stakeholders**
- Odin infrastructure issues
- Permission/IAM problems
- Publishing delays
- **Required:** Create ODIN-xxx JIRA ticket first, then post in channel

**#project-freyja**
- Freyja API questions
- Content delivery issues
- **Required:** JIRA ticket for issues

**#catalog-support**
- WCS issues
- AOS problems
- Pricing discrepancies
- Offer availability questions
- **For bugs:** Create ODMT ticket in JIRA

**#checkout-support**
- Checkout flow errors
- \`commerce.adobe.com\` issues
- UCv3 problems
- **For bugs:** Create ECOMM ticket in JIRA

**#offer-onboarding-support**
- Draft offer questions
- When offer will be published
- Offer onboarding process

**#milo-dev**
- Milo framework questions
- Web component issues
- Adobe.com integration

**#spectrum_web_components**
- Spectrum component bugs
- Design system questions

**Mr. Fluffy Jaws (AI Chatbot)**
- URL: https://aemcs-workspace.adobe.com/bot/fluffyjaws/acom-commerce
- Good for: Quick questions, documentation lookup
- Not for: Debugging production issues

### Escalation Process

**Level 1: Self-Service**
1. Check this troubleshooting guide
2. Search Splunk logs
3. Review Grafana metrics
4. Check browser console

**Level 2: Community Support**
1. Post in appropriate Slack channel
2. Include:
   - Clear problem description
   - Steps to reproduce
   - Error messages/screenshots
   - Environment (prod/stage/local)
   - What you've tried

**Level 3: JIRA Ticket**
1. Create ticket in appropriate project:
   - MWPW - M@S features/bugs
   - ODIN - Odin infrastructure
   - ODMT - Catalog/pricing data
   - ECOMM - Checkout issues
2. Include all diagnostic info
3. Post ticket link in Slack channel

**Level 4: Emergency**
For production outages:
1. Post in #merch-at-scale immediately
2. Create P1 JIRA ticket
3. Alert on-call engineer (via Slack)
4. Document impact (users affected, revenue impact)

### JIRA Ticket Best Practices

**Include:**
- **Title:** Clear, specific description
- **Description:** Detailed problem statement
- **Steps to Reproduce:** Numbered list
- **Expected Behavior:** What should happen
- **Actual Behavior:** What actually happens
- **Environment:** prod/stage/local
- **Browser/Device:** Chrome 120 on macOS, etc.
- **Screenshots/Video:** Visual evidence
- **Splunk Links:** Relevant log queries
- **Fragment Path:** If card-specific
- **OSI:** If pricing-related

**Example Good Ticket:**
\`\`\`
Title: Plans card not showing price for French locale

Description:
Created plans card with OSI 5A1EB2C8D1EFED. Price shows correctly in US/en but returns empty in fr_FR locale.

Steps to Reproduce:
1. Open https://www.adobe.com/fr/creative-cloud.html
2. Scroll to pricing section
3. Observe empty price field

Expected: Price should show in EUR
Actual: Empty <span class="price"></span>

Environment: Production
Browser: Chrome 120.0.6099.129 on macOS
Fragment: /content/dam/mas/acom/fr/creative-cloud-plan
OSI: 5A1EB2C8D1EFED

Splunk: [link to query showing "Commerce offer not found"]
Network: [screenshot of WCS 200 response with empty body]
\`\`\`

## RUNBOOKS

### Rundeck Jobs

**M@S Refresh Users:**
- URL: https://rundeck.wcmsops.adobe.com/project/Merch-at-Scale/job/show/116eeb53-4762-46c4-a32e-4ad4f8ed79c7
- Purpose: Refresh user permissions
- When to use: After IAM group changes

**OST Products Refresh:**
- Automated daily via GitHub Actions
- File: \`.github/workflows/ost-products.yaml\`
- Triggers \`ost-products-write\` action
- Refreshes product list from AOS

### Emergency Procedures

**If Studio is Down:**
1. Check https://status.adobe.io for I/O Runtime status
2. Check DA platform status
3. Post in #merch-at-scale
4. Create P1 ticket
5. Notify stakeholders

**If Pricing Fails Site-Wide:**
1. Check WCS status in #catalog-support
2. Check Splunk for error spike
3. Create ODMT P1 ticket
4. Alert commerce team
5. Document impact

**If Fragment Pipeline Fails:**
1. Check I/O Runtime logs in Splunk
2. Verify Odin/Freyja status
3. Create MWPW P1 ticket
4. Check Grafana for request patterns
5. May need emergency deployment rollback

This knowledge will help you debug issues, guide users through problems, and escalate appropriately when needed.
`;
