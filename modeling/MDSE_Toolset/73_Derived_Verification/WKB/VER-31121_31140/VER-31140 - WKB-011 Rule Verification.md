---
type: Verification
subtype: test
id: VER-31140
uid: 20261022043200140skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-011
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31140::TestVER31140
---
# WKB-011 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-011]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31284 - WKB-011 Statement 1]]
- [[REQ-31285 - WKB-011 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A relationship can be selected from the Workbench list, a relationship table row or a canvas line (the canvas edge id carries the relationship's location) and then changed, given properties, or removed.
- [ ] Clause 2: The kinds that can be changed are those the Edit lens can add; any other member can only be removed or edited in the note.

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
- Source rule: [[WKB-011]]
- Analysis: [[WKB-011 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31140 {
    verification def TestVER31140 {
        doc /* Candidate verification of WKB-011; execution and clause-level acceptance are pending. */
    }
}
```
