# AEM Fragment Variations in MAS Studio

## Overview

MAS Studio implements **locale-based variations** for Content Fragments. A variation is a localized copy of a fragment that can override specific fields while inheriting others from a "parent" (master) fragment.

---

## 1. Variation Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant Dialog as MasVariationDialog
    participant AEM as AEM API
    participant Fragment as Fragment Model

    User->>Dialog: Click "Add Variation"
    Dialog->>Dialog: Show locale picker<br/>(filtered by same language)
    User->>Dialog: Select target locale (e.g., en_GB)
    User->>Dialog: Click "Create"

    Dialog->>AEM: ensureFolderExists(/content/dam/mas/cards/en_GB)
    AEM-->>Dialog: Folder ready

    Dialog->>AEM: POST /cf/fragments<br/>{fields: [all except originalId]}
    AEM-->>Dialog: New fragment created (id: def456)

    Dialog->>Fragment: Set originalId = "abc123"
    Dialog->>AEM: PUT /cf/fragments/def456<br/>{originalId: "abc123"}
    AEM-->>Dialog: Fragment updated

    Dialog->>User: Variation created successfully
```

---

## 2. Data Structure

```mermaid
erDiagram
    PARENT_FRAGMENT ||--o{ VARIATION_FRAGMENT : "has variations"

    PARENT_FRAGMENT {
        string id PK "abc123"
        string path "/content/dam/mas/cards/en_US/card"
        string title "Creative Cloud"
        string price "$54.99/mo"
        string cta "Buy now"
        array variations "['def456', 'ghi789']"
    }

    VARIATION_FRAGMENT {
        string id PK "def456"
        string path "/content/dam/mas/cards/en_GB/card"
        string originalId FK "abc123"
        string price "£44.99/mo"
    }
```

---

## 3. Field Resolution Logic

```mermaid
flowchart TD
    A[Get Field Value] --> B{Field exists<br/>in variation?}
    B -->|Yes| C{Value is<br/>non-empty?}
    B -->|No| D{Is this a<br/>variation?}

    C -->|Yes| E[Return variation's value]
    C -->|No| D

    D -->|Yes| F{Parent fragment<br/>available?}
    D -->|No| G[Return null/empty]

    F -->|Yes| H[Return parent's value]
    F -->|No| G

    style E fill:#90EE90
    style H fill:#87CEEB
    style G fill:#FFB6C1
```

---

## 4. Field State Machine

```mermaid
stateDiagram-v2
    [*] --> Inherited: Fragment created as variation

    Inherited --> Overridden: User edits field
    Overridden --> Inherited: User clicks "Reset"
    Overridden --> SameAsParent: User sets same value as parent
    SameAsParent --> Overridden: User changes value
    SameAsParent --> Inherited: User clicks "Reset"

    note right of Inherited
        Field NOT stored in variation
        Value comes from parent
    end note

    note right of Overridden
        Field stored in variation
        Uses own value
    end note

    note right of SameAsParent
        Field stored (redundant)
        Same as parent value
    end note
```

---

## 5. Editor Loading Flow

```mermaid
flowchart TD
    A[Editor Opens Fragment] --> B[Load fragment from AEM]
    B --> C{Has originalId?}

    C -->|Yes| D[This is a VARIATION]
    C -->|No| E[This is a PARENT]

    D --> F[Fetch parent fragment]
    F --> G[Merge parent fields<br/>for preview]
    G --> H[Show inherited/overridden<br/>indicators in UI]

    E --> I[Load variations list]
    I --> J[Show "Add Variation" button]

    H --> K[Editor Ready]
    J --> K

    style D fill:#87CEEB
    style E fill:#90EE90
```

---

## 6. Complete System Overview

```mermaid
flowchart TB
    subgraph AEM["AEM Repository"]
        subgraph US["en_US folder"]
            P[Parent Fragment<br/>id: abc123]
        end
        subgraph GB["en_GB folder"]
            V1[Variation Fragment<br/>id: def456<br/>originalId: abc123]
        end
        subgraph DE["de_DE folder"]
            V2[Variation Fragment<br/>id: ghi789<br/>originalId: abc123]
        end
    end

    subgraph Studio["MAS Studio"]
        E[Editor Panel]
        D[Variation Dialog]
        FM[Fragment Model]
    end

    P -.->|variations field| V1
    P -.->|variations field| V2
    V1 -->|originalId| P
    V2 -->|originalId| P

    E <-->|CRUD| AEM
    D -->|Create| AEM
    FM -->|Parse & Resolve| E
```

---

## 7. Reset Field Operation

```mermaid
sequenceDiagram
    participant User
    participant Editor as Editor Panel
    participant Fragment as Fragment Model
    participant AEM as AEM API

    User->>Editor: Click "Reset to Parent"
    Editor->>Fragment: resetFieldToParent("price")

    Note over Fragment: Find field index
    Fragment->>Fragment: fields.splice(index, 1)<br/>DELETE field entirely
    Fragment->>Fragment: hasChanges = true

    Editor->>Editor: Re-render with<br/>parent's value

    User->>Editor: Click "Save"
    Editor->>AEM: PUT /cf/fragments/{id}<br/>{fields: [without price]}
    AEM-->>Editor: Saved

    Note over Editor: Field now inherited<br/>from parent
```

---

## Key Design Decisions

### 1. Why `originalId` field instead of AEM's native variation model?
- AEM Content Fragment variations are designed for same-fragment variations (e.g., "web" vs "mobile" renditions)
- Locale variations need separate fragments in different folders for proper localization workflows
- Custom `originalId` field provides flexibility without AEM constraints

### 2. Why sparse storage?
- Reduces storage footprint
- Makes inheritance explicit (missing = inherited)
- Simplifies "reset to parent" operation (just delete field)

### 3. Why copy all fields initially, then delete?
- Ensures variation is functional standalone if parent is unavailable
- Allows gradual cleanup of redundant fields
- Simpler copy operation at creation time

---

## Key Files

| Purpose | File |
|---------|------|
| Variation creation dialog | `studio/src/mas-variation-dialog.js` |
| Fragment model (isVariation, getEffectiveFieldValue) | `studio/src/aem/fragment.js:88-195` |
| AEM copy operation | `studio/src/aem/aem.js:631-661` |
| Parent fragment loading | `studio/src/mas-fragment-editor.js:527-587` |
| Editor context/state | `studio/src/reactivity/editor-context-store.js` |
