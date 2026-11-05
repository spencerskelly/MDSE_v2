---
type: Verification
subtype: test
id: VER-31142
uid: 20261022043200142skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-013
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31142::TestVER31142
---
# WKB-013 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-013]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31289 - WKB-013 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Every option in the Edit lens has a "?" that shows a short bundled definition with its options and a link to the language note (`99_System/04_Language`); nothing is fetched. A form being filled is not discarded when the index refreshes.

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
- Source rule: [[WKB-013]]
- Analysis: [[WKB-013 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31142 {
    verification def TestVER31142 {
        doc /* Candidate verification of WKB-013; execution and clause-level acceptance are pending. */
    }
}
```
