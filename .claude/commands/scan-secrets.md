---
description: Audit ~/.claude/, mas/.claude/, and mas-claude-config/ for files containing secrets (PATs, AWS keys, API tokens, PEM keys). Reports redacted findings.
---

# Scan for existing secrets

Run the secret-audit script and report findings. Don't act on them — just surface them so the user can rotate + remove.

```bash
python3 /Users/axelcurenobasurto/.claude/hooks/scripts/scan-existing-secrets.py
```

If `--include-low` is passed in `$ARGUMENTS`, include JWT findings (noisy because AEM auth headers in session logs match):

```bash
python3 /Users/axelcurenobasurto/.claude/hooks/scripts/scan-existing-secrets.py $ARGUMENTS
```

After the report:
1. Summarize what was found by tier (SHAPE / HIGH / MEDIUM / entropy).
2. For each HIGH or SHAPE finding, recommend immediate rotation of the credential (the secret has already leaked to disk).
3. For MEDIUM findings in `.claude/` plan or note files, suggest replacing the literal with a `${process.env.X}` placeholder or removing the file if it's no longer needed.
4. Do NOT echo the actual secret value — the redacted form (`prefix…suffix`) is enough for the user to identify it.
