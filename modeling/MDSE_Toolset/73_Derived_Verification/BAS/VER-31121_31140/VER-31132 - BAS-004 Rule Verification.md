---
type: Verification
subtype: test
id: VER-31132
uid: 20261022043200132skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BAS-004
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31132::TestVER31132
---
# BAS-004 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BAS-004]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31266 - BAS-004 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: A pre-release integration Base Vault may pin the declared Workbench candidate; an issued release may not.

## Proposed test procedure

**Given:** A reproducible base-vault build input and configured plugin assets.

**When:** Build and update a target vault; inspect versions, lock entries and changed-file plan.

**Then:** Check asset versions, determinism, controlled overwrites and preservation of personal configuration.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/vault_update.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/bootstrap/test/bootstrap.test.mjs` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[BAS-004]]
- Analysis: [[BAS-004 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31132 {
    verification def TestVER31132 {
        doc /* Candidate verification of BAS-004; execution and clause-level acceptance are pending. */
    }
}
```
