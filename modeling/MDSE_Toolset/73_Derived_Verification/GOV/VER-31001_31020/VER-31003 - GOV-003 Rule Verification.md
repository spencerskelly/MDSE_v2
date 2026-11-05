---
type: Verification
subtype: test
id: VER-31003
uid: 20261022043200003skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: GOV-003
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31003::TestVER31003
---
# GOV-003 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[GOV-003]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31005 - GOV-003 Statement 1]]
- [[REQ-31006 - GOV-003 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A rule with status Unreviewed is visible but not binding.
- [ ] Clause 2: No build work may depend on an Unreviewed rule until the owner sets it to Active.

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
- Source rule: [[GOV-003]]
- Analysis: [[GOV-003 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31003 {
    verification def TestVER31003 {
        doc /* Candidate verification of GOV-003; execution and clause-level acceptance are pending. */
    }
}
```
