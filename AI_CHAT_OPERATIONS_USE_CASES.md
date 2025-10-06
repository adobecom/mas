# AI Chat Operations - Use Cases

## Overview

The AI Chat in MAS Studio now supports natural language operations for managing merch cards and collections. Users can perform AEM operations through conversational commands without leaving the chat interface.

---

## 🎨 Card Creation Use Cases

### Basic Card Creation
- **"Create a plans card for Adobe Creative Cloud"**
  - AI generates a properly structured plans variant card
  - Preview shown with validation
  - Options to edit, save, or regenerate

- **"Make a fries card for Photoshop with a badge"**
  - Creates fries variant with solid primary CTA
  - Adds badge with specified text
  - Shows live preview

- **"Create a special offers card with 30% discount"**
  - Generates special-offers variant with discount pricing
  - Uses accent CTA styling for urgency
  - Includes promotional messaging

### Multi-Card Creation
- **"Create 3 plans cards for Express: Free, Premium, and Teams"**
  - Generates collection of 3 related cards
  - Each card properly configured for its tier
  - Option to save all cards at once

- **"Make cards for all Creative Cloud apps"**
  - AI creates multiple cards for different apps
  - Consistent styling across the collection
  - Batch save to AEM

### Card Refinement
- **"Regenerate that card with a shorter title"**
  - AI modifies existing card based on feedback
  - Maintains conversation context
  - Iterative refinement possible

- **"Make the CTA more action-oriented"**
  - Updates CTA text while preserving structure
  - Keeps correct variant-specific styling
  - Shows updated preview

---

## 🔍 Search & Discovery Use Cases

### Find by Variant
- **"Show me all plans cards"**
  - Returns grid of all plans variant cards
  - Shows title, path, status for each
  - Click to open in editor

- **"Find all fries cards"**
  - Searches for fries variant cards
  - Displays search results with metadata
  - Quick actions available

### Find by Content
- **"Search for cards about Creative Cloud"**
  - Full-text search across card content
  - Returns matching cards with context
  - Relevance-based results

- **"Find cards with Photography in the title"**
  - Searches card titles
  - Shows matching results
  - Open directly from results

### Find by Product
- **"Get the Photoshop card"**
  - Searches for specific product cards
  - Returns best match
  - Preview and edit options

- **"Show me all Express cards"**
  - Finds cards related to Express
  - Grouped by variant if multiple
  - Easy access to edit

### Advanced Searches
- **"Find all draft fries cards created this week"**
  - Combines filters: variant, status, date
  - Returns filtered results
  - Bulk operations possible

- **"Search for cards with badges"**
  - Finds cards containing badge elements
  - Shows badge content in results
  - Edit to modify badges

---

## 📤 Publishing Use Cases

### Single Card Publishing
- **"Publish this card"**
  - Publishes currently previewed card
  - Shows confirmation message
  - Includes live path link

- **"Publish the Creative Cloud All Apps card"**
  - Searches for the card
  - Confirms identity
  - Publishes to production

### Bulk Publishing
- **"Publish all draft cards"**
  - Finds all draft status cards
  - Shows list for review
  - Confirms before publishing all

- **"Publish all plans cards I created today"**
  - Filters by variant, author, date
  - Batch publish operation
  - Progress feedback

### Publishing with References
- **"Publish this card and all its references"**
  - Publishes main card
  - Includes draft/unpublished references
  - Shows complete publication status

---

## 📋 Card Retrieval Use Cases

### Get by Name
- **"Get the Adobe Express Premium card"**
  - Searches by exact/partial name
  - Returns card data
  - Preview with open in editor option

- **"Show me the card at /content/dam/mas/express-premium"**
  - Fetches by exact path
  - Displays full card details
  - Quick edit access

### Get by ID
- **"Get card abc-123-def-456"**
  - Retrieves by fragment ID
  - Shows all card properties
  - Edit or duplicate options

### Get with Context
- **"What's in the current card?"**
  - Uses context to identify card
  - Shows complete configuration
  - Suggests improvements

---

## 📑 Card Duplication Use Cases

### Simple Copy
- **"Copy this card"**
  - Duplicates currently selected card
  - Creates copy in same folder
  - Auto-generates unique title

- **"Duplicate the Photoshop card"**
  - Searches for source card
  - Creates duplicate
  - Shows new card path

### Copy with Modifications
- **"Copy this card and change the title to 'Premium Plan'"**
  - Duplicates card
  - Applies requested changes
  - Saves modified copy

