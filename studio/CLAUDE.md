# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M@S Studio (Merch at Scale Studio) is an Adobe internal web application for managing merchandising content at scale. It integrates with Adobe Experience Manager (AEM) for content fragment management and Adobe's commerce services for offer management.

## Essential Development Commands

### Development Server
```bash
# Start proxy server for local development (required for CORS)
npm run proxy          # Points to production AEM
npm run proxy:qa       # Points to QA environment
npm run proxy:https    # HTTPS mode with certificates
```

The studio runs at `http://localhost:8080` with the main component:
```html
<mas-studio base-url="http://localhost:8080"></mas-studio>
```

### Build
```bash
npm run build          # Builds bundles using ESBuild
```

### Testing
```bash
npm test               # Run tests with watch mode and coverage
npm run test:ci        # Run tests in CI mode
```

### Code Formatting
```bash
# No npm script defined, but Prettier is configured
npx prettier --write .
```

Prettier configuration (`.prettierrc`):
- Single quotes
- Tab width: 4 spaces
- Print width: 128 characters

## Architecture Overview

### Technology Stack
- **Framework**: Lit (Web Components)
- **Build Tool**: ESBuild
- **Testing**: Web Test Runner with Chrome
- **Editor**: ProseMirror for rich text editing
- **UI Components**: Adobe Spectrum Web Components (SWC)
- **State Management**: Custom reactive store pattern

### Directory Structure
```
/src
├── aem/          # AEM integration (content trees, fragments)
├── editors/      # Content editors (merch-card, collection)
├── fields/       # Form field components
├── filters/      # Filter components (locale-picker)
├── placeholders/ # Placeholder management system
├── reactivity/   # State management and controllers
├── rte/          # Rich Text Editor components
└── utils/        # Shared utilities
```

### Key Component Patterns
- All UI components are custom elements prefixed with `mas-`
- Components extend from `LitElement`
- State is managed through reactive controllers
- Events use custom event system for inter-component communication

### Core Features
1. **Content Management**: Create/edit merch cards and collections
2. **AEM Integration**: Fragment management and content tree navigation
3. **Placeholder System**: Localized content placeholders
4. **Commerce Integration**: Offer management with pricing
5. **Multi-locale Support**: 25+ locale configurations

### Development Notes
- Always run the proxy server for local development (CORS requirement)
- The project is part of a monorepo using npm workspaces
- Tests follow the same directory structure as source files
- Coverage reports are generated in `/coverage` directory
- Authentication uses Adobe IMS
- Supports multiple environments (QA, Stage, Prod) via proxy configuration