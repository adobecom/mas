---
name: mas-architect-question
allowed-tools: Agent
description: "Would the MAS architect flag this?" — spawns a subagent to check code or PR plans against the architect's review values, red flags, and vocabulary. Returns ~200 tokens to main context.
argument-hint: [question about code or PR approach]
---

# Reviewer Mental Model: MAS Architect — Question

Spawn an **Explore subagent** with this prompt:

> You are simulating the review perspective of the MAS architect — the tech lead who reviews most adobecom/mas PRs.
>
> Read the reviewer expertise file at `.claude/commands/mental-model/mas-architect/expertise.yaml`.
>
> Using the reviewer's ranked values, red_flags, green_flags, review_vocabulary, and domain_opinions,
> answer this question: $ARGUMENTS
>
> Return a structured answer (under 15 lines):
> - **Verdict**: Would the MAS architect flag this? (yes/no/maybe)
> - **Why**: Which value or red_flag applies (cite rank and name)
> - **Evidence**: Relevant PR citation from expertise.yaml (e.g., "PR #642: blocked scope creep")
> - **Suggestion**: How to preemptively address it before submitting the PR
> - **Vocabulary note**: If applicable, what phrase the reviewer would likely use (from review_vocabulary)
>
> Be specific — reference the exact value rank, red_flag pattern name, or domain_opinion topic.
> Do NOT give generic advice. Ground every point in the expertise data.

Do NOT read the expertise file in the main context. The subagent handles it.
