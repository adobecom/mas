# Product Feed Preview & Edit Modal Feature

## ✅ Implementation Complete

The "Preview & Send to Feed" button now shows an editable modal before sending data, allowing users to review, edit, and confirm what will be sent to the ChatGPT Product Feed API.

## What Changed

### **New User Flow**

**Before:**
```
Click "Send to Product Feed" → Data sent immediately → Toast notification
```

**After:**
```
Click "Preview & Send to Feed" → Editable Modal Opens → User Reviews/Edits Data → User Confirms → Edited Data Sent → Toast notification
                                                       → Validation Errors Shown → User Fixes Errors
                                                       → User Cancels → Modal Closes
```

### **Files Created**

1. **[studio/src/services/product-feed-fields.js](studio/src/services/product-feed-fields.js)**
   - Field metadata configuration with tooltips, validation rules, and descriptions
   - Exports: `PRODUCT_FEED_FIELDS`, `getFieldMetadata()`, `validateField()`, `validateAllFields()`
   - Defines all Product Feed fields with:
     - Labels and placeholders
     - Data types (text, textarea, url, currency, select, etc.)
     - Required/optional flags
     - Max length constraints
     - Validation patterns
     - Tooltip text for each field
     - User-friendly descriptions

2. **[studio/src/mas-product-feed-dialog.js](studio/src/mas-product-feed-dialog.js)**
   - Dedicated modal component for Product Feed editing
   - LitElement-based custom component
   - Exports: `showProductFeedDialog()` - Promise-based API
   - Features:
     - Editable fields with validation
     - Info icons with tooltips
     - Real-time validation feedback
     - Validation error summary
     - Mode-specific warnings
     - Read-only ID field
     - Textareas for long content
     - Select dropdowns for enum values

### **Files Modified**

1. **[studio/src/editors/merch-card-editor.js](studio/src/editors/merch-card-editor.js)**
   - Updated import: `import { showProductFeedDialog } from '../mas-product-feed-dialog.js'`
   - Removed method: `#formatProductDataPreview()` (no longer needed)
   - Updated: `#handleSendToChatGPT()` - Now uses `showProductFeedDialog()` instead of `confirmation()`
   - Updated: `#confirmAndSendToChatGPT()` - Now receives edited data from modal
   - Button label unchanged: "Preview & Send to Feed"

2. **[studio/src/studio.js](studio/src/studio.js)**
   - Added import: `import './mas-product-feed-dialog.js'`
   - Added component tag: `<mas-product-feed-dialog></mas-product-feed-dialog>`

## Editable Modal Features

### **Modal Structure**

```
┌──────────────────────────────────────────────┐
│ Review & Edit Product Feed Data              │
├──────────────────────────────────────────────┤
│ [Bypass (Local Only)]                         │
│                                               │
│ ⚠️ Data will be validated locally only.      │
│    No API call will be made.                  │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ Product ID * (ℹ️)                        │ │
│ │ [adobe-mas-creative-cloud-all-apps]       │ │
│ │ (read-only, auto-generated)               │ │
│ │                                            │ │
│ │ Title * (ℹ️)                              │ │
│ │ [Adobe Creative Cloud All Apps____]       │ │
│ │ Clear, concise product name (150 chars)   │ │
│ │                                            │ │
│ │ Description * (ℹ️)                        │ │
│ │ [Get access to 20+ creative apps______]   │ │
│ │ [including Photoshop, Illustrator,___]    │ │
│ │ Should help users understand... (1245/5k) │ │
│ │                                            │ │
│ │ Price (ℹ️)                                │ │
│ │ [54.99 USD____________________]           │ │
│ │ Format: [amount] [ISO currency code]      │ │
│ │                                            │ │
│ │ ... (all fields editable, scrollable)     │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│             [Cancel]  [Confirm & Send]       │
└──────────────────────────────────────────────┘
```

**Hover over (ℹ️) icon to see field-specific tooltips!**

### **Visual Design**

- **Mode Badge**: Displays current mode (Bypass/Stage/Production) with color coding
- **Warning Box**:
  - Different styling per mode
  - Blue border for Bypass/Stage
  - Orange border for Production
  - Clear message about what will happen
- **Validation Summary**:
  - Shows at top if there are errors
  - Lists all validation errors by field
  - Red background with error count
- **Field Groups**:
  - Each field has:
    - Label with required indicator (*)
    - Info icon (ℹ️) with tooltip on hover
    - Input field (textfield, textarea, or select)
    - Field description below input
    - Character counter for fields with max length
    - Red error text if validation fails
  - Read-only fields (like ID) are grayed out
  - Textareas for long content (description, highlights, etc.)
  - Select dropdowns for enum values (availability, condition, etc.)
