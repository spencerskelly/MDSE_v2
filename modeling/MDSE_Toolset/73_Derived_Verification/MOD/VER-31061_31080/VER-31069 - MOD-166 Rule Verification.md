---
type: Verification
subtype: test
id: VER-31069
uid: 20261022043200069skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: MOD-166
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31069::TestVER31069
---
# MOD-166 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[MOD-166]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31134 - MOD-166 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Every example in the language catalog is recognized by the Workbench scanner as that construct, with no warnings. A statement the scanner cannot classify is reported, never dropped.

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
- Source rule: [[MOD-166]]
- Analysis: [[MOD-166 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31069 {
    verification def TestVER31069 {
        doc /* Candidate verification of MOD-166; execution and clause-level acceptance are pending. */
    }
}
```
