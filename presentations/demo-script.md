# M@S AI Assistant Demo Script

## Pre-Demo Checklist

- [ ] MAS Studio open and logged in
- [ ] Navigate to Commerce surface
- [ ] AI Chat panel visible
- [ ] Browser zoomed appropriately for screen sharing

---

## Demo 1: Natural Language Search (2 min)

**Say:** "Instead of navigating folder structures or remembering filter options, content managers can simply ask for what they need."

**Type:** `Find all Photoshop cards`

**Point out:**
- Results appear with card previews
- No surface specified - it knew from context
- Every result has direct link to edit or preview

**Hover** over a result to show instant preview.

---

## Demo 2: AI-Powered Card Creation (3 min)

**Say:** "Creating a new card used to require knowing which fields are required, what formats to use, and how to structure the content. Now you just describe what you want."

**Type:** `Create a plans card for Photoshop with annual pricing and a Buy Now button`

**Wait** ~5 seconds for generation.

**Point out:**
- Card preview appears
- Green validation checkmarks
- AI knew plans cards need specific fields

**Click** "Publish" to demonstrate one-click publishing.

**Say:** "From idea to published card in under 30 seconds."

---

## Demo 3: Bulk Operations (3 min)

**Say:** "Content managers often need to update multiple cards at once. The AI makes this safe by showing you exactly what will change before anything happens."

**Type:** `Find all draft cards`

**Show** the results.

**Type:** `Publish all of these`

**Point out:**
- Preview panel showing affected cards
- "You always see what's about to happen before confirming"

**Click** "Approve"

**Point out:**
- Progress bar as cards are published
- Final success count: "X succeeded, 0 failed"

---

## Demo 4: Platform Knowledge (2 min)

**Say:** "New team members often have questions about our platform. Instead of searching documentation, they can just ask."

**Type:** `What's the difference between Odin and Freyja?`

**Show** the detailed response.

**Type:** `What fields are required for a catalog card?`

**Point out:**
- "These answers come from our actual documentation"
- "No hallucination - the AI only knows what we've taught it"

---

## Demo 5: Context Awareness (2 min)

**Say:** "The AI adapts to where you're working. Watch what happens when I switch surfaces."

**Action:** Switch from Commerce to **CCD surface** (top nav)

**Point out:**
- Suggested prompts changed (Slices, Action cards)
- "I never specified CCD - it knew from my context"

**Type:** `Create a slice card`

**Point out:**
- Automatically uses CCD-appropriate variant
- "Content teams on different surfaces get relevant suggestions"

---

## Common Q&A Responses

### "How do you prevent mistakes?"
"Three safeguards: First, the AI only knows what we've taught it through RAG - no hallucination. Second, bulk operations always show a preview before executing. Third, all cards are validated before publishing."

### "Can this work with other AI models?"
"Yes! MCP is an open standard. We use Claude today, but the architecture is model-agnostic. We could switch models without changing our tools."

### "How secure is this?"
"Users must be authenticated with Adobe IMS. Every operation uses that same authentication - the AI can only do what the user is authorized to do."

### "How do you keep the knowledge up to date?"
"Variant knowledge is computed automatically from our configuration - always current. Platform documentation is managed through code review, so it's version controlled."

### "What's the learning curve?"
"Minimal - they just type what they want. The context awareness handles most of the complexity. We've seen new team members productive within minutes."
