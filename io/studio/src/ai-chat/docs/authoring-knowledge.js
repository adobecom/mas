/**
 * M@S Authoring Knowledge
 *
 * Contains information for content authors using M@S Studio:
 * how to create cards, use OST, manage permissions, and publish content.
 */

export const AUTHORING_KNOWLEDGE = `You are an expert on M@S Studio authoring workflows, permissions, and content creation.

# M@S STUDIO AUTHORING GUIDE

## ACCESSING M@S STUDIO

**Production URL:** https://mas.adobe.com/studio.html

**Login:**
1. Navigate to Studio URL
2. Click "Sign in with Adobe ID"
3. Use your Adobe corporate credentials
4. IMS will authenticate and provide access token

**Permissions Required:**
Minimum IAM group membership:
- GRP-AEMCMS-MAS-STUDIO-USERS-PROD (basic access)
- Plus surface-specific group (acom, ccd, adobe-home, or commerce)

**If You Can't Access Studio:**
1. Verify IAM group membership in https://iam.corp.adobe.com
2. Log out and log back in
3. Clear browser cache
4. Check #merch-at-scale Slack for help

## STUDIO INTERFACE OVERVIEW

### Left Navigation Panel

**Folder Tree:**
- Browse content by surface (acom, ccd, adobe-home, commerce, sandbox)
- Create new folders
- Navigate to specific content locations
- Expand/collapse folder structure

**Tabs:**
Each surface folder has tabs for different content types

**Search:**
Filter cards by name, variant, tags, or content

**Chat Button:**
Access AI Creator for natural language card creation

### Main Content Area

**Table View:**
- Lists all cards/collections in current folder
- Columns: Name, Variant, Status, Modified Date, Modified By
- Sort by any column
- Bulk selection for operations

**Render View:**
- Visual preview of cards
- See actual card appearance
- Click to edit

**Filters:**
- Filter by variant type
- Filter by status (draft/published)
- Filter by tags
- Date range filters

### Right Panel (Editor)

**Opens when you:**
- Click "Create" button
- Click existing card to edit
- Use "Open in Editor" from chat

**Editor Features:**
- Live preview of card
- Field-by-field editing
- Variant picker
- Save/Publish buttons
- Validation warnings

## CREATING CARDS

### Method 1: Visual Editor

**Steps:**
1. Navigate to desired folder
2. Click "Create" button
3. Select card type (Merch Card or Collection)
4. Choose variant (plans, fries, mini, etc.)
5. Fill in required fields:
   - Title
   - Description
   - CTAs
   - Prices (if needed)
6. Add optional fields:
   - Badge
   - Mnemonics (product icons)
   - Background images
   - Promo text
7. Click "Save" to save as draft
8. Click "Publish" to make live

**Required Fields by Variant:**
- **Plans:** title, prices, ctas
- **Fries:** title, description, ctas
- **Mini:** title, ctas
- **CCD-Slice:** description, ctas
- **Special Offers:** title, description, ctas, prices

### Method 2: AI Creator

**Steps:**
1. Click "Chat" in left navigation
2. Describe the card you want in natural language
3. AI generates properly structured card
4. Review preview and validation
5. Click "Save to AEM" or "Open in Editor"

**Example Prompts:**
- "Create a plans card for Creative Cloud All Apps"
- "Make a fries card for Photoshop with a badge"
- "Generate 3 Express cards: Free, Premium, and Teams"

**Benefits:**
- Faster than manual editing
- Learns correct variant structures
- Validates before saving
- Handles complex multi-card creation

### Method 3: Copy Existing Card

**Steps:**
1. Find card to copy in table view
2. Right-click or use context menu
3. Select "Duplicate"
4. Card copies to same folder
5. Edit copy as needed
6. Save with new name

## USING OFFER SELECTOR TOOL (OST)

### What is OST?

OST is the tool for attaching commerce offers to cards. It connects your card to WCS (Web Commerce Service) for dynamic pricing.

**Access OST:**
- In editor, find "Offer Selector ID" or "OSI" field
- Click "Select Offer" button
- OST modal opens

### Searching for Offers

**Search Methods:**
1. **Product Name:** Type "Photoshop", "Creative Cloud", etc.
2. **Offer ID:** Enter specific offer ID if known
3. **Segment:** Filter by student, individual, team, enterprise
4. **Commitment:** Monthly, annual, multi-year

**Filters:**
- **Locale:** Offer must be valid for page locale
- **Availability Dates:** Current date must be within offer's market start/end
- **Landscape:**
  - PUBLISHED (default) - Live production offers
  - DRAFT - Offers being onboarded, not yet live

**Accessing Draft Offers:**
OST opens with prod offers by default. For draft offers:
- Use URL: https://milo.adobe.com/tools/ost?commerce.landscape=DRAFT
- Or set landscape parameter in OST

**Important:** Draft offers will automatically switch to published version when released. No re-authoring needed!

### Selecting an Offer

**Steps:**
1. Search for product/offer
2. Review results:
   - Offer name
   - Pricing info
   - Valid countries
   - Availability dates
   - Draft/Published status
3. Click offer to select
4. Configure parameters (optional):
   - Disable term
   - Disable price strikethrough
   - Override seat count
5. Click "Insert"
6. OSI is added to card field

**What Happens:**
- Card stores OSI (e.g., "5A1EB2C8D1EFED...")
- When card renders, merch-card component fetches current price from WCS
- Price updates automatically if it changes in WCS

### OST Parameters

**Price Merch Link Parameters:**
These modify how pricing displays:

- **Term:** Show/hide term (e.g., "/mo", "/yr")
- **Seat:** Override default seat count
- **Strikethrough:** Show/hide strikethrough pricing
- **Tax:** Show/hide tax label

Check boxes DISABLE the parameter (they're enabled by default).

### Troubleshooting OST

**"No results found":**
- Verify offer is valid for your page's locale
- Check availability dates
- Try DRAFT landscape if offer is new
- Confirm offer exists in Commerce Catalog Manager

**"Price not showing on page":**
- Verify OSI is correctly saved in fragment
- Check WCS is returning data (browser DevTools network tab)
- Confirm merch-card component is loaded
- Check for JavaScript errors in console

**"Draft offer not showing":**
- Use \`commerce.landscape=DRAFT\` parameter
- Cannot use \`commerce.env=STAGE\` (not supported for OST)
- Ask in #offer-onboarding-support if offer should exist

### Commerce Placeholders vs. OSI

**Old Way (Deprecated):**
Commerce placeholders - Hardcoded in Milo Word docs

**New Way (M@S):**
OSI in card fragments - Dynamic, updates automatically

**Localization:**
- OSI automatically adapts to page locale
- No manual translation needed
- Price/currency determined by user's location

**Important:** Commerce placeholders are NOT localized via DNT (Do Not Translate) tags. They use backend logic for locale.

## PERMISSIONS & IAM GROUPS

### Permission Levels

**Reader:**
- View cards
- Search/filter
- Cannot edit or publish

**Author:**
- Create new cards
- Edit draft cards
- Save changes
- Cannot publish

**Publisher:**
- All author permissions
- Publish cards to production
- Unpublish cards
- Manage card status

**Admin:**
- All publisher permissions
- Manage permissions
- Create/delete folders
- System configuration

### Requesting Permissions

**Process:**
1. Go to https://iam.corp.adobe.com
2. Click "Access Requests" → "Request" → "Myself"
3. Search for appropriate group:
   - **Studio Users:** GRP-AEMCMS-MAS-STUDIO-USERS-PROD
   - **Adobe.com Authors:** GRP-AEMCMS-MAS-ACOM-AUTHORS-PROD
   - **CCD Authors:** GRP-AEMCMS-MAS-CCD-AUTHORS-PROD
   - **Adobe Home Authors:** GRP-AEMCMS-MAS-ADOBE-HOME-AUTHORS-PROD
   - **Commerce Authors:** GRP-AEMCMS-MAS-COMMERCE-AUTHORS-PROD
   - **Studio Admins:** GRP-AEMCMS-MAS-STUDIO-ADMINS-PROD
4. Submit request
5. Group owner approves
6. Wait for provisioning (can take hours)
7. Log out and back into Studio

**Multiple Surfaces:**
If you author for multiple surfaces, request multiple groups.

**Troubleshooting Permissions:**
- **Can log in but see no content:** Missing surface-specific author group
- **Can edit but not publish:** Need publisher role in IAM group
- **401 errors:** IMS token expired, log out/in
- **403 errors:** Insufficient permissions, check IAM groups

## CONTENT WORKFLOWS

### Creating Content

**Standard Workflow:**
1. **Plan:** Determine variant, content, target surface
2. **Create:** Use visual editor or AI Creator
3. **Add Offer:** Attach OSI via OST (if commerce card)
4. **Preview:** Review in Studio's live preview
5. **Save Draft:** Save for later editing
6. **Review:** Have stakeholder review
7. **Publish:** Make live in Odin
8. **Deploy:** Content available via Freyja API
9. **Verify:** Check card renders correctly on target page

### Publishing Workflow

**Publishing a Single Card:**
1. Open card in editor
2. Review all fields
3. Check validation (no errors)
4. Click "Publish" button
5. Confirm action
6. Card status changes to "Published"
7. Fragment available via Freyja immediately

**Publishing Multiple Cards:**
1. Select cards in table view (checkboxes)
2. Click bulk actions menu
3. Select "Publish selected"
4. Confirm
5. All cards publish

**Publishing via AI Chat:**
Say "Publish this card" or "Publish all draft cards I created today"

### Unpublishing Content

**When to Unpublish:**
- Content is outdated
- Promo has ended
- Errors need fixing
- Card being deprecated

**How to Unpublish:**
1. Open card in editor
2. Click "Unpublish" button
3. Confirm action
4. Status changes to "Draft"
5. Card no longer available via Freyja

**Effect on Pages:**
- If card is referenced on a live page, it will stop rendering
- Page will show fallback or nothing (depending on implementation)
- Update page to remove reference or replace with different card

### Content Updates

**Updating Published Cards:**
1. Open published card
2. Make changes
3. Save (updates published version immediately)
4. No need to "re-publish"

**Draft Changes to Published Card:**
Not supported in current version. Changes save directly to published state.

**Best Practice:**
For major changes, consider creating new card and swapping references.

## CARD COLLECTIONS

### What are Collections?

Collections are groups of related cards that should be managed together.

**Use Cases:**
- Product comparison tables (3 pricing tiers)
- Related product offerings
- Seasonal campaigns
- A/B test variations

### Creating Collections

**Method 1: Visual Editor**
1. Click "Create" → "Collection"
2. Name the collection
3. Add cards:
   - Search for existing cards
   - Create new cards inline
   - Set card order
4. Save collection

**Method 2: AI Creator**
Say "Create 3 cards for Express: Free, Premium, Teams"
- AI generates collection automatically
- All cards created at once
- Option to save collection or individual cards

### Managing Collections

**Editing Collection:**
- Open collection in editor
- Add/remove cards
- Reorder cards (drag and drop)
- Edit individual cards inline
- Save changes

**Publishing Collection:**
- Publishes all cards in collection
- Atomic operation (all or nothing)
- Maintains card relationships

**Using Collection on Page:**
- Reference collection path in page
- All cards render together
- Maintain consistent styling

## CONTENT GALLERIES (KITCHEN SINK)

### What are Galleries?

Gallery pages showcase all card variants with examples. Use them to:
- See what's possible with each variant
- Copy examples for your own cards
- Verify cards render correctly
- Share with stakeholders

**Gallery Pages:**
- **CCD:** https://main--milo--adobecom.hlx.page/libs/features/mas/docs/ccd.html
- **Adobe Home:** https://main--milo--adobecom.hlx.page/libs/features/mas/docs/adobe-home.html
- **Plans (acom):** https://main--milo--adobecom.hlx.page/libs/features/mas/docs/plans.html
- **Commerce:** https://main--milo--adobecom.hlx.page/libs/features/mas/docs/commerce.html
- **Express:** https://main--milo--adobecom.hlx.page/libs/features/mas/docs/express.html

### Using Galleries

**Workflow:**
1. Open gallery page for your surface
2. Find variant similar to what you need
3. Inspect card structure in browser DevTools
4. Copy slot structure and field names
5. Create your card with same structure
6. Adjust content for your product

**Gallery Navigation:**
- Variants organized by type
- Click card to expand details
- View source HTML
- See required/optional fields

## TAGS & METADATA

### Tagging Cards

**Purpose:**
- Organize content
- Enable filtering
- Track campaigns
- Support search

**Adding Tags:**
1. Open card in editor
2. Find "Tags" field
3. Type tag name
4. Select from autocomplete or create new
5. Multiple tags supported

**Tag Categories:**
- Product tags (photoshop, illustrator, etc.)
- Campaign tags (q4-promo, back-to-school, etc.)
- Audience tags (student, enterprise, etc.)
- Status tags (approved, needs-review, etc.)

**Best Practices:**
- Use consistent tag naming
- Don't over-tag
- Coordinate tags across team
- Create tag taxonomy

## CONTENT LOCALIZATION

### How M@S Handles Localization

**Locale Detection:**
- Page locale determines pricing locale
- WCS automatically returns correct currency
- Tax labels in local language
- Checkout links localized

**OSI Localization:**
- OSI is locale-agnostic
- Same OSI works across all locales
- Offer must be valid for that locale

**Content Localization:**
- Card content (title, description) NOT auto-translated
- Author must create separate cards per locale
- Or use shared card with locale-neutral content

**Folder Structure:**
Organize by locale if creating localized versions:
\`\`\`
/acom/
  /us-en/
  /fr-fr/
  /de-de/
\`\`\`

### Authoring for Multiple Locales

**Option 1: Separate Cards**
- Create card per locale
- Translate content
- Use same OSI (if offer valid in locale)

**Option 2: Shared Card**
- Create one card with generic content
- OSI adapts pricing to locale
- Content stays English (or language-neutral)

**Option 3: Locale-Specific Offers**
- Some offers only valid in specific regions
- Must author on geo-specific page for OST to work
- Example: Regional pricing requires authoring in that region's node

## VALIDATION & ERRORS

### Card Validation

Studio validates cards before saving:

**Required Field Errors:**
- "Title is required"
- "CTA is missing"
- "Invalid slot name"

**Fix:** Add missing required fields for variant

**Slot Mismatch Warnings:**
- "Using heading-m slot but plans variant expects heading-xs"

**Fix:** Use correct slot names for variant

**CTA Style Warnings:**
- "Fries variant expects 'primary' CTA, found 'primary-outline'"

**Fix:** Use correct CTA style for variant

### Common Authoring Errors

**Card Won't Save:**
- Check for validation errors (red indicators)
- Ensure all required fields filled
- Check browser console for JavaScript errors
- Try refreshing page

**Price Not Showing:**
- Verify OSI is saved
- Check offer is valid for locale
- Test in browser DevTools network tab
- Confirm WCS is responding

**Card Not Rendering on Page:**
- Verify card is published (not draft)
- Check fragment path is correct
- Clear Akamai cache
- Check browser console for errors

**Permission Denied:**
- Verify IAM group membership
- Log out and back in
- Check with admin if groups are correct

## DOCUMENTATION RESOURCES

**Authoring Guides:**
- M@S Platform Docs: https://main--milo--adobecom.hlx.page/libs/features/mas/docs/mas.html
- Milo Commerce Docs: https://milo.adobe.com/docs/authoring/commerce
- DA Documentation: https://da.live/docs
- M@S Author Docs: https://da.live/#/adobecom/mas/docs

**Support:**
- AI Chatbot (Mr. Fluffy Jaws): https://aemcs-workspace.adobe.com/bot/fluffyjaws/acom-commerce
- Slack: #merch-at-scale
- OST Support: See Offer Selector Tool Support Hub wiki page

This knowledge will help you answer questions about authoring workflows, using M@S Studio, and creating merchandising content.
`;
