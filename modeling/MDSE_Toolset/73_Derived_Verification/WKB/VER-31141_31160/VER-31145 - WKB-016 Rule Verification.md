---
type: Verification
subtype: test
id: VER-31145
uid: 20261022043200145skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-016
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31145::TestVER31145
---
# WKB-016 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-016]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31296 - WKB-016 Statement 1]]
- [[REQ-31297 - WKB-016 Statement 2]]
- [[REQ-31298 - WKB-016 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The scanner reads every port form: `~`, `ref`, `:>` and `:>>` before or after the multiplicity, `ordered`, `nonunique`, directed features, interface and connection ends, and plain, `connection` and `interface` connects.
- [ ] Clause 2: Changing an owned usage in the Relationships tab keeps its `~`, `ref`, `:>` and `:>>`.
- [ ] Clause 3: After an apply or an undo the Edit lens redraws its lists from the new index without discarding a form being filled.

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
- Source rule: [[WKB-016]]
- Analysis: [[WKB-016 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31145 {
    verification def TestVER31145 {
        doc /* Candidate verification of WKB-016; execution and clause-level acceptance are pending. */
    }
}
```
