---
type: Verification
subtype: test
id: VER-31035
uid: 20261022043200035skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: MOD-022
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31035::TestVER31035
---
# MOD-022 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[MOD-022]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31073 - MOD-022 Statement 1]]
- [[REQ-31074 - MOD-022 Statement 2]]
- [[REQ-31075 - MOD-022 Statement 3]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: `type` is the semantic class.
- [ ] Clause 2: `subtype` is an approved classification within that type.
- [ ] Clause 3: `kind` is deprecated.

## Proposed test procedure

**Given:** Synthetic MDSE notes, properties, graph statements, and invalid note variants.

**When:** Parse, normalize, serialize or edit notes using the shared model contract.

**Then:** Compare identity, native SysML meaning, formatting, allowable endpoints and preservation behavior against the source obligations.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/core/test/mdse_core.test.mjs` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `testing/oracles/test_note_format.py` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[MOD-022]]
- Analysis: [[MOD-022 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31035 {
    verification def TestVER31035 {
        doc /* Candidate verification of MOD-022; execution and clause-level acceptance are pending. */
    }
}
```
