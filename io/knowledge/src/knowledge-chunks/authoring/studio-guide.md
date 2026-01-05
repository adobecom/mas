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
- Use \