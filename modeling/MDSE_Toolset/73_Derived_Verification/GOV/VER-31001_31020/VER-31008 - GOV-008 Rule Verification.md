---
type: Verification
subtype: test
id: VER-31008
uid: 20261022043200008skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: GOV-008
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31008::TestVER31008
---
# GOV-008 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[GOV-008]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31015 - GOV-008 Statement 1]]
- [[REQ-31016 - GOV-008 Statement 2]]
- [[REQ-31017 - GOV-008 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: One clean Translator Definition file states what the stage 1 translator must do and is updated whenever a change is made.
- [ ] Clause 2: The import reads the .qeax directly
- [ ] Clause 3: CSV files only defined the rules.

## Proposed test procedure

**Given:** The actual repository governance, ruleset, decisions and configured CI.

**When:** Inspect or execute the applicable review, change or release policy.

**Then:** Check the policy obligation and decision references; use human approval evidence for responsibilities that are not machine-testable.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `scripts/check-rules.mjs` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `.github/workflows/ci.yml` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[GOV-008]]
- Analysis: [[GOV-008 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31008 {
    verification def TestVER31008 {
        doc /* Candidate verification of GOV-008; execution and clause-level acceptance are pending. */
    }
}
```
