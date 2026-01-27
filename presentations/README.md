# M@S AI Assistant Presentation

## Files

- `mas-ai-assistant.md` - Main presentation (Marp format)
- `demo-script.md` - Quick reference for live demos

## Viewing the Presentation

### Option 1: VS Code with Marp Extension (Recommended)

1. Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension
2. Open `mas-ai-assistant.md`
3. Click the preview icon or press `Cmd+Shift+V`
4. To export: Open command palette (`Cmd+Shift+P`) → "Marp: Export Slide Deck"

### Option 2: Marp CLI

```bash
# Install globally
npm install -g @marp-team/marp-cli

# Preview in browser
npx @marp-team/marp-cli -p mas-ai-assistant.md

# Export to PDF
npx @marp-team/marp-cli mas-ai-assistant.md -o mas-ai-assistant.pdf

# Export to HTML
npx @marp-team/marp-cli mas-ai-assistant.md -o mas-ai-assistant.html

# Export to PowerPoint
npx @marp-team/marp-cli mas-ai-assistant.md -o mas-ai-assistant.pptx
```

### Option 3: Online Viewer

1. Go to [marp.app](https://marp.app/)
2. Paste the markdown content
3. View/export from there

## Mermaid Diagrams

The presentation includes Mermaid diagrams. For full rendering:

- **VS Code**: Install [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
- **Marp CLI**: Add `--html` flag for HTML export with Mermaid support
- **PDF Export**: Some diagrams may need manual screenshots

## Presentation Duration

- Content: ~20 minutes
- Demo: ~10 minutes
- Q&A: ~10 minutes
- **Total: ~40 minutes**

## Demo Prerequisites

Before the demo:
1. Log into MAS Studio
2. Navigate to Commerce surface
3. Have AI Chat panel visible
4. Test that all demos work beforehand
