---
type: Verification
subtype: test
id: VER-31152
uid: 20261022043200152skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-023
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31152::TestVER31152
---
# WKB-023 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-023]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31317 - WKB-023 Statement 1]]
- [[REQ-31318 - WKB-023 Statement 2]]
- [[REQ-31319 - WKB-023 Statement 3]]
- [[REQ-31320 - WKB-023 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Every section of a note view and every list group folds.
- [ ] Clause 2: Each page has Collapse all and Expand all; which sections are open is kept while the person moves between notes.
- [ ] Clause 3: The Notes list can be grouped by type or folder, each group folded.
- [ ] Clause 4: Measured quantities print their unit (`[1.5 Meter]`).

## Proposed test procedure

**Given:** A synthetic vault with known elements, graph links, flags and edit scenarios.

**When:** Build the Workbench index and exercise the relevant lens or write transaction.

**Then:** Check view semantics, typed references, preview/undo integrity, persistence and missing-link visibility.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/workbench/test/workbench.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/workbench/test/edit.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/workbench/test/edit_rel.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[WKB-023]]
- Analysis: [[WKB-023 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31152 {
    verification def TestVER31152 {
        doc /* Candidate verification of WKB-023; execution and clause-level acceptance are pending. */
    }
}
```
