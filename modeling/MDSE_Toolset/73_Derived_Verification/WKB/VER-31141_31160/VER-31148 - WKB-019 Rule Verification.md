---
type: Verification
subtype: test
id: VER-31148
uid: 20261022043200148skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-019
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31148::TestVER31148
---
# WKB-019 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-019]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31305 - WKB-019 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A merge rewrites every other note: `[[Removed]]` becomes `[[Kept|Removed]]` in text (frontmatter lists get the plain new name, without repeats or links to itself) and the removed definition's symbol becomes the kept one in every SysML block. A chain of aliases resolves to its end; many aliases merge in one preview, with the changed files counted, the removed files listed and one Undo that brings them all back. A note with more than one definition, a survivor with no SysML block and notes of different classes are refused with the reason.

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
- Source rule: [[WKB-019]]
- Analysis: [[WKB-019 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31148 {
    verification def TestVER31148 {
        doc /* Candidate verification of WKB-019; execution and clause-level acceptance are pending. */
    }
}
```