- **Tooltips**:
  - Appear on hover over info icon
  - Explain field purpose and validation rules
  - Show example formats
- **Buttons**:
  - Cancel: Closes modal, no action taken
  - Confirm & Send: Disabled if validation errors exist
  - Sends edited data to API when clicked

### **Mode-Specific Warnings**

#### **Bypass Mode**
```
⚠️ Data will be validated locally only. No API call will be made.
```
- Background: Gray (#f5f5f5)
- Border: Blue (#2196f3)

#### **Stage Mode**
```
ℹ️ Data will be sent to staging for validation. Not visible in ChatGPT.
```
- Background: Gray (#f5f5f5)
- Border: Blue (#2196f3)

#### **Production Mode**
```
⚠️ Data will be published to ChatGPT and become searchable.
```
- Background: Light orange (#fff4e6)
- Border: Orange (#ff9800)

## How to Test

### **Prerequisites**
- AEM dev server running at http://localhost:3000
- Browser DevTools open (F12)
- Console tab visible

### **Test 1: Preview Modal Opens**

1. Open any merch card editor
2. Scroll to "ChatGPT Product Feed" section
3. Click **"Preview & Send to Feed"**
4. **Expected**:
   - Modal opens with title "Review Product Feed Data"
   - Table shows all product fields
   - Mode is displayed at top
   - Warning message shown at bottom
   - Two buttons: "Cancel" and "Confirm & Send"

**Console should show**:
```
[Product Feed] Send button clicked
[Product Feed] Validating fragment...
[Product Feed] Transforming product data...
[Product Feed] Product data: {...}
[Product Feed] Showing preview modal...
```

### **Test 2: Review Data in Modal**

1. In the open modal, review the table
2. **Check**:
   - All expected fields are present (id, title, description, price, etc.)
   - Values are correctly displayed
   - Long text wraps properly
   - Table is scrollable if data exceeds 400px
   - Empty fields show "empty" in gray

### **Test 3: Cancel Flow**

1. Open preview modal
2. Click **"Cancel"** button
3. **Expected**:
   - Modal closes
   - No API call made
   - Toast shows: "Send cancelled"

**Console should show**:
```
[Product Feed] User cancelled send
[Product Feed] Showing toast: {variant: "info", message: "Send cancelled"}
```

### **Test 4: Confirm & Send Flow**

1. Open preview modal
2. Click **"Confirm & Send"** button
3. **Expected**:
   - Modal closes
   - API call proceeds based on mode
   - Success toast appears
   - If Stage mode: Preview button appears

**Console should show**:
```
[Product Feed] User confirmed, proceeding with send...
[Product Feed] Sending confirmed by user, mode: bypass
[Product Feed] Result: {...}
[Product Feed] Showing toast: {variant: "positive", message: "✓ Validation passed"}
```

### **Test 5: Bypass Mode**

1. Select **"Bypass (Local Only)"** mode
2. Click "Preview & Send to Feed"
3. **Check modal shows**:
   - Mode: "Bypass (Local Only)"
   - Warning: "⚠️ Data will be validated locally only. No API call will be made."
   - Gray background on warning
4. Click "Confirm & Send"
5. **Expected**: Local validation runs, no network call

### **Test 6: Stage Mode**

1. Select **"Stage (Mock)"** mode
2. Click "Preview & Send to Feed"
3. **Check modal shows**:
   - Mode: "Stage (Mock Preview)"
   - Warning: "ℹ️ Data will be sent to staging for validation. Not visible in ChatGPT."
   - Blue border on warning
4. Click "Confirm & Send"
5. **Expected**:
   - Calls mock endpoint
   - Success toast
   - "Preview Result" button appears

### **Test 7: Production Mode**

1. Select **"Production (OpenAI)"** mode (may be disabled)
2. If enabled, click "Preview & Send to Feed"
3. **Check modal shows**:
   - Mode: "Production (OpenAI)"
   - Warning: "⚠️ Data will be published to ChatGPT and become searchable."
   - Orange background on warning
   - More prominent styling
4. Click "Confirm & Send"
5. **Expected**: Calls real OpenAI API

### **Test 8: Different Card Types**

Test with different card variants:
- **Plans card**: Should show plan-specific data
- **Fries card**: Should show different category
- **Suggested card**: Should show suggested-specific fields
- **Slice card**: Should show slice-specific data

Verify that:
- Each variant produces correct `product_category`
- Titles and descriptions are properly extracted
- Images are correctly linked

### **Test 9: Field Transformations**

Check that transformations are visible in preview:

| **Merch Card Field** | **Preview Table Should Show** |
|---------------------|------------------------------|
| `cardTitle: <strong>Adobe CC</strong>` | `title: Adobe CC` (HTML stripped) |
| `osi: TEAMS,COM,1M,any,1,10` | `price: 10.00 USD` (price extracted) |
| `variant: plans` | `product_category: Software > Creative Software > Subscription Plans` |
| `backgroundImage: url...` | `image_link: url...` |
| Missing field | Shows "empty" in gray italic |

### **Test 10: Error Handling**

1. Try to send without required fields (clear title)
2. **Expected**:
   - Error toast appears BEFORE modal opens
   - Console shows: `[Product Feed] Error: Validation failed: Title is required`
   - No modal shown

## Troubleshooting

### **Modal Doesn't Open**

**Symptoms**: Clicking button does nothing, no modal appears

**Debug**:
1. Check console for errors
2. Look for: `[Product Feed] Showing preview modal...`
3. If missing, check if confirmation function is imported
4. Verify `mas-confirm-dialog.js` is loaded

**Fix**: Check that import is correct and confirm-dialog component is registered

### **Modal Opens But Data Missing**

**Symptoms**: Modal shows but table is empty or incomplete

**Debug**:
1. Check console log: `[Product Feed] Product data: {...}`
2. Verify productData object has values
3. Check if ProductFeedTransformer is working

**Fix**: Check fragment data is loaded and transformer is imported

### **Cancel Doesn't Work**

**Symptoms**: Clicking Cancel doesn't close modal

**Debug**:
1. Check if confirmation dialog handles cancel properly
2. Look for console log: `[Product Feed] User cancelled send`

**Fix**: Verify `mas-confirm-dialog.js` component is functioning

### **Confirm Sends Without Modal**

**Symptoms**: Data sends immediately without showing modal

**Debug**:
1. Check if `await confirmation()` is being called
2. Verify confirmation is imported

**Fix**: Ensure async/await pattern is correct

## Console Log Reference

### **Normal Flow (Confirm)**
```
[Product Feed] Send button clicked {fragment: true, disabled: false}
[Product Feed] Validating fragment...
[Product Feed] Transforming product data...
[Product Feed] Product data: {id: "...", title: "...", ...}
[Product Feed] Showing preview modal...
[Product Feed] User confirmed, proceeding with send...
[Product Feed] Sending confirmed by user, mode: bypass
[Product Feed] Result: {success: true, ...}
[Product Feed] Showing toast: {variant: "positive", message: "✓ Validation passed: ..."}
```

### **Cancel Flow**
```
[Product Feed] Send button clicked
[Product Feed] Validating fragment...
[Product Feed] Transforming product data...
[Product Feed] Product data: {...}
[Product Feed] Showing preview modal...
[Product Feed] User cancelled send
[Product Feed] Showing toast: {variant: "info", message: "Send cancelled"}
```

### **Error Flow**
```
[Product Feed] Send button clicked
[Product Feed] Validating fragment...
[Product Feed] Error: Validation failed: Title is required
[Product Feed] Showing toast: {variant: "negative", message: "✗ Failed: Validation failed: Title is required"}
```

## Benefits

1. **User Control**: See exactly what data will be sent before transmission
2. **Error Prevention**: Review data for mistakes before API call
3. **Transparency**: All field transformations are visible
4. **Mode Awareness**: Clear warnings about what each mode does
5. **Better UX**: Follows Studio's existing confirmation pattern
6. **Debugging**: Easier to spot field mapping issues

## Next Steps

After confirming preview modal works:

1. ✅ Test all three modes (Bypass, Stage, Production)
2. ✅ Test with different card types
3. ✅ Verify field transformations are correct
4. ✅ Test cancel and confirm flows
5. ⏳ Remove debug console.logs if desired (optional)
6. ⏳ Test on actual staged environment
7. ⏳ Get OpenAI merchant approval for production

## Field Mapping Quick Reference

See [DEBUGGING_PRODUCT_FEED.md](DEBUGGING_PRODUCT_FEED.md) for complete field mapping table.

Key transformations visible in preview:
- **HTML stripping**: `<strong>Title</strong>` → `Title`
- **Price extraction**: `TEAMS,COM,1M,any,1,10` → `10.00 USD`
- **Category mapping**: `variant:plans` → `Software > Creative Software > Subscription Plans`
- **Product ID**: Fragment path → `adobe-mas-{name}`
- **Link generation**: Fragment + locale → `https://www.adobe.com/{lang}/products/{slug}`
