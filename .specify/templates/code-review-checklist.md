# Code Review Checklist

**Purpose**: Validate code changes against verbosity and quality standards.

Use this checklist to review AI-generated code or any code before merging.

---

## 1. Verbosity Checks

### Functions & Abstractions

- [ ] No helper functions for single-use operations
  - Question: Is every function called 3+ times?
  - Violation: Function exists but only called once

- [ ] No premature abstractions
  - Question: Does every abstraction have multiple concrete uses today?
  - Violation: Abstract class with only one implementation

- [ ] No over-parameterized functions
  - Question: Are all parameters actually used in the codebase?
  - Violation: Function has 5 parameters but only 2 are ever passed

### Error Handling

- [ ] No "just in case" error handling
  - Question: Can this error actually occur?
  - Violation: Try-catch around code that can't throw

- [ ] No defensive null checks for guaranteed values
  - Question: Can this value actually be null at this point?
  - Violation: `if (!fragment) return` when caller guarantees fragment exists

- [ ] No retry logic hiding bugs
  - Question: Why does this need retrying?
  - Violation: Retry loop without understanding root cause of failures

### Configuration & Constants

- [ ] No configurable values that never change
  - Question: Will this value ever be different?
  - Violation: Config object for hardcoded values

- [ ] No backwards-compatibility shims for internal code
  - Question: Do we control all callers?
  - Violation: Deprecated alias functions instead of updating call sites

---

## 2. Root Cause Checks

- [ ] Fix addresses root cause, not symptom
  - Question: Why did the bug occur?
  - Violation: setTimeout to "fix" race condition without understanding why

- [ ] No TODO/FIXME for "proper fix later"
  - Question: Why isn't this the proper fix now?
  - Violation: `// TODO: fix this properly` comment

- [ ] No workarounds that should be permanent fixes
  - Question: Is this the right solution or a band-aid?
  - Violation: Catching and ignoring errors instead of preventing them

---

## 3. Code Quality Checks

- [ ] Line count change is proportional to feature complexity
  - Guideline: Simple bug fix = <20 lines, Medium feature = <100 lines
  - Violation: 200 lines changed for a simple bug fix

- [ ] No redundant code paths
  - Question: Is every branch reachable and necessary?
  - Violation: `if (x) { return a } else { return a }` (both branches identical)

- [ ] No excessive comments
  - Question: Could the code be clearer instead of commented?
  - Violation: Comments explaining obvious operations

- [ ] No excessive logging
  - Question: Is every log statement necessary for debugging/monitoring?
  - Violation: console.log for every internal operation

---

## 4. Constitution Compliance

- [ ] Principle I (Clean Code): No dead code introduced
- [ ] Principle II (Generic Over Specific): No hardcoded variant values
- [ ] Principle III (No Logic Duplication): Not duplicating existing logic
- [ ] Principle IV (Focused PRs): Change is focused and minimal
- [ ] Principle V (Code Style): Follows naming conventions
- [ ] Principle VI (Vanilla JS): No TypeScript
- [ ] Principle VII (Spectrum): Proper Spectrum usage
- [ ] Principle IX (YAGNI): Only implements what's needed
- [ ] Principle X (Root Cause): Addresses actual root cause

---

## 5. Anti-Pattern Check

Review against documented anti-patterns:

- [ ] Not an "Unnecessary Abstraction" (creating function for one-time use)
- [ ] Not "Defensive Over-Handling" (null checks for impossible cases)
- [ ] Not "Config Over Constants" (config for unchanging values)
- [ ] Not "Root Cause Avoidance" (setTimeout/retry instead of fixing)
- [ ] Not "Premature Generalization" (building for hypothetical future)
- [ ] Not "Backwards-Compatibility Theater" (shims when we control all code)

---

## Scoring

| Category | Pass/Fail |
|----------|-----------|
| Verbosity Checks | [ ] Pass / [ ] Fail |
| Root Cause Checks | [ ] Pass / [ ] Fail |
| Code Quality Checks | [ ] Pass / [ ] Fail |
| Constitution Compliance | [ ] Pass / [ ] Fail |
| Anti-Pattern Check | [ ] Pass / [ ] Fail |

**Overall**: [ ] Approved / [ ] Changes Requested

---

## References

- Constitution: `.specify/memory/constitution.md`
- Anti-patterns: `.specify/memory/anti-patterns.md`
- Pre-implementation: `.specify/templates/pre-implementation-checklist.md`
