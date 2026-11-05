---
type: Verification
subtype: test
id: VER-31125
uid: 20261022043200125skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BOM-014
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31125::TestVER31125
---
# BOM-014 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BOM-014]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31244 - BOM-014 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Drawing-only lines are recorded as document references and excluded from quantities.

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
- Source rule: [[BOM-014]]
- Analysis: [[BOM-014 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31125 {
    verification def TestVER31125 {
        doc /* Candidate verification of BOM-014; execution and clause-level acceptance are pending. */
    }
}
```
