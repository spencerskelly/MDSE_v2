---
type: Verification
subtype: test
id: VER-31129
uid: 20261022043200129skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BAS-001
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31129::TestVER31129
---
# BAS-001 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BAS-001]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31260 - BAS-001 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Each importer and its clean base vault are a matched pair with one release version, checked before planning or writing (mdse_release in .vault.yaml).

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
- Source rule: [[BAS-001]]
- Analysis: [[BAS-001 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31129 {
    verification def TestVER31129 {
        doc /* Candidate verification of BAS-001; execution and clause-level acceptance are pending. */
    }
}
```
