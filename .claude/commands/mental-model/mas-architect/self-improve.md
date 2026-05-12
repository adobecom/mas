---
name: mas-architect-self-improve
allowed-tools: Agent
description: Fetch recent PR reviews from the architect_reviewers list via gh api and update the reviewer expertise file with new patterns. Returns ~300 token summary to main context.
argument-hint: [pr_count (default 20)]
---

# Reviewer Mental Model: MAS Architect — Self-Improve

Spawn a **general-purpose subagent** with this prompt:

> Update `.claude/commands/mental-model/mas-architect/expertise.yaml`
> by analyzing recent PR reviews from reviewers listed in the file's `architect_reviewers` list.
>
> **Step 1**: Read the current expertise.yaml. Extract:
> - The `architect_reviewers` list (GitHub logins to query).
> - Existing values, red_flags, vocabulary so you can detect what's new.
>
> **Step 2**: Fetch recent PR numbers from the repo:
> ```bash
> gh api "repos/adobecom/mas/pulls?state=all&per_page=${1:-20}" --paginate \
>   --jq '.[] | select(.number) | .number' | head -${1:-20}
> ```
>
> **Step 3**: For each PR number, and for each login in `architect_reviewers`,
> fetch reviews and inline comments authored by that login. Build a jq filter
> from the list (e.g., `select(.user.login == "npeltier" or .user.login == "<other>")`).
> ```bash
> gh api "repos/adobecom/mas/pulls/{number}/reviews" \
>   --jq '.[] | select(.user.login == "<login_from_list>") | {state, body}'
> gh api "repos/adobecom/mas/pulls/{number}/comments" \
>   --jq '.[] | select(.user.login == "<login_from_list>") | {body, path, line}'
> ```
>
> **Step 4**: Analyze the fetched reviews for:
> - New vocabulary patterns not in review_vocabulary
> - New values or increased evidence for existing values
> - New red_flags or green_flags not captured
> - New domain_opinions expressed
> - New gotchas about review behavior
>
> **Step 5**: Edit expertise.yaml to add new findings. For existing values, append new evidence entries.
> For new patterns, add new entries to the appropriate section. Provenance (which login originated
> a quote) should be preserved in evidence lines when meaningful.
>
> **Step 6**: Validate:
> - `python3 -c "import yaml; yaml.safe_load(open('.claude/commands/mental-model/mas-architect/expertise.yaml'))"`
> - `wc -l .claude/commands/mental-model/mas-architect/expertise.yaml` (must be <= 1000)
>
> Return a summary (under 10 lines):
> - Reviewers queried: [list]
> - PRs analyzed: N
> - New patterns found: [list]
> - Values with new evidence: [list]
> - Sections updated: [list]
> - Final line count: N/1000

Do NOT read the expertise file in the main context. The subagent handles it.