- **"Create a variation of this card for Teams"**
  - Copies existing card
  - Adapts content for Teams tier
  - Generates appropriate copy

---

## 🗑️ Card Deletion Use Cases

### Single Card Deletion
- **"Delete this card"**
  - Shows confirmation warning
  - Requires explicit confirmation
  - Confirms deletion success

- **"Remove card test-card-123"**
  - Finds card by ID
  - Confirms deletion with user
  - Executes and confirms

### Cleanup Operations
- **"Delete all cards with 'test' in the name"**
  - Searches for test cards
  - Shows list for review
  - Batch delete with confirmation

- **"Remove all my draft cards from last week"**
  - Filters by author, status, date
  - Shows cards to be deleted
  - Requires confirmation before deleting

---

## ✏️ Card Update Use Cases

### Field Updates
- **"Update the title to 'New Title'"**
  - Modifies title field only
  - Preserves other fields
  - Shows updated card

- **"Change the description of this card"**
  - Updates description field
  - AI helps craft new description
  - Saves updated version

### Bulk Updates
- **"Update all Creative Cloud cards with new pricing"**
  - Finds all CC cards
  - Applies pricing updates
  - Shows update summary

- **"Add a badge to all plans cards"**
  - Searches plans variants
  - Adds badge to each
  - Confirms bulk update

---

## 🔄 Combined Operations Use Cases

### Create and Publish
- **"Create a fries card for Illustrator and publish it"**
  - Creates card with AI
  - Validates structure
  - Publishes immediately

- **"Make 3 Express cards and publish them all"**
  - Generates collection
  - Reviews all cards
  - Batch publish operation

### Search and Update
- **"Find the Photoshop card and update its CTA"**
  - Searches for card
  - Updates CTA text
  - Saves changes

- **"Get all outdated plans cards and refresh their pricing"**
  - Finds cards by criteria
  - Updates pricing fields
  - Bulk save operation

### Copy and Modify
- **"Copy the Express card and change it for Premium tier"**
  - Duplicates source card
  - Modifies for Premium
  - Creates new card

- **"Duplicate all Standard cards to create Pro versions"**
  - Batch copy operation
  - Applies tier upgrades
  - Saves collection

### Search and Delete
- **"Find all cards created before January and delete them"**
  - Date-filtered search
  - Shows results for review
  - Batch delete with confirmation

- **"Remove all duplicate cards"**
  - Identifies duplicates
  - Shows list for verification
  - Cleans up repository

---

## 🎯 Workflow Use Cases

### Daily Content Operations
1. **Morning Review**: "Show me all cards I created yesterday"
2. **Quality Check**: "Find cards with validation errors"
3. **Publishing**: "Publish all reviewed cards"
4. **Cleanup**: "Delete test cards from last week"

### Campaign Launch
1. **Preparation**: "Create 5 cards for Q4 campaign: Free, Starter, Pro, Team, Enterprise"
2. **Review**: "Show me all Q4 campaign cards"
3. **Updates**: "Update all campaign cards with launch date"
4. **Go Live**: "Publish all Q4 campaign cards"

### Product Update
1. **Find**: "Get all Photoshop cards"
2. **Review**: "Show me their current pricing"
3. **Update**: "Update all Photoshop cards with new pricing"
4. **Publish**: "Publish updated Photoshop cards"

### A/B Testing
1. **Create Variant A**: "Create a plans card for Creative Cloud with 'Buy now' CTA"
2. **Create Variant B**: "Copy that card and change CTA to 'Start free trial'"
3. **Compare**: "Show me both variants"
4. **Deploy**: "Publish both test variants"

---

## 💡 Advanced Use Cases

### Context-Aware Operations
- **User working in /content/dam/mas/express folder**
  - "Create a card here" → Uses current folder path
  - "Show me cards in this folder" → Scoped search
  - "Publish everything here" → Folder-based publishing

### Chained Operations
- **"Create a plans card, copy it 3 times with different tiers, and publish all"**
  - Single command, multiple operations
  - AI orchestrates the workflow
  - Shows complete result

### Data-Driven Operations
- **"Find the top 10 most viewed cards and create a collection"**
  - Analytics-based search (if integrated)
  - Collection creation
  - Auto-saves collection

### Maintenance Operations
- **"Find all cards without badges and add 'New' badge"**
  - Searches for missing badges
  - Bulk adds badges
  - Updates all cards

- **"Get all cards with broken OSI links and fix them"**
  - Identifies broken references
  - Suggests fixes
  - Applies corrections

---

## 🔐 Permission-Based Operations

