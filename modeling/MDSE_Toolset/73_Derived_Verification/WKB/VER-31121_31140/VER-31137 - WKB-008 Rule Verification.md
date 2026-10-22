---
type: Verification
subtype: test
id: VER-31137
uid: 20261022043200137skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-008
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31137::TestVER31137
---
# WKB-008 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-008]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31278 - WKB-008 Statement 1]]
- [[REQ-31279 - WKB-008 Statement 2]]
- [[REQ-31280 - WKB-008 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Edit lens adds relationships, elements and requirement text.
- [ ] Clause 2: Relationship kinds offered depend on the selected note's SysML definition; targets come from a searchable, folder-grouped browser limited to eligible notes.
- [ ] Clause 3: Structure and links are written into the source note's `## SysML v2` block

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
- Source rule: [[WKB-008]]
- Analysis: [[WKB-008 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31137 {
    verification def TestVER31137 {
        doc /* Candidate verification of WKB-008; execution and clause-level acceptance are pending. */
    }
}
```
