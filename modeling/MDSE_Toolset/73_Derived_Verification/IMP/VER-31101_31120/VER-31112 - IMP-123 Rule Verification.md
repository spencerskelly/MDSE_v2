---
type: Verification
subtype: test
id: VER-31112
uid: 20261022043200112skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-123
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31112::TestVER31112
---
# IMP-123 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-123]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31212 - IMP-123 Statement 1]]
- [[REQ-31213 - IMP-123 Statement 2]]
- [[REQ-31214 - IMP-123 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Every deferred element and connector leaves a flag in the vault, not only a CSV row.
- [ ] Clause 2: The flag goes on the note that owns the source (else the target) usage; a row with no note above it goes on one `modelCheck` holding note, "Unplaced Review Items", which has one flag per row.
- [ ] Clause 3: The Review CSVs stay.

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
- Source rule: [[IMP-123]]
- Analysis: [[IMP-123 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31112 {
    verification def TestVER31112 {
        doc /* Candidate verification of IMP-123; execution and clause-level acceptance are pending. */
    }
}
```
