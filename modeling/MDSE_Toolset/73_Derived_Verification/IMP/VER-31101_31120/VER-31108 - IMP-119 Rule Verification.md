---
type: Verification
subtype: test
id: VER-31108
uid: 20261022043200108skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-119
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31108::TestVER31108
---
# IMP-119 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-119]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31206 - IMP-119 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Tags on an EA Part whose disposition is `body` (PN, Piece Cost, Style, Quantity...) describe that use of the part in the assembly, so they are written as one `- On part <name>: tag: value; ...` line in the owning assembly's Source section, not lost with the usage and not copied to the part def. (V1 W-136, REG-142; D-0038)

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
- Source rule: [[IMP-119]]
- Analysis: [[IMP-119 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31108 {
    verification def TestVER31108 {
        doc /* Candidate verification of IMP-119; execution and clause-level acceptance are pending. */
    }
}
```
