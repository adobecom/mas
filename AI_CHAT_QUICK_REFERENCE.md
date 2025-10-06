# AI Chat - Quick Reference Guide

## 🚀 Quick Start Commands

### Card Creation
```
"Create a plans card for [product]"
"Make a fries card with [features]"
"Generate 3 cards for [tiers]"
```

### Search & Find
```
"Show me all [variant] cards"
"Find cards about [topic]"
"Search for [product] cards"
```

### Publishing
```
"Publish this card"
"Publish all draft cards"
"Deploy [product] cards"
```

### Get Card Data
```
"Get the [name] card"
"Show card [id]"
"What's in this card?"
```

### Duplicate
```
"Copy this card"
"Duplicate [name] card"
"Create a variation of this"
```

### Update
```
"Update the title to [text]"
"Change [field] of this card"
"Modify all [variant] cards"
```

### Delete
```
"Delete this card"
"Remove [name] card"
"Clean up test cards"
```

---

## 📊 Operation Types

| Operation | Keywords | Requires Confirmation |
|-----------|----------|----------------------|
| **Search** | find, show, search, list | ❌ No |
| **Get** | get, show me, what's, fetch | ❌ No |
| **Publish** | publish, deploy, go live | ✅ Yes (optional) |
| **Copy** | copy, duplicate, clone | ❌ No |
| **Update** | update, change, modify | ⚠️ For bulk |
| **Delete** | delete, remove, trash | ✅ Yes (always) |

---

## 🎯 Command Patterns

### Simple Commands
- `"[action] this"` - Acts on current card
- `"[action] [name]"` - Acts on named card
- `"[action] all [variant]"` - Acts on variant type

### Filter Commands
- `"Find [variant] cards with [criteria]"`
- `"Show me cards created [timeframe]"`
- `"Get [status] cards by [author]"`

### Chained Commands
- `"Create [card] and publish it"`
- `"Find [cards] and update [field]"`
- `"Copy [card] and change [property]"`

---

## 💡 Tips & Tricks

### Context Awareness
- **Current card**: "this card", "this one", "the current card"
- **Current folder**: "here", "in this folder"
- **Recent cards**: "the one I just created", "last card"

### Smart Defaults
- Omit "card" - AI understands: "Publish this" = "Publish this card"
- Use natural language - "Make it blue" works just as well as "Update color to blue"
- Be specific when needed - "the Photoshop one" vs just "Photoshop"

### Power Moves
- **Batch operations**: "all", "every", "each"
- **Filters**: "draft", "published", "created today", "by me"
- **Combinations**: Chain operations in one sentence

---

## ⚡ Common Workflows

### Daily Content Creation
1. `"Create a plans card for Creative Cloud"`
2. `"Make the title more concise"`
3. `"Add a badge"`
4. `"Publish this"`

### Campaign Launch
1. `"Create 3 cards for Q1: Free, Pro, Enterprise"`
2. `"Show me all Q1 cards"`
3. `"Update launch date on all"`
4. `"Publish all Q1 cards"`

### Content Cleanup
1. `"Find all test cards"`
2. `"Show cards older than 30 days"`
3. `"Delete cards with 'old' in name"`

### Product Update
1. `"Get all [product] cards"`
2. `"Update pricing to [amount]"`
3. `"Publish updated cards"`

---

## 🔍 Search Filters

### By Variant
- `"plans cards"`
- `"fries variants"`
- `"special offers"`

### By Status
- `"draft cards"`
- `"published cards"`
- `"unpublished content"`

### By Date
- `"created today"`
- `"modified this week"`
- `"published yesterday"`

### By Author
- `"my cards"`
- `"cards by [name]"`
- `"created by me"`

### By Content
- `"cards about [topic]"`
- `"cards with [text]"`
- `"cards containing [keyword]"`

---

## ⚠️ Safety Features

### Confirmation Required
- All delete operations
- Bulk updates (more than 5 cards)
- Publishing to production (optional)

### Preview Before Action
- Search results show cards before bulk actions
- Get operations show full card data
- Update operations preview changes

### Undo Not Available
- Deleted cards cannot be recovered
- Published cards cannot be unpublished via chat
- Always review before confirming destructive operations

---

## 🎨 Best Practices

### Do's ✅
- Be specific with card names
- Use filters to narrow results
- Review search results before bulk operations
- Leverage context for current card operations
- Chain related operations

### Don'ts ❌
- Don't skip confirmations on delete
- Don't use vague references for important operations
- Don't bulk update without reviewing list
- Don't forget to publish after updates
- Don't delete without checking card usage

---

## 🔗 Integration with Studio

### Open in Editor
- From search results: Click "Open in Editor" button
- From get results: Use open button
- After creation: "Open in editor" action

### Folder Context
- Chat uses current folder for saves
- Searches scope to current folder when relevant
- Publishing respects folder structure

### Preview Panel
- Shows live preview of created cards
- Updates as you refine via chat
- Uses actual merch-card component

---

## 📱 Response Types

### Success Messages
- ✓ confirmation with action taken
- Link to card path
- Summary of changes

### Error Messages
- Clear explanation of what went wrong
- Suggestions for correction
- Alternative actions when available

### Info Messages
- Operation in progress
- Waiting for confirmation
- Results summary

---

## 🎓 Learning Path

### Beginner
1. Create simple cards
2. Search for cards by variant
3. Get card data
4. Open cards in editor

### Intermediate
1. Create cards with advanced features
2. Use multiple search filters
3. Publish single cards
4. Copy and modify cards

### Advanced
1. Batch operations
2. Complex filter combinations
3. Chained workflows
4. Bulk publish/update/delete

### Expert
1. Cross-surface operations
2. Automated workflows
3. Custom bulk operations
4. Repository management

---

## 🆘 Troubleshooting

### Operation Not Working
- Check if card exists: `"Get [card name]"`
- Verify permissions for operation
- Ensure card is in expected state

### Search Returns Nothing
- Try broader search terms
- Check folder path
- Verify variant spelling
- Use partial matches

### Publish Fails
- Check card validation errors
- Verify publish permissions
- Ensure all required fields present
- Check for broken references

### Can't Find Card
- Use full card name
- Try searching by path
- Search by ID if known
- Use "show me all" then filter

---

## 🌟 Pro Tips

1. **Use Abbreviations**: "CC" for Creative Cloud, "PS" for Photoshop
2. **Leverage History**: "the last one", "previous card", "that one"
3. **Smart Searches**: Partial matches work - "photo" finds "Photoshop"
4. **Bulk Wisely**: Always review list before bulk operations
5. **Context Chain**: Create → modify → publish in conversation flow
6. **Save Time**: Use chat for operations that require multiple UI clicks
7. **Preview First**: Always check preview before publishing
8. **Iterate**: Don't regenerate entire card, just update specific fields

---

## 📞 Getting Help

Within Chat:
- `"What can you do?"` - Lists capabilities
- `"How do I [action]?"` - Shows examples
- `"Help with [operation]"` - Specific guidance

The AI Chat learns from your patterns and suggests relevant operations based on your workflow!
