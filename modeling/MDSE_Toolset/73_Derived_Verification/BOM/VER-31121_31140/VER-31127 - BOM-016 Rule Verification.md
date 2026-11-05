---
type: Verification
subtype: test
id: VER-31127
uid: 20261022043200127skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BOM-016
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31127::TestVER31127
---
# BOM-016 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BOM-016]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31250 - BOM-016 Statement 1]]
- [[REQ-31251 - BOM-016 Statement 2]]
- [[REQ-31252 - BOM-016 Statement 3]]
- [[REQ-31253 - BOM-016 Statement 4]]
- [[REQ-31254 - BOM-016 Statement 5]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Each part number gets one `Object` (subtype part) note named `<PN>` (the part number alone, so the file name and the part number are the same value; the name is the H1 and a `- Name:` line in Source) under `BOM/Parts`: `part def P_<PN>` with `partNumber`, `revision` (CL1+CL2 as exported), `source`, `lifecycleState` attributes.
- [ ] Clause 2: The parent's block owns one part usage per line: whole-number counts with unit ea/piece become multiplicity; any other quantity is `quantity` plus the unit as written (case kept); line, pinned `childRevision`, reference designator, effectivity dates, SSC and notes are attributes.
- [ ] Clause 3: Drawing lines (name starts DWG) become a `Document` note under `BOM/Drawings` referenced from the parent and are not usages.
- [ ] Clause 4: Alternate-source rows attach to the line above.
- [ ] Clause 5: Parent note lists children in `hasPart`.

## Proposed test procedure

**Given:** Synthetic flat and redline BOM fixtures with relevant quantities, revisions and duplicate data.

**When:** Import, re-import and compare generated part notes and parent-owned usages.

**Then:** Check part identity, revision integrity, quantity/unit, exceptions and no-loss flags for the stated obligation.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/bom.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[BOM-016]]
- Analysis: [[BOM-016 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31127 {
    verification def TestVER31127 {
        doc /* Candidate verification of BOM-016; execution and clause-level acceptance are pending. */
    }
}
```
