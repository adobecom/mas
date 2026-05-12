---
name: resume
description: Resume work on a ticket from where you left off. Reads state file to show progress and continues from the right phase.
argument-hint: <MWPW-XXXXX>
---

# Resume Ticket

Resume work on a ticket using its persisted state.

## Step 1: Resolve Ticket

Extract ticket from `$ARGUMENTS` using the same logic as `start-ticket` (direct ticket, current branch, or ask).

## Step 2: Load State

Read `.claude/plans/TICKET-state.json` (relative to current working directory — check worktree if active).

If not found, check `../mas/.claude/plans/TICKET-state.json` and common worktree paths.

If still not found:
> "No state file found for TICKET. Has `/start-ticket` been run for this ticket yet? If you have a plan file, run `/superpowers:executing-plans` and point it at `.claude/plans/TICKET.md`."

**Always recount tasks from the plan file — do not trust `tasks_completed` in state.json.** It may be stale.

Read the plan file and count:
- `tasks_total` = number of `- [ ]` + `- [x]` lines
- `tasks_completed` = number of `- [x]` lines
- `next_task` = first `- [ ]` line and its parent task heading

Also check for `.claude/plans/TICKET-context.md` — if present, read it for full briefing context.

Update `tasks_completed` and `tasks_total` in state.json with the recounted values before presenting status.

## Step 3: Present Status

Show a concise status block:

```
# Resuming TICKET

Plan:      .claude/plans/TICKET.md
Context:   .claude/plans/TICKET-context.md (present/missing)
Branch:    TICKET
Worktree:  /path/to/worktree (or: main repo)
Phase:     build  (plan → [build] → review → done)
Progress:  3 / 8 tasks completed  ← recounted from plan file

Last completed: Task 3 — Write unit tests for X
Next up:        Task 4 — Implement Y
```

## Step 4: Offer Options

```
How would you like to continue?

A) Continue from Task 4 (next unchecked task)
B) Show full plan
C) Jump to a specific task
D) Switch phase (e.g. skip to review)
```

## Step 5: Execute

**Option A / C**: Invoke `superpowers:executing-plans` or `superpowers:subagent-driven-development`, passing:
- The plan file path
- The task number to start from

Update `TICKET-state.json` after each completed task: increment `tasks_completed`, update `phase` if all tasks in current phase are done.

**Option D**: Update `phase` in `TICKET-state.json`, then invoke the appropriate skill:
- `review` phase → `superpowers:requesting-code-review`
- `ship` phase → `commit-commands:commit-push-pr`

## State Update

After each task completes, write updated state back to `TICKET-state.json`:
```json
{
  "ticket": "MWPW-123456",
  "branch": "MWPW-123456",
  "worktree": "/path/to/worktree",
  "plan": ".claude/plans/MWPW-123456.md",
  "phase": "build",
  "pipeline": "plan-build",
  "tasks_completed": 4,
  "tasks_total": 8
}
```
