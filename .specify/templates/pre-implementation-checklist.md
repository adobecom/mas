# MAS Pre-Implementation Checklist

**MANDATORY: Complete this checklist BEFORE writing any code.**

This checklist enforces Constitution Principles VIII (YAGNI) and IX (Root Cause First).

---

## 1. Understanding Check

Before proposing ANY changes, verify you understand the code:

- [ ] I have READ the file(s) I'm about to modify
- [ ] I can explain what the current code does in one sentence:
  > _____________________________________________________
- [ ] I understand WHY this code exists (its purpose, not just what it does)

**If any answer is NO**: Stop and read the code first.

---

## 2. Root Cause Analysis

Do not proceed until you've identified the actual root cause:

- [ ] Root cause identified:
  > _____________________________________________________
- [ ] I asked "why does this happen?" at least 3 times:
  - Why 1: _______________________________________________
  - Why 2: _______________________________________________
  - Why 3: _______________________________________________
- [ ] This is NOT a symptom-level fix (setTimeout, retry, null check for impossible case)

**If root cause is unclear**: Investigate more before implementing.

---

## 3. Minimal Solution Check

Verify you're implementing the smallest possible change:

- [ ] Can this be fixed by DELETING code?
  - If YES: Delete instead of adding
  - If NO: Explain why deletion won't work: _______________

- [ ] Can this be fixed in <10 lines?
  - If YES: Proceed with minimal change
  - If NO: Justify why more lines are needed: _______________

- [ ] Am I creating a new function?
  - If YES: Can this be inline instead? _______________
  - If NO: Good, inline is usually better

- [ ] Am I adding error handling?
  - If YES: Confirm the error scenario is actually possible: _______________
  - If NO: Good, don't add defensive code for impossible cases

- [ ] Am I adding a new parameter/configuration?
  - If YES: Is this value ever going to change? _______________
  - If NO: Good, use constants for fixed values

---

## 4. MAS-Specific Checks

Verify compliance with MAS conventions:

- [ ] No underscore prefix for variables (use `#` for private fields)
- [ ] Using getters instead of `querySelector()` for DOM access
- [ ] No inline styles in HTML tags
- [ ] No inline comments (unless logic is complex)
- [ ] No TypeScript syntax
- [ ] Spectrum imports added to `swc.js` (not direct imports)
- [ ] No `::part` selectors on Spectrum components
- [ ] No hardcoded variant fallback values
- [ ] Variation logic uses `previewFragmentForEditor` (not custom logic)
- [ ] **NOT modifying shared utilities for component-specific behavior**
  - If modifying `hydrate.js`, `merch-card.js`, or files in `src/` root: STOP
  - Can this be solved with a getter in the component file instead?
  - Can this be solved with conditional rendering in the component?

---

## 5. Alternatives Considered

Document simpler alternatives you considered and why you rejected them:

| Alternative | Why Rejected |
|-------------|--------------|
| 1. _________ | ____________ |
| 2. _________ | ____________ |

**If you can't think of alternatives**: You haven't thought about this enough.

---

## 6. Final Verification

- [ ] Estimated lines of code to change: ___
- [ ] This change is proportional to the problem complexity
- [ ] I have checked the anti-patterns document and am not repeating any
- [ ] If this were code review, I would approve this approach
- [ ] I will run the linter after making changes

---

## Post-Implementation Checklist

After implementing, verify:

- [ ] Ran linter on all modified files (`npm run lint`)
- [ ] Removed any unused imports created by changes
- [ ] Removed any functions that became unused
- [ ] No commented-out code left behind
- [ ] No console.logs left behind (unless intentional)
- [ ] Searched for all references to modified code to ensure nothing broke

---

## Usage

1. Copy this checklist into your response BEFORE proposing code changes
2. Fill out each section honestly
3. If any section raises concerns, investigate before proceeding
4. Reference this completed checklist when presenting your solution

---

## Quick Decision Tree

```
Is this a bug fix?
├── YES → Have you identified the root cause?
│   ├── NO → Stop. Investigate more.
│   └── YES → Is this a component-specific issue?
│       ├── YES → Can a getter/conditional render in the component fix it?
│       │   ├── YES → Implement in component. Done.
│       │   └── NO → Consider minimal change to component.
│       └── NO (shared behavior) → Can you fix it by deleting code?
│           ├── YES → Delete. Done.
│           └── NO → Minimal change. Proceed.
└── NO (new feature) → Is this feature explicitly requested?
    ├── NO → Stop. YAGNI.
    └── YES → Can it be <10 lines?
        ├── YES → Inline implementation. Proceed.
        └── NO → Justify complexity. Then proceed.
```

---

## References

- Constitution: `.specify/memory/constitution.md`
- Anti-patterns: `.specify/memory/anti-patterns.md`
- Constitution Principle VIII: Minimal Implementation (YAGNI)
- Constitution Principle IX: Root Cause First

---

**Version**: 2.0.0 | **Created**: 2026-01-06
