---
type: Verification
subtype: test
id: VER-31149
uid: 20261022043200149skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-020
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31149::TestVER31149
---
# WKB-020 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-020]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31306 - WKB-020 Statement 1]]
- [[REQ-31307 - WKB-020 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A YAML link that repeats a relationship the SysML block already states (the BOM importer lists `hasPart` in both) is one relationship.
- [ ] Clause 2: Counting both doubled every quantity in the rolled-up parts list.

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
- Source rule: [[WKB-020]]
- Analysis: [[WKB-020 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31149 {
    verification def TestVER31149 {
        doc /* Candidate verification of WKB-020; execution and clause-level acceptance are pending. */
    }
}
```
