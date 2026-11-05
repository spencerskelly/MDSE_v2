---
type: Verification
subtype: test
id: VER-31102
uid: 20261022043200102skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-113
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31102::TestVER31102
---
# IMP-113 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-113]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31192 - IMP-113 Statement 1]]
- [[REQ-31193 - IMP-113 Statement 2]]
- [[REQ-31194 - IMP-113 Statement 3]]
- [[REQ-31195 - IMP-113 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: An Aggregation or Composition makes the child a usage in the whole, of the kind its two definitions are: part/part is `part`, action/action `action`, state/state `state`, item/item `item`, requirement/requirement `requirement`, part/port def `port`, use case/use case `use case`.
- [ ] Clause 2: The whole is the end marked composite or shared.
- [ ] Clause 3: Every connector is its own usage, even with the same two ends; it takes the child end's role name, else the child's name with `_2` suffixes, and the child end's multiplicity (none is invented).
- [ ] Clause 4: An EA Part or nested element of that type is matched to one connector and not repeated. A connector whose whole and part sit in one cycle of ownership is left out as OWNERSHIP_CYCLE. A part that is the child of an interface is AGGREGATION_PART_IN_INTERFACE (review). (Test_Vault_ approved aggregation docs 2026-10-17; D-0038)

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
- Source rule: [[IMP-113]]
- Analysis: [[IMP-113 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31102 {
    verification def TestVER31102 {
        doc /* Candidate verification of IMP-113; execution and clause-level acceptance are pending. */
    }
}
```
