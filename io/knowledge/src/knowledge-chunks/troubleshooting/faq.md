# Frequently Asked Questions

## General

### What is MAS Studio?
MAS (Merch at Scale) Studio is a content authoring tool for creating and managing merch-cards (product/pricing cards) used across Adobe websites. It provides a visual editor with live preview.

### How do I access MAS Studio?
Navigate to https://mas.adobe.com/studio and sign in with your Adobe credentials. You need appropriate permissions in Admin Console.

### What browsers are supported?
Chrome (recommended), Firefox, Safari, and Edge. Chrome provides the best experience.

## Content Editing

### How do I add a checkout button to my card?
1. Open your card in the MAS Studio editor
2. Scroll to the **Footer** section
3. Click **"Add CTA"** to add a new button
4. Select the button text (e.g., "Buy now", "Free trial")
5. Choose "Checkout" as the link type
6. Save your card

The checkout URL is automatically generated based on your OSI (Offer Selector ID). Make sure you've set up pricing using OST first.

### How do I add a price to my card?
1. Open your card in MAS Studio
2. Find the **Pricing** section
3. Click the **OST** (Offer Selector Tool) button
4. Search for your product
5. Select the correct offer
6. The price populates automatically with correct localization

**Never type prices manually** - always use OST for accurate, localized pricing.

### How do I create a new card?
1. Navigate to desired folder
2. Click "+ New Fragment"
3. Select card variant/model
4. Fill in required fields
5. Click Save

### How do I edit an existing card?
1. Search or browse to find the card
2. Click to open in editor
3. Modify fields as needed
4. Preview changes in real-time
5. Click Save when done

### Can I undo changes?
Before saving, you can discard changes. After saving, use Version History to restore previous versions.

### How do I duplicate a card?
1. Open the source card
2. Click "Duplicate" or copy fragment
3. Modify as needed
4. Save with new name/path

## Pricing

### How does pricing work?
Prices are fetched dynamically using OSI (Offer Selection ID) codes. Enter OSI codes in the prices field, and WCS/AOS provides live pricing.

### Why are prices not showing?
Check that:
- OSI code is valid
- Locale is supported
- WCS service is available
- No JavaScript errors in console

### How do I change the currency?
Currency is determined by the fragment's locale. Create a variation in the desired locale folder.

## Variations

### What's the difference between a fragment and a variation?
A fragment is the main content (locale default). A variation is a localized copy that inherits from the parent but can override specific fields.

### Can I create a French variation of an English card?
No, variations must be same language. For French content, create a new fragment in the fr_FR folder.

### How do I reset a field to use the parent value?
Click the reset icon (↩) next to the overridden field indicator.

## Publishing

### When do changes go live?
After saving, content must be published. Published content propagates to CDN within minutes.

### How do I publish?
Click the Publish button in the editor. You need publish permissions.

### Can I unpublish content?
Yes, use Unpublish to remove content from the live site while keeping it in AEM.

## Performance

### Why is the editor slow?
Possible causes:
- Large number of fragments loading
- Network latency
- Browser extensions
Try clearing cache or using incognito mode.

### How do I speed up search?
Use specific search terms, filter by model or path, and limit result count.

## Getting Help

### Where do I report bugs?
File issues in JIRA under the MAS project.

### Who can I contact for help?
Reach out in the #mas-studio Slack channel.

### Where is the documentation?
This knowledge base! Also check Confluence for detailed specs.
