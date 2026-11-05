---
type: Verification
subtype: test
id: VER-31107
uid: 20261022043200107skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-118
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31107::TestVER31107
---
# IMP-118 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-118]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31204 - IMP-118 Statement 1]]
- [[REQ-31205 - IMP-118 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: An Association between a Use Case and an Actor is an `actor` usage in the use case, once; between a Use Case and another part it is the `participants` link on the use case.
- [ ] Clause 2: An Association between anything else is not evidence of a connection and stays a review row. (Test_Vault_ Association approval, V1 participants; D-0038)

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
- Source rule: [[IMP-118]]
- Analysis: [[IMP-118 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31107 {
    verification def TestVER31107 {
        doc /* Candidate verification of IMP-118; execution and clause-level acceptance are pending. */
    }
}
```
