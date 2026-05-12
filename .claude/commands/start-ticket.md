---
description: Start working on a Jira ticket — fetches Jira context first, then explores codebase and FluffyJaws in parallel using ticket keywords, checks worktree status, and presents a structured briefing.
argument-hint: <MWPW-XXXXX or PR URL>
---

# Start Ticket

You are starting work on a Jira ticket. Follow these phases in order.

## Phase 1: Input Parsing

Extract the ticket number from `$ARGUMENTS`:

1. **Direct ticket**: If `$ARGUMENTS` matches `MWPW-\d+`, use it directly
2. **PR URL**: If `$ARGUMENTS` is a GitHub PR URL, run `gh pr view <url> --json headRefName -q .headRefName` and extract `MWPW-\d+` from the branch name
3. **Empty**: If `$ARGUMENTS` is empty, run `git branch --show-current` and extract `MWPW-\d+`

If no ticket number can be resolved, ask the user: "Could not detect a ticket number. What MWPW ticket are you working on?"

Store the resolved ticket as `TICKET` (e.g., `MWPW-191570`).

## Phase 2: Worktree Check

Run:
```bash
cd /Users/mirafedas/Desktop && bash worktrees/wt list
```

Check if `TICKET` appears in the output:
- **Worktree exists**: Note the path and port assignment. Report it to the user.
- **No worktree**: Run `bash worktrees/wt new TICKET` from `/Users/mirafedas/Desktop`. Report the created path and port assignment to the user.

## Phase 3: Jira Context (sequential — runs first)

Launch **1 agent** to fetch Jira context. This must complete before Phase 4 because its output feeds the downstream agents.

Use the `ticket-context-gatherer` agent definition as guidance. Prompt the agent with:
> Gather full context for Jira ticket TICKET.
>
> 1. Call `mcp__corp-jira__search_jira_issues` with JQL: `key = TICKET`
>    Extract: summary, description, acceptance criteria, status, assignee, priority, linked issues, epic
> 2. Call `mcp__corp-jira__get_jira_comments` with issueKey: TICKET
>    Extract: last 5 comments with authors and dates
> 3. Call `mcp__fluffyjaws__jira_ticket_search` with the ticket ID for enriched context
>
> Return a structured summary with: Title, Description, Acceptance Criteria (numbered), Status, Assignee, Priority, Linked Issues, and Key Comments.

Once this agent returns, store the **ticket summary**, **description**, and **key terms** (component names, feature areas) for use in Phase 4.

## Phase 4: Codebase + FluffyJaws Research (parallel)

Launch **2 agents in parallel** (both in a single message with multiple Agent tool calls). Pass the Jira summary and key terms from Phase 3 to both agents.

### Agent A: Codebase Explorer (use subagent_type: Explore)

Prompt the agent with:
> I'm starting work on Jira ticket TICKET: "[paste ticket title and description from Phase 3]"
>
> Key terms from the ticket: [extract component names, feature areas, and technical keywords from the Jira description]
>
> Search for:
> - Files matching the key terms (use Glob and Grep)
> - Related test files in `nala/`, `web-components/test/`
> - Configuration or model files that might be affected
> - Similar past implementations or patterns
> - Predecessor ticket commits (check `git log --oneline --grep="PREDECESSOR_TICKET"` for any linked issues)
>
> Return: list of relevant files with brief purpose annotations, existing test coverage for affected areas, and any related patterns found.

### Agent B: FluffyJaws Research

Prompt the agent with:
> Search for additional context about Jira ticket TICKET: "[paste ticket title from Phase 3]"
>
> Key terms: [component names, feature areas from Jira description]
>
> 1. Call `mcp__fluffyjaws__slack_search` with query: "TICKET" to find Slack discussions
> 2. Call `mcp__fluffyjaws__slack_search` with key component/feature terms from the ticket (e.g., "pagination studio", "card picker performance")
> 3. Call `mcp__fluffyjaws__wiki_documentation_search` with the specific feature/component keywords
> 4. Call `mcp__fluffyjaws__full_documentation_search` with the feature topic for broader docs
>
> Return: relevant Slack discussions (summarized), wiki/documentation links, architectural context, and any team decisions found.

