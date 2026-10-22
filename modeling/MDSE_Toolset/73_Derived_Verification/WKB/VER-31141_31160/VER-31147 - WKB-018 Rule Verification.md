---
type: Verification
subtype: test
id: VER-31147
uid: 20261022043200147skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-018
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31147::TestVER31147
---
# WKB-018 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-018]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31302 - WKB-018 Statement 1]]
- [[REQ-31303 - WKB-018 Statement 2]]
- [[REQ-31304 - WKB-018 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A merge keeps the surviving note's file name, id, uid and SysML package.
- [ ] Clause 2: The removed note's content is folded in: frontmatter (more specific subtype, EA class, tags and relationship fields combined), user text under `## Merged from <title>`, Source lines combined without repeats, SysML members carried over with the removed definition's symbol rewritten to the survivor's and its specializations added. A member both notes define differently stays in the survivor and the other is kept under `## Not carried over from <title>` as sysml text.
- [ ] Clause 3: The removed title is listed under `## Aliases` and its id and uid under `## Former ids`.

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
- Source rule: [[WKB-018]]
- Analysis: [[WKB-018 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31147 {
    verification def TestVER31147 {
        doc /* Candidate verification of WKB-018; execution and clause-level acceptance are pending. */
    }
}
```
