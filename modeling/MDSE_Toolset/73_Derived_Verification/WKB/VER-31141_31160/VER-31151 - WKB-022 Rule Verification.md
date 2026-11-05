---
type: Verification
subtype: test
id: VER-31151
uid: 20261022043200151skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-022
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31151::TestVER31151
---
# WKB-022 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-022]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31310 - WKB-022 Statement 1]]
- [[REQ-31311 - WKB-022 Statement 2]]
- [[REQ-31312 - WKB-022 Statement 3]]
- [[REQ-31313 - WKB-022 Statement 4]]
- [[REQ-31314 - WKB-022 Statement 5]]
- [[REQ-31315 - WKB-022 Statement 6]]
- [[REQ-31316 - WKB-022 Statement 7]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Workbench keeps structure, design types, internal structure, function, states and requirements apart.
- [ ] Clause 2: Structure shows parts only.
- [ ] Clause 3: Design types shows only what a definition specializes and what specializes it.
- [ ] Clause 4: Internal shows the parts with the ports each part's type offers (inherited ones included), the definition's own ports, and every connection, binding and flow with both ends resolved; an end that names a part or port that does not exist is marked.
- [ ] Clause 5: Function shows actions and States shows states, each drawn alone.
- [ ] Clause 6: Requirements shows the trace around the selected note.
- [ ] Clause 7: The Obsidian panel has the same lenses.

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
- Source rule: [[WKB-022]]
- Analysis: [[WKB-022 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31151 {
    verification def TestVER31151 {
        doc /* Candidate verification of WKB-022; execution and clause-level acceptance are pending. */
    }
}
```