### Safe Operations (Auto-Execute)
- Search operations
- Get/Retrieve operations
- Card creation
- Preview operations

### Confirmed Operations (User Approval Required)
- Delete operations
- Bulk updates
- Publishing operations
- Reference changes

---

## 🎨 Creative Workflows

### Designer Workflow
1. **"Create a visual plans card with gradient badge"**
2. **"Make it more vibrant"** (iterative refinement)
3. **"Copy it for different products"**
4. **"Show me all my designs today"**
5. **"Publish the approved ones"**

### Content Manager Workflow
1. **"Find all unpublished cards"**
2. **"Show me cards needing review"**
3. **"Update outdated pricing across all cards"**
4. **"Publish reviewed content"**
5. **"Archive old campaign cards"**

### Developer Workflow
1. **"Create test cards for QA"**
2. **"Get card data for debugging"**
3. **"Copy production card to staging"**
4. **"Delete test cards after QA"**
5. **"Publish validated cards"**

---

## 📊 Reporting Use Cases

### Status Reporting
- **"Show me all published cards"**
- **"Find cards in draft status"**
- **"Get unpublished cards created this month"**

### Audit Operations
- **"Show me all cards I modified this week"**
- **"Find cards published yesterday"**
- **"Get cards created by [user]"**

---

## 🚀 Quick Actions

### One-Command Operations
- **"Publish this"** → Publishes current card
- **"Copy this"** → Duplicates current card
- **"Delete this"** → Removes current card (with confirmation)
- **"Update title"** → Modifies current card title
- **"Show similar"** → Finds similar cards

### Smart Defaults
- Commands without explicit targets use current card context
- Folder operations use current folder path
- Search operations use active filters

---

## 🎓 Learning Examples

### New User Onboarding
1. **"What can you do?"** → Lists capabilities
2. **"Create a sample plans card"** → Example creation
3. **"Show me how to publish"** → Guided publishing
4. **"Find example cards"** → Discovery learning

### Best Practices
- **"Create a high-converting plans card"** → AI applies best practices
- **"Optimize this card for conversions"** → Suggests improvements
- **"Review this card for errors"** → Validation feedback

---

## 🔄 Integration Use Cases

### With Other Studio Features
- Create card in chat → Open in visual editor
- Search in chat → Bulk edit in table
- Preview in chat → Publish from chat

### Cross-Surface Operations
- **"Create cards for all surfaces"** → Multi-surface generation
- **"Copy acom card to ccd"** → Cross-surface duplication
- **"Update cards across all surfaces"** → Universal updates

---

## 💪 Power User Workflows

### Batch Operations
```
User: "Find all plans cards created in December"
AI: [Shows 47 cards]
User: "Update their pricing to new Q1 rates"
AI: [Updates all 47 cards]
User: "Publish them all"
AI: [Publishes all 47 cards]
```

### Complex Filters
```
User: "Find fries cards with badges, created by me, modified last week, in draft status"
AI: [Returns precise filtered results]
User: "Publish the top 5"
AI: [Publishes 5 most recent]
```

### Repository Management
```
User: "Show me all my cards"
AI: [Lists all user's cards]
User: "Delete the test ones"
AI: [Identifies and removes test cards]
User: "Organize the rest by product"
AI: [Suggests organization strategy]
```

---

## 📝 Summary

The AI Chat now supports **6 core operation types**:

1. **🔍 Search** - Find cards by variant, content, metadata, filters
2. **📤 Publish** - Deploy single or multiple cards to production
3. **📋 Get** - Retrieve card data by ID, path, or name
4. **📑 Copy** - Duplicate cards with optional modifications
5. **✏️ Update** - Modify card fields individually or in bulk
6. **🗑️ Delete** - Remove cards with safety confirmations

These operations can be **combined**, **chained**, and used in **complex workflows**, all through natural language conversation. The AI maintains **context awareness**, provides **safety confirmations** for destructive operations, and offers **rich visual feedback** for all results.

---

## 🎯 Key Benefits

✅ **No UI Navigation Required** - All operations via chat
✅ **Context-Aware** - Knows current card, folder, and history
✅ **Safe by Default** - Confirmations for destructive operations
✅ **Bulk Operations** - Handle multiple cards at once
✅ **Iterative Refinement** - Conversational workflows
✅ **Visual Feedback** - Rich results display
✅ **Seamless Integration** - Works with existing Studio features

The AI Chat is now a **complete content management interface** for merch cards, enabling workflows that were previously impossible or required multiple UI interactions.
