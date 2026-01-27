---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-family: 'Adobe Clean', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  h1 {
    color: #1473E6;
  }
  h2 {
    color: #2C2C2C;
  }
  h3 {
    color: #505050;
  }
  code {
    background: #f5f5f5;
    border-radius: 4px;
  }
  table {
    font-size: 0.85em;
  }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
---

<!-- _class: lead -->
<!-- _backgroundColor: #1473E6 -->
<!-- _color: white -->

# M@S AI Assistant

## Powering Content Management with MCP and RAG

---

# What We Built

**An AI-powered content management assistant that:**

- 📇 Creates merch cards through natural language
- 🔍 Searches and discovers content across the catalog
- 📦 Performs bulk operations (publish, update, delete)
- 📚 Provides contextual documentation help

**Key Innovation**: Natural language → Real actions on backend systems

---

<!-- _class: lead -->
<!-- _backgroundColor: #2C2C2C -->
<!-- _color: white -->

# Part 1: Architecture Overview

---

# High-Level Architecture

```mermaid
flowchart LR
    CHAT["🖥️ Chat UI"]

    subgraph IO["Adobe I/O Runtime"]
        AI["AI Service"]
        REMOTE["Remote MCP<br/>(35 Tools)"]
    end

    subgraph AWS["AWS"]
        CLAUDE["Claude Sonnet 4"]
        RAG["RAG"]
    end

    LOCAL["💻 Local MCP<br/>(Development)"]
    AEM["📁 AEM"]

    CHAT --> AI
    AI --> CLAUDE
    AI --> RAG
    AI --> CHAT

    CHAT --> REMOTE --> AEM
    CHAT -.-> LOCAL -.-> AEM

    style IO fill:#FFF3E0
    style AWS fill:#FF9900,color:#fff
    style LOCAL fill:#E8F5E9,stroke-dasharray: 5 5
```

**Two MCP paths:** Production uses Remote MCP (serverless), Development uses Local MCP (port 3001)

---

# Core Components

| Component | Technology | Role |
|-----------|------------|------|
| **Chat UI** | Lit Web Components | User interface for conversations |
| **AI Service** | Adobe I/O Runtime | Orchestrates AI requests |
| **LLM** | Claude Sonnet 4 (AWS Bedrock) | Understands intent, generates responses |
| **RAG System** | Titan + OpenSearch | Retrieves relevant knowledge |
| **MCP Server** | Node.js HTTP Server | Executes operations on AEM |
| **Content Store** | AEM Cloud | Stores merch cards |

---

# What the AI Service Does

The AI Service is the **brain** that orchestrates conversations:

```mermaid
flowchart LR
    subgraph Input["📥 Input"]
        MSG["User Message"]
        CTX["Context<br/>(surface, locale)"]
        HIST["Conversation<br/>History"]
    end

    subgraph AI["🧠 AI Service"]
        direction TB
        A1["1. Validate Token"]
        A2["2. Detect Intent"]
        A3["3. Build Prompt"]
        A4["4. Call Claude"]
        A5["5. Parse Response"]
        A1 --> A2 --> A3 --> A4 --> A5
    end

    subgraph Output["📤 Output"]
        OP["MCP Operation<br/>(publish, search...)"]
        CARD["Card Config<br/>(JSON to hydrate)"]
        DOC["Documentation<br/>(RAG-enhanced)"]
    end

    Input --> AI
    AI --> Output

    style AI fill:#FFF3E0
```

---

# AI Service Responsibilities

| Step | What It Does |
|------|--------------|
| **Authorization** | Validates IMS bearer token |
| **Intent Detection** | Card creation vs Operations vs Documentation |
| **Context Enrichment** | Adds surface, locale, recent operations |
| **RAG Integration** | Queries knowledge base for grounded answers |
| **Bedrock Call** | Sends prompt to Claude Sonnet 4 |
| **Response Parsing** | Extracts MCP operations or card configs |

---

<!-- _class: lead -->
<!-- _backgroundColor: #2C2C2C -->
<!-- _color: white -->

# Part 2: How It Works

---

# The User Journey

```mermaid
flowchart LR
    A["👤 User types<br/>'Find Photoshop cards'"] --> B["🧠 AI understands<br/>intent"]
    B --> C["📚 RAG adds<br/>knowledge"]
    C --> D["🤖 Claude generates<br/>response"]
    D --> E["⚡ MCP executes<br/>operation"]
    E --> F["✅ User sees<br/>results"]

    style A fill:#E3F2FD
    style B fill:#FFF3E0
    style C fill:#F3E5F5
    style D fill:#FF9900,color:#fff
    style E fill:#E8F5E9
    style F fill:#FFECB3
```

---

# Step-by-Step Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat as Chat UI
    participant AI as AI Service
    participant Claude as Claude (AWS)
    participant MCP as MCP Tools
    participant AEM

    User->>Chat: "Find Photoshop cards"
    Chat->>AI: Message + Context
    AI->>Claude: Augmented prompt
    Claude-->>AI: Operation to execute
    AI-->>Chat: {tool: "search_cards", params: {...}}
    Chat->>MCP: Execute tool
    MCP->>AEM: Search API
    AEM-->>MCP: Results
    MCP-->>Chat: Card data
    Chat-->>User: Display cards
