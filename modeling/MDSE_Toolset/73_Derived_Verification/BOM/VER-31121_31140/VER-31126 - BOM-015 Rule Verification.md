---
type: Verification
subtype: test
id: VER-31126
uid: 20261022043200126skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BOM-015
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31126::TestVER31126
---
# BOM-015 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BOM-015]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31245 - BOM-015 Statement 1]]
- [[REQ-31246 - BOM-015 Statement 2]]
- [[REQ-31247 - BOM-015 Statement 3]]
- [[REQ-31248 - BOM-015 Statement 4]]
- [[REQ-31249 - BOM-015 Statement 5]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The importer reads the BOM from `.xlsx`, `.csv` or `.tsv` in the page.
- [ ] Clause 2: Two layouts are recognised by header names: flat (Parent Part Number, Child Part Number, Linenumber, Amount, Unit …) and redline (Number, CL1, CL2, level columns 0..7 or Structure).
- [ ] Clause 3: Part numbers are read as text.
- [ ] Clause 4: In a redline, unstruck text in a cell is current and struck text is the previous value; a part number struck with no replacement is a removed line. A sheet with no recognised header is refused with the reason.
- [ ] Clause 5: The redline layout was checked against the four real redlines

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
- Source rule: [[BOM-015]]
- Analysis: [[BOM-015 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31126 {
    verification def TestVER31126 {
        doc /* Candidate verification of BOM-015; execution and clause-level acceptance are pending. */
    }
}
```
