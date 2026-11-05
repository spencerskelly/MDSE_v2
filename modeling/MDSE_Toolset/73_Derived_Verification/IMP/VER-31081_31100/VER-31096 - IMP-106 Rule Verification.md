---
type: Verification
subtype: test
id: VER-31096
uid: 20261022043200096skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-106
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31096::TestVER31096
---
# IMP-106 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-106]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31184 - IMP-106 Statement 1]]
- [[REQ-31185 - IMP-106 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A Port under a Part is the Part's block's own port and is not written as a usage of the Part.
- [ ] Clause 2: It merges, with one hop and never up the redefinition chain: (1) PDATA3 names a Port owned by the Part's block; (2) else the block has exactly one port with the same non-blank name; (3) else it is added to the block as a port of its own, flagged for review, and same-named ones on one block combine. A Part with no block defers the Port (`USAGE_WITHOUT_NOTE_OWNER`). A merged Port types an untyped block port from its PDATA1. (V1 W-114, W-130; D-0037)

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
- Source rule: [[IMP-106]]
- Analysis: [[IMP-106 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31096 {
    verification def TestVER31096 {
        doc /* Candidate verification of IMP-106; execution and clause-level acceptance are pending. */
    }
}
```
