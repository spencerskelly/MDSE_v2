---
type: Verification
subtype: test
id: VER-31158
uid: 20261022043200158skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: TST-002
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31158::TestVER31158
---
# TST-002 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[TST-002]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31330 - TST-002 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Workbench candidate CI runs a 10,000-note semantic-cache scale smoke (completion/memory regression gate, not timing).

## Proposed test procedure

**Given:** The CI workflow, synthetic model fixtures, parser setup and intentionally invalid examples.

**When:** Execute the specified acceptance gates with good and bad fixtures.

**Then:** Confirm real execution evidence and that invalid inputs cause the required gate failures.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `.github/workflows/ci.yml` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `testing/fixtures/golden-charger/README.md` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[TST-002]]
- Analysis: [[TST-002 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31158 {
    verification def TestVER31158 {
        doc /* Candidate verification of TST-002; execution and clause-level acceptance are pending. */
    }
}
```
