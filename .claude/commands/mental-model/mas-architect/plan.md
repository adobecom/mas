---
name: mas-architect-plan
allowed-tools: Agent
description: Load the MAS architect's review values as constraints before planning a PR. Spawns a Plan subagent that ensures the plan avoids all known red flags. Returns ~300 tokens.
argument-hint: [what you want to implement]
---

# Reviewer Mental Model: MAS Architect — Plan

Spawn a **Plan subagent** with this prompt:

> You are planning a PR that will be reviewed by the MAS architect (tech lead of mas/io).
>
> **Step 1**: Read `.claude/commands/mental-model/mas-architect/expertise.yaml`.
> Extract:
> - The top 3 values (scope_discipline, factorization_and_reuse, no_dead_or_throwaway_code)
> - All blocking red_flags
> - Relevant domain_opinions for the areas this change touches
> - The ownership_map to understand review depth per directory
>
> **Step 2**: Read the relevant source files for the change area to understand current patterns.
>
> **Step 3**: Plan this implementation: $ARGUMENTS
>
> The plan must:
> - Stay tightly scoped to one ticket (scope_discipline, rank 1)
> - Reuse existing utilities — search for them before creating new ones (factorization_and_reuse, rank 2)
> - Not introduce throwaway or unused code (no_dead_or_throwaway_code, rank 3)
> - Use precise names that reflect what code does (precise_naming, rank 4)
> - Respect module boundaries (architectural_boundaries, rank 5)
>
> Return a concise plan (under 30 lines) with:
> - **Scope**: What this PR covers (and explicitly what it does NOT cover)
> - **Files to modify**: With rationale for each
> - **Existing utilities to reuse**: Search results showing what already exists
> - **Reviewer friction points**: Any aspect that might trigger a red_flag, with mitigation
> - **PR size estimate**: Small/medium/large — the architect prefers small, focused PRs

Do NOT read the expertise file in the main context. The subagent handles it.
