---
name: mas-architect-plan-build-improve
allowed-tools: Agent
description: End-to-end workflow with the MAS architect's review values as constraints. Chains plan -> build -> refresh reviewer model via sequential subagents.
argument-hint: [implementation_request]
---

# Reviewer Mental Model: MAS Architect — Plan Build Improve

Chain three subagents sequentially:

**Step 1 — Plan** (Plan subagent):
> Read `.claude/commands/mental-model/mas-architect/expertise.yaml`.
> Plan this implementation with the architect's values as constraints: $ARGUMENTS
> Ensure the plan avoids all red_flags and follows the documented domain_opinions.
> Return the plan for user review.

Wait for user approval of the plan before proceeding.

**Step 2 — Build** (general-purpose subagent):
> Implement the approved plan from Step 1.
> Follow the architect's coding preferences:
> - Reuse existing utilities (value rank 2)
> - Use precise naming (value rank 4)
> - Respect module boundaries (value rank 5)
> - Use correct error semantics (value rank 6)
> Return a summary of files changed.

**Step 3 — Self-Improve** (general-purpose subagent):
> Read the `architect_reviewers` list in `.claude/commands/mental-model/mas-architect/expertise.yaml`.
> Fetch the most recent 10 PR reviews from those reviewers via gh api.
> Update `.claude/commands/mental-model/mas-architect/expertise.yaml`
> with any new patterns discovered.
> Return a summary of changes to the expertise file.
