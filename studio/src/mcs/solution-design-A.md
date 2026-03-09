# MCS Integration: Solution Comparison

## Solution A — Lightweight On-Demand Sync from MCS

**Scope: Focused | Effort: Low–Medium**

Adds MCS awareness to the existing card editing experience without introducing a new surface, new fragments, or a placeholder system.

**What it does:**

- Adds a single `mcs-metadata` IO action that returns AOS metadata (last updated timestamp, product name) for all Product Arrangements at once, loaded once per session and cached. Each card is linked to its PA via the existing `osi` field.
- Surfaces a staleness indicator in three places: the table view (new MCS status column), the render/card view (badge overlay), and the card editor (status banner), whenever AOS has a newer update than the card's last sync.
- Adds an MCS Sync panel inside the card editor with a "Sync All" option and a "Sync Fields..." option that shows current AOS values alongside card values for field-level selection before applying.
- Tracks sync history on the card itself via two new fragment fields: `mcsUpdated` (timestamp) and `mcsUpdatedBy` (user identity), written after every sync operation.

**New infrastructure:** One IO Runtime action, one client-side utility module, two new card CF model fields, and targeted additions to the table, render, and card editor components.
