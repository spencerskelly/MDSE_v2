---
type: Verification
subtype: test
id: VER-31143
uid: 20261022043200143skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-014
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31143::TestVER31143
---
# WKB-014 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-014]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31290 - WKB-014 Statement 1]]
- [[REQ-31291 - WKB-014 Statement 2]]
- [[REQ-31292 - WKB-014 Statement 3]]
- [[REQ-31293 - WKB-014 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Edit lens has a Ports tab for a part, item, port or interface definition.
- [ ] Clause 2: It adds, changes and removes: port definition features (`in|out|inout item|attribute|port`), port usages (`[ref] port p : [~]PortDef [mult] [ordered] [nonunique]`), interface definition ends (`end e : [~]PortDef`), connections (`connect`, `connection [n] [: Def] connect`, `interface [n] [: Def] connect`, with optional `end ::>` bindings), flows (`flow [n] [of Item] from a.x to b.y`) and bindings (`bind a.x = b.y`).
- [ ] Clause 3: Types are chosen in the searchable browser; paths are offered from the owner's parts and their ports.
- [ ] Clause 4: Every option has a "?".

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
- Source rule: [[WKB-014]]
- Analysis: [[WKB-014 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31143 {
    verification def TestVER31143 {
        doc /* Candidate verification of WKB-014; execution and clause-level acceptance are pending. */
    }
}
```
