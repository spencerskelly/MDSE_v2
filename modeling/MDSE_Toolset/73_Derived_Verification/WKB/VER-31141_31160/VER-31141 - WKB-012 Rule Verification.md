---
type: Verification
subtype: test
id: VER-31141
uid: 20261022043200141skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: WKB-012
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31141::TestVER31141
---
# WKB-012 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[WKB-012]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31286 - WKB-012 Statement 1]]
- [[REQ-31287 - WKB-012 Statement 2]]
- [[REQ-31288 - WKB-012 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Relationship properties are written inside the relationship in SysML: a `doc` comment, `attribute name = value;` (or `attribute name { doc … }` when the value is not a plain number or simple text), usage modifiers `ordered` and `nonunique`, quantity and direction.
- [ ] Clause 2: The drop-down offers only the options that relationship has; a free attribute name is accepted only where the relationship allows it (not specializes or verifies).
- [ ] Clause 3: Renaming a usage is refused when its name is used elsewhere in the block.

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
- Source rule: [[WKB-012]]
- Analysis: [[WKB-012 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31141 {
    verification def TestVER31141 {
        doc /* Candidate verification of WKB-012; execution and clause-level acceptance are pending. */
    }
}
```
