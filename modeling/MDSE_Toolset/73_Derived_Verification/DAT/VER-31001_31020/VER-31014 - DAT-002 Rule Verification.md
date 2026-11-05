---
type: Verification
subtype: test
id: VER-31014
uid: 20261022043200014skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: DAT-002
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31014::TestVER31014
---
# DAT-002 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[DAT-002]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31033 - DAT-002 Statement 1]]
- [[REQ-31034 - DAT-002 Statement 2]]
- [[REQ-31035 - DAT-002 Statement 3]]
- [[REQ-31036 - DAT-002 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Public repos hold synthetic content only.
- [ ] Clause 2: No real product names, BOMs, drawings, customers, revision histories or source exports.
- [ ] Clause 3: Real models are imported only in a private/local environment. A scan is a backstop, not a guarantee.
- [ ] Clause 4: Test_Vault_ stays the method and tool authority.

## Proposed test procedure

**Given:** Synthetic public/private data cases and a controlled repository artifact list.

**When:** Run the data policy and inspect source, ledger and generated file destinations.

**Then:** Check restrictions on private source data and publication without exposing real engineering content.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `.github/workflows/ci.yml` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `testing/README.md` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[DAT-002]]
- Analysis: [[DAT-002 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31014 {
    verification def TestVER31014 {
        doc /* Candidate verification of DAT-002; execution and clause-level acceptance are pending. */
    }
}
```