```

---

# Context Makes It Smart

**Every message includes context:**

```javascript
{
  message: "Find Photoshop cards",
  context: {
    surface: "commerce",      // Where you are
    locale: "en_US",          // Your language
    lastOperation: {...},     // What you just did
    workingSet: [...]         // Recent cards
  }
}
```

**Result:** "Publish all of these" just works - no need to specify which cards.

---

<!-- _class: lead -->
<!-- _backgroundColor: #2C2C2C -->
<!-- _color: white -->

# Part 3: RAG
## Retrieval-Augmented Generation

---

# What is RAG?

**Problem:** AI models don't know about your specific domain.

**Solution:** Give the AI a "reference book" to consult before answering.

```mermaid
flowchart LR
    Q["❓ Question"] --> R["🔍 Retrieve<br/>relevant docs"]
    R --> A["📝 Add to<br/>prompt"]
    A --> G["🤖 Generate<br/>grounded answer"]

    style Q fill:#E3F2FD
    style R fill:#FFF3E0
    style A fill:#F3E5F5
    style G fill:#E8F5E9
```

**Without RAG:** AI might hallucinate or give generic answers
**With RAG:** AI answers using your actual documentation

---

# How RAG Works

```mermaid
flowchart TB
    subgraph Index["📚 Indexing (One-time)"]
        DOC["Documentation"] --> CHUNK["Split into chunks"]
        CHUNK --> EMB1["Create embeddings"]
        EMB1 --> STORE["Store in vector DB"]
    end

    subgraph Query["🔍 Query (Every request)"]
        Q["User question"] --> EMB2["Create embedding"]
        EMB2 --> SEARCH["Find similar chunks"]
        SEARCH --> RETRIEVE["Get top results"]
    end

    subgraph Generate["✨ Generate"]
        RETRIEVE --> AUGMENT["Add to prompt"]
        AUGMENT --> LLM["Claude generates"]
        LLM --> ANSWER["Grounded answer"]
    end

    style Index fill:#E3F2FD
    style Query fill:#FFF3E0
    style Generate fill:#E8F5E9
```

---

# Our RAG Architecture

```mermaid
flowchart LR
    subgraph Embed["Amazon Titan"]
        INPUT["Text"] --> VECTOR["1536-dim vector"]
    end

    subgraph Store["OpenSearch"]
        VECTOR --> INDEX["Vector index"]
        INDEX --> KNN["k-NN search"]
    end

    subgraph Result["Retrieved Knowledge"]
        KNN --> DOCS["Top 3 chunks"]
    end

    style Embed fill:#FF9900,color:#fff
    style Store fill:#FF9900,color:#fff
```

| Service | Purpose |
|---------|---------|
| **Amazon Titan** | Converts text to vectors (embeddings) |
| **OpenSearch** | Stores vectors, finds similar content |
| **Claude** | Uses retrieved knowledge in response |

---

# Three Tiers of Knowledge

```mermaid
flowchart TB
    subgraph T1["⚡ Tier 1: Static"]
        S1["Platform docs"]
        S2["Workflows"]
    end

    subgraph T2["🔄 Tier 2: Computed"]
        C1["Card variants"]
        C2["Field specs"]
    end

    subgraph T3["🔮 Tier 3: Semantic"]
        V1["Vector search"]
    end

    T1 --> T2 --> T3

    style T1 fill:#E8F5E9
    style T2 fill:#FFF3E0
    style T3 fill:#FF9900,color:#fff
```

- **Tier 1:** Instant answers for common questions (cached)
- **Tier 2:** Always fresh from configuration
- **Tier 3:** Semantic search for complex queries

---

<!-- _class: lead -->
<!-- _backgroundColor: #2C2C2C -->
<!-- _color: white -->

# Part 4: MCP
## Model Context Protocol

---

# What is MCP?

**Problem:** AI can talk, but can't take actions.

**Solution:** A standard protocol for AI to use tools.

```mermaid
flowchart LR
    AI["🤖 AI Model"] -->|"I need to search"| MCP["🔌 MCP"]
    MCP -->|"Execute"| TOOL["⚡ Tool"]
    TOOL -->|"Results"| MCP
    MCP -->|"Here's what I found"| AI

    style AI fill:#E8EAF6
    style MCP fill:#FFF8E1
    style TOOL fill:#E8F5E9
