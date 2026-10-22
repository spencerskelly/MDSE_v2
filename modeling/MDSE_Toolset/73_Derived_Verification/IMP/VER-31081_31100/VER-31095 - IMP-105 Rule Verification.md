---
type: Verification
subtype: test
id: VER-31095
uid: 20261022043200095skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-105
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31095::TestVER31095
---
# IMP-105 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-105]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31183 - IMP-105 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: PDATA1, PDATA2 and PDATA3 of an object hold the GUID (`{…}`) of another element; a plain Object_ID is also accepted. A Part's block, a Port's type and a FlowProperty's Signal come from PDATA1; a Port's instance link from PDATA3. (V1 W-44, W-113; D-0037)

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
- Source rule: [[IMP-105]]
- Analysis: [[IMP-105 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31095 {
    verification def TestVER31095 {
        doc /* Candidate verification of IMP-105; execution and clause-level acceptance are pending. */
    }
}
```
