# Mental Models — AI Agent Domain Knowledge System

## What Is a Mental Model?

A **mental model** is a structured, YAML-encoded knowledge base that gives an AI agent
accurate, validated domain expertise. Each mental model covers one domain (e.g. `mas-studio`,
`mas-io`) or one reviewer role (e.g. `mas-architect`) and acts as the agent's **primary
reference** before reading source files or reviewing PRs.

> **For AI agents**: treat `expertise.yaml` as authoritative ground truth. Validate claims
> against source before acting, but trust the expertise file's structural view over inference.

## Two Model Types

### Domain Models
Model a codebase area (e.g., `mas-studio`, `mas-io`). Schema: `overview`, `key_files`,
`patterns`, `data_shapes`, `integration_points`, `gotchas`, `best_practices`.

### Reviewer Models
Model a reviewer role (e.g., `mas-architect`). Schema: `architect_reviewers` (list of
GitHub logins seeding the model), `overview`, `ownership_map`, `values` (ranked),
`red_flags`, `green_flags`, `review_vocabulary`, `domain_opinions`, `gotchas`.

---

## Architecture: Subagent Isolation

**All mental model queries run in subagents**, not the main conversation. The expertise.yaml
(~4,000-10,000 tokens) loads in an isolated context that is discarded after returning a concise
answer (~200-500 tokens). This gives **~90% context window savings** per query.

---

## Directory Structure

```
.claude/commands/mental-model/
├── README.md                         ← this file
├── mas-architect/                    ← reviewer model (role-based)
│   ├── expertise.yaml                ← architect_reviewers list + values, red_flags, vocabulary
│   ├── question.md                   ← "Would the MAS architect flag this?"
│   ├── plan.md                       ← load architect values before planning a PR
│   ├── self-improve.md               ← refresh from architect_reviewers' recent PR comments via gh api
│   ├── plan_build_improve.md         ← end-to-end: plan → build → refresh model
│   └── evals/
│       └── evals.json                ← 3 evaluation scenarios
├── {domain}/                         ← domain model (future)
│   ├── expertise.yaml
│   ├── question.md, plan.md, self-improve.md, plan_build_improve.md
│   └── evals/evals.json
```

---

## Available Models

| Model | Type | What It Covers |
|-------|------|----------------|
| `mas-architect` | Reviewer (role) | MAS tech-lead architect — review values, red flags, vocabulary derived from real PR review history of reviewers listed in `architect_reviewers` |

---

## Commands per Model

Each model exposes four slash commands: `/mental-model:{model}:{command} [args]`.

### `question` — Read-only Q&A (via subagent)
```
/mental-model:mas-architect:question Would the MAS architect flag a method named renderSearchControls()?
```

### `plan` — Expertise-informed planning (via subagent)
```
/mental-model:mas-architect:plan Add locale support to variant picker
```

### `self-improve` — Validate and update expertise (via subagent)
```
/mental-model:mas-architect:self-improve
```
For reviewer models: reads `architect_reviewers` list, fetches each login's recent PR comments via `gh api`.
For domain models: validates file paths and function names against codebase.

### `plan_build_improve` — End-to-end workflow (chained subagents)
```
/mental-model:mas-architect:plan_build_improve Add translation support
```

---

## How to Add a New Mental Model

Use the meta-mental-model skill or manually:

1. Create `.claude/commands/mental-model/{model}/expertise.yaml` (for reviewer models, include an `architect_reviewers` list of GitHub logins seeding the model)
2. Create the 4 command files (use subagent delegation pattern)
3. Create `evals/evals.json` with 3 eval scenarios
4. Run `self-improve` to validate

---

## Maintenance

| Trigger | Action |
|---------|--------|
| Source files changed in a domain | Run `/mental-model:{domain}:self-improve true` |
| New PR reviews from listed reviewers | Run `/mental-model:{model}:self-improve` |
| Expertise claim not found | Remove or correct — never leave stale data |
