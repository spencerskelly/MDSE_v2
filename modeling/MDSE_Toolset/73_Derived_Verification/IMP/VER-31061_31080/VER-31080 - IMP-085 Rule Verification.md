---
type: Verification
subtype: test
id: VER-31080
uid: 20261022043200080skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-085
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31080::TestVER31080
---
# IMP-085 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-085]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31151 - IMP-085 Statement 1]]
- [[REQ-31152 - IMP-085 Statement 2]]
- [[REQ-31153 - IMP-085 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A source record that disappears is reported with a `flagImport` callout.
- [ ] Clause 2: It is not deleted.
- [ ] Clause 3: This applies to EA-owned relationships.

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
- Source rule: [[IMP-085]]
- Analysis: [[IMP-085 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31080 {
    verification def TestVER31080 {
        doc /* Candidate verification of IMP-085; execution and clause-level acceptance are pending. */
    }
}
```