```

**Analogy:** MCP is like USB for AI - a universal connector.

---

# Local vs Remote MCP

```mermaid
flowchart TB
    subgraph Studio["MAS Studio"]
        CLIENT["mcp-client.js"]
    end

    subgraph Decision["Environment Check"]
        CHECK{{"isDev?"}}
    end

    subgraph Local["Local MCP (Development)"]
        L_HTTP["localhost:3001"]
        L_TOOLS["40+ Tools"]
        L_USE["Used by:<br/>• Claude Desktop<br/>• Cursor IDE<br/>• Local Studio"]
    end

    subgraph Remote["Remote MCP (Production)"]
        R_URL["I/O Runtime Actions"]
        R_TOOLS["35 Tools"]
        R_USE["Used by:<br/>• MAS Studio (prod)<br/>• Serverless"]
    end

    CLIENT --> CHECK
    CHECK -->|"Yes"| Local
    CHECK -->|"No"| Remote

    style Local fill:#E8F5E9
    style Remote fill:#E3F2FD
```

**Same tools, different deployment** - Local for dev/IDE, Remote for production.

---

# Two MCP Implementations

| Aspect | Local MCP | Remote MCP |
|--------|-----------|------------|
| **Location** | `mas-mcp-server/` | `io/mcp-server/` |
| **Port** | localhost:3001 | Serverless |
| **Deployment** | Node.js process | Adobe I/O Runtime |
| **Used By** | Claude Desktop, Cursor IDE | MAS Studio (prod) |
| **Transport** | HTTP + Stdio | HTTP only |

**Why both?**
- Local: Fast iteration, IDE integration, debugging
- Remote: Production scalability, no infrastructure needed

---

# How MCP Works

```mermaid
sequenceDiagram
    participant AI as Claude
    participant MCP as MCP Server
    participant Tool as Tool Handler
    participant API as AEM API

    AI->>MCP: Call tool "search_cards"<br/>with {query: "photoshop"}
    MCP->>Tool: Route to handler
    Tool->>API: Execute search
    API-->>Tool: Raw results
    Tool-->>MCP: Formatted response
    MCP-->>AI: Tool result

    Note over AI: AI uses result<br/>in response to user
```

---

# Our MCP Tools (35 Total)

```mermaid
flowchart TB
    subgraph Cards["📇 Card Operations"]
        C["create / get / update<br/>delete / search / publish"]
    end

    subgraph Bulk["📦 Bulk Operations"]
        B["bulk_update / bulk_publish<br/>bulk_delete / preview / status"]
    end

    subgraph Offers["💰 Offers"]
        O["search / compare<br/>link / validate"]
    end

    subgraph Collections["📁 Collections"]
        CO["create / get<br/>add_cards / search"]
    end

    style Cards fill:#E8F5E9
    style Bulk fill:#FFF3E0
    style Offers fill:#E3F2FD
    style Collections fill:#F3E5F5
```

---

# MCP Tool Example

**User says:** "Create a Photoshop plans card"

**AI generates:**
```json
{
  "tool": "create_card",
  "params": {
    "variant": "plans",
    "title": "Photoshop",
    "surface": "commerce",
    "fields": {
      "badge": "Best Value",
      "prices": "..."
    }
  }
}
```

**MCP executes:** Creates card in AEM, returns preview URL

---

# Why MCP Matters

<div class="columns">
<div>

### For the AI
- Standard way to take actions
- Clear tool definitions
- Structured responses

</div>
<div>

### For Us
- One protocol, many tools
- Easy to add new capabilities
- Works across clients

</div>
</div>

**Works in:** MAS Studio, Claude Desktop, Cursor IDE

---

<!-- _class: lead -->
<!-- _backgroundColor: #2C2C2C -->
<!-- _color: white -->

# Putting It All Together

---

# Complete Picture

```mermaid
flowchart TB
    USER["👤 User: 'Create a Photoshop card'"]

    subgraph Process["AI Assistant"]
        CTX["1. Add context<br/>(surface, locale)"]
        RAG["2. RAG retrieves<br/>card requirements"]
        LLM["3. Claude generates<br/>tool call"]
        MCP["4. MCP creates<br/>card in AEM"]
    end

    RESULT["✅ Card created with preview"]

    USER --> CTX --> RAG --> LLM --> MCP --> RESULT

    style CTX fill:#E3F2FD
    style RAG fill:#F3E5F5
    style LLM fill:#FF9900,color:#fff
    style MCP fill:#E8F5E9
```

---

# Key Takeaways

| Concept | What It Does |
|---------|--------------|
| **Architecture** | Chat UI → AI Service → AWS → MCP → AEM |
| **Flow** | Context enrichment → RAG → Claude → Tool execution |
| **RAG** | Grounds AI responses in actual documentation |
| **MCP** | Turns AI conversations into real actions |

**Result:** Content managers describe what they want in plain English, and it happens.

---

<!-- _class: lead -->
<!-- _backgroundColor: #1473E6 -->
<!-- _color: white -->

# Demo Time!

---

# Demo Highlights

1. **Natural Language Search**
   "Find all Photoshop cards" → Shows results instantly

2. **AI Card Creation**
   "Create a plans card for Photoshop" → Card appears with validation

3. **Bulk Operations**
   "Publish all of these" → Preview, approve, track progress

4. **Platform Knowledge**
   "What is Odin?" → Accurate answer from RAG

---

<!-- _class: lead -->
<!-- _backgroundColor: #1473E6 -->
<!-- _color: white -->

# Questions?