## Phase 5: Context Synthesis

After all agents return, combine their findings into a structured briefing. **Before presenting it, save it to `.claude/plans/TICKET-context.md`** (relative to current working directory — lands in the worktree if one is active). This file persists the briefing across sessions and is available to subagents during implementation.

Present it to the user:

```
# Ticket Briefing: TICKET

## Summary
[One-paragraph summary from Jira description]

## Acceptance Criteria
1. [From Jira ticket]
2. ...

## Status
- **Status**: [current status]
- **Assignee**: [assignee]
- **Priority**: [priority]
- **Epic/Parent**: [if any]

## Codebase Impact
- **Primary files**: [list from explorer agent]
- **Test coverage**: [existing tests for affected areas]
- **Related patterns**: [similar implementations found]

## Additional Context
- **Slack discussions**: [key points from FluffyJaws]
- **Wiki/docs**: [relevant links]
- **Related tickets**: [linked issues from Jira]

## Key Comments
[Notable discussion points from Jira comments]

## Worktree
- **Status**: [created/exists/not created]
- **Path**: [worktree path if applicable]
- **AEM port**: [port if applicable]
```

## Phase 6: Next Steps

After presenting the briefing (and confirming `TICKET-context.md` was saved), ask the user which mode they want:

```
How would you like to proceed?

A) Spec-driven (recommended for complex features) — brainstorm → plan → implement with subagents
B) Plan only — skip brainstorming, go straight to implementation plan
C) Start coding — jump in directly
```

Wait for the user's choice, then:

### Option A: Spec-driven flow

**Mental model pre-check (automatic):** Before brainstorming, check if any primary files from the Phase 5 briefing overlap with the MAS architect's ownership areas (`io/www/`, `io/studio/`, `studio/src/`, `web-components/src/`). If any do, spawn an Explore subagent:

> Read `.claude/commands/mental-model/mas-architect/expertise.yaml`.
> For planned changes to [files from briefing], return the architect's top 3 relevant red_flags and any domain_opinions that apply. Keep under 10 lines.

Pass the returned constraints as additional context into brainstorming.

**Brainstorming:** Invoke `superpowers:brainstorming` with the full ticket briefing from Phase 5 as pre-loaded context:

> Context already gathered:
> [paste full briefing from Phase 5]
> [paste architect constraints if applicable]
>
> Skip the research phase. Use this context to frame the problem, identify risks and open questions, then produce a spec.

After brainstorming completes, automatically invoke `superpowers:writing-plans`. Save the plan to `.claude/plans/TICKET.md` (relative to current working directory — lands in the worktree if one is active).

**Pipeline selection:** Ask which pipeline to use:
```
Which pipeline?
A) plan-build       — implement only
B) plan-build-test  — implement + run tests
C) full             — implement + test + review + PR
```

After the plan is saved, write a state file at `.claude/plans/TICKET-state.json`:
```json
{
  "ticket": "TICKET",
  "branch": "TICKET",
  "worktree": "<worktree path or empty if main repo>",
  "plan": ".claude/plans/TICKET.md",
  "phase": "build",
  "pipeline": "<chosen pipeline>",
  "tasks_completed": 0,
  "tasks_total": <count of - [ ] checkboxes in plan>
}
```

Then ask:
```
Plan saved to .claude/plans/TICKET.md

Execute now with subagents (fresh context per task), or save for a future session?
(To resume later: /resume TICKET)
```

If executing now: invoke `superpowers:subagent-driven-development`. After all tasks complete, continue the pipeline:
- `plan-build-test` → run `/nala` or `/mas-test` depending on what changed (UI changes → nala, unit logic → mas-test)
- `full` → test phase, then `/review-pr`, then `mas-pr-creator`

If saving for later: remind the user to run `/resume TICKET` in any future session.

### Option B: Plan only

Invoke `superpowers:writing-plans` directly with the ticket briefing as context. Apply the same mental model pre-check if files touch the architect's areas. Save plan to `.claude/plans/TICKET.md` and write state file with `"phase": "build"`.

### Option C: Start coding

Summarise the key files and acceptance criteria from the briefing and begin implementation.
