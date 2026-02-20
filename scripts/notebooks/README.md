# MAS Notebooks

This directory contains Jupyter notebooks for migrating and managing merch cards.

## Prerequisites

### Environment Setup

**Deno Runtime**: These notebooks require Deno to run JavaScript/TypeScript code.

## Notebooks

### 1. `eds_export.ipynb` - EDS Content Export

**Purpose**: Exports merch card content from Adobe's Edge Delivery Services (EDS/Helix) system.

**Key Features**:

- Supports both Markdown (`.md`) and HTML (`.plain.html`) formats
- Download a folder to local

**Output**:

- `${repo}_filelist.txt` - List of all discovered file paths
- `./html/` directory - Downloaded HTML content files
- `./md/` directory - Downloaded MD content files

### 2. `aem_import.ipynb` - AEM ODIN Import

**Purpose**: Parses exported HTML content and imports it as structured data into the ODIN system.

**Input**:

- `${repo}_filelist.txt` - List of all file paths to be imported

### 3. `mas_update.ipynb` - Update M@S cards

**Purpose**: Batch update existing merch cards

### 4. `mas_copy.ipynb` - Copy M@S cards

**Purpose**: Copy merch cards from one surface to the other
