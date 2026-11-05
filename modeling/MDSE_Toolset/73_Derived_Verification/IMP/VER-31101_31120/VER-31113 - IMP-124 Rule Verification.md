---
type: Verification
subtype: test
id: VER-31113
uid: 20261022043200113skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-124
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31113::TestVER31113
---
# IMP-124 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-124]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31215 - IMP-124 Statement 1]]
- [[REQ-31216 - IMP-124 Statement 2]]
- [[REQ-31217 - IMP-124 Statement 3]]
- [[REQ-31218 - IMP-124 Statement 4]]
- [[REQ-31219 - IMP-124 Statement 5]]
- [[REQ-31220 - IMP-124 Statement 6]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A usage or definition name keeps what makes the EA name different. A voltage puts its V at the decimal point and takes its sign as a letter: `+3.3VDC` is `P3V3DC`, `-13.3VDC` is `N13V3DC`, `12.5V` is `12V5`, `12VDC` stays `12VDC`; an unsigned voltage that starts the name takes `P`, because an identifier cannot start with a digit (`3.3VDC` is `P3V3DC`, so it and `+3.3VDC` meet and the second is told apart by its type).
- [ ] Clause 2: Elsewhere a leading `+` is `plus`, a leading `-` is `minus`, a point between digits is `p`, `&` is `And`, `%` is `Pct`, `#` is `No`. A name that is only a number is named after its type (`wire1`, not `_1`).
- [ ] Clause 3: Where the identifier is not just a respelling of the EA name, the EA name is recorded in `## Source: EA`.
- [ ] Clause 4: Two usages with one name take the name of their type to tell them apart (`a`, then `a_IConductor`); only a repeat of the same type takes `_2`.
- [ ] Clause 5: Quoted SysML names are not used, because every Workbench reader would need to change.
- [ ] Clause 6: Definitions keep the full EA title as their name.

## Proposed test procedure

**Given:** Synthetic EA/QEAX source rows covering the specified element, connector, field or failure category.

**When:** Preflight, translate, create a ledger, re-import and inspect model output.

**Then:** Compare the rule's mapped semantics, flags, identity, source accounting and change disposition with expected values.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/importer.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/importer/test/preflight.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[IMP-124]]
- Analysis: [[IMP-124 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31113 {
    verification def TestVER31113 {
        doc /* Candidate verification of IMP-124; execution and clause-level acceptance are pending. */
    }
}
```
