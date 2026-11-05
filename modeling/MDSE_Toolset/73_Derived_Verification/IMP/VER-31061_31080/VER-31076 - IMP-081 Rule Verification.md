---
type: Verification
subtype: test
id: VER-31076
uid: 20261022043200076skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-081
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31076::TestVER31076
---
# IMP-081 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-081]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31144 - IMP-081 Statement 1]]
- [[REQ-31145 - IMP-081 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A change to any existing value requires approval, including EA-owned fields.
- [ ] Clause 2: Approval is given before the run (pre-approval, by field selection in the Start step) or after the run (review approval).

## Proposed test procedure

**Given:** Synthetic EA/QEAX source rows covering the specified element, connector, field or failure category.

**When:** Preflight, translate, create a ledger, re-import and inspect model output.

**Then:** Compare the rule's mapped semantics, flags, identity, source accounting and change disposition with expected values.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/importer.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/importer/test/preflight.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[IMP-081]]
- Analysis: [[IMP-081 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31076 {
    verification def TestVER31076 {
        doc /* Candidate verification of IMP-081; execution and clause-level acceptance are pending. */
    }
}
```
