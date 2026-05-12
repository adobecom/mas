---
name: tickets
description: Show status of all in-flight tickets — scans state.json files across the main repo and all active worktrees.
---

# Tickets Status

Show all in-flight tickets and their progress.

## Step 1: Find All State Files

Scan these locations for `*-state.json` files:

```bash
# Main repo
ls .claude/plans/*-state.json 2>/dev/null

# All worktrees
ls /Users/mirafedas/Desktop/worktrees/*/.claude/plans/*-state.json 2>/dev/null
```

If no state files found: "No in-flight tickets found. Run `/start-ticket MWPW-XXXXX` to begin."

## Step 2: For Each State File

Read the JSON and recount progress from the plan file (same as `/resume`):
- `tasks_completed` = count `- [x]` lines in plan file
- `tasks_total` = count all `- [ ]` + `- [x]` lines
- If plan file missing: mark as `plan missing`

## Step 3: Present Summary Table

```
# In-Flight Tickets

| Ticket       | Phase   | Progress | Pipeline   | Worktree        |
|--------------|---------|----------|------------|-----------------|
| MWPW-123456  | build   | 3/8      | plan-build | worktrees/MWPW-123456 |
| MWPW-789012  | review  | 8/8      | full       | main repo       |
| MWPW-345678  | plan    | 0/0      | plan-only  | worktrees/MWPW-345678 |
```

Then offer:
```
Actions: /resume <TICKET> to continue, /start-ticket <TICKET> to re-brief
```
