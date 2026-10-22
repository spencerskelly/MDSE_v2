---
type: Verification
subtype: test
id: VER-31146
uid: 20261022043200146skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-017
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31146::TestVER31146
---
# WKB-017 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-017]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31299 - WKB-017 Statement 1]]
- [[REQ-31300 - WKB-017 Statement 2]]
- [[REQ-31301 - WKB-017 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Edit lens Merge tab marks aliases and merges them in two steps.
- [ ] Clause 2: An alias is marked from the open note or from matches found between BOM parts and EA notes: the EA part number (`- PN:` or `- Part Number:`) equal to the BOM number, then the number inside the EA title, then a close name; only the first two with a single candidate are ticked for the person.
- [ ] Clause 3: Merge needs an alias, so nothing merges without being marked and reviewed.

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
- Source rule: [[WKB-017]]
- Analysis: [[WKB-017 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31146 {
    verification def TestVER31146 {
        doc /* Candidate verification of WKB-017; execution and clause-level acceptance are pending. */
    }
}
```
