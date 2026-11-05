---
type: Verification
subtype: test
id: VER-31144
uid: 20261022043200144skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-015
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31144::TestVER31144
---
# WKB-015 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-015]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31294 - WKB-015 Statement 1]]
- [[REQ-31295 - WKB-015 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Ports tab checks before it previews: names are unique in the owner, a port or end is typed by a port definition, only items and attributes have a direction, a path must resolve through the owner's usages (inherited ones included), an interface connection joins ports, each port matches its end's type and conjugation, and a flow starts at an out (or inout) feature and ends at an in (or inout) one, with every `~` on the path reversing directions.
- [ ] Clause 2: Type or end mismatches that SysML allows (bound features of different types, both ports unconjugated) are shown as notes, not refusals. A member that has a body (properties, description) is not rewritten by the Ports tab.

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
- Source rule: [[WKB-015]]
- Analysis: [[WKB-015 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31144 {
    verification def TestVER31144 {
        doc /* Candidate verification of WKB-015; execution and clause-level acceptance are pending. */
    }
}
```
