# MERCH AT SCALE (M@S) PLATFORM OVERVIEW

## What is M@S?
Merch at Scale is Adobe's singular platform designed to optimize the development, delivery, and shared consumption of merchandising content across the Adobe digital ecosystem. It enables teams to author and publish merch cards (product cards with pricing and CTAs) across multiple surfaces:

**Supported Surfaces:**
- **Adobe.com** (acom) - Public website pages using Milo framework
- **Creative Cloud Desktop** (CCD) - Desktop application merchandising
- **Adobe Home** (AH) - Adobe Home application
- **Unified Checkout** (commerce) - Checkout flow recommendation cards

## Core Components

### 1. M@S STUDIO
**URL:** https://mas.adobe.com/studio.html

**Purpose:** Web-based visual editor for creating, editing, and publishing merch cards

**Key Features:**
- Visual card editor with live preview
- Offer Selector Tool (OST) integration for pricing
- Card collections management
- Folder-based organization
- Role-based permissions via IAM groups

**Technology:**
- Built with Lit web components
- Uses Spectrum Web Components for Adobe design system
- ProseMirror for rich text editing
- Connects to Odin via AEM Sites API

### 2. ODIN (Content Management System)
**What it is:** Adobe's internal instance of AEM Sites (Adobe Experience Manager) designed for structured content delivery to many surfaces.

**Environment URLs:**
- **Production:** https://author-p22655-e59433.adobeaemcloud.com
- **Stage:** https://author-p22655-e59471.adobeaemcloud.com
- **QA:** https://author-p22655-e155390.adobeaemcloud.com

**What's Stored in Odin:**
- Merch card content fragments
- Card collections
- Tags and metadata
- Placeholder content
- Settings and configuration

**Content Structure:**
- All M@S content is in \