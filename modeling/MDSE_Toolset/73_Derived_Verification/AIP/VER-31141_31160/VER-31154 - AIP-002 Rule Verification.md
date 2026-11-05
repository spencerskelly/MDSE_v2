---
type: Verification
subtype: test
id: VER-31154
uid: 20261022043200154skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: AIP-002
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31154::TestVER31154
---
# AIP-002 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[AIP-002]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31323 - AIP-002 Statement 1]]
- [[REQ-31324 - AIP-002 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: AI processes do not edit model files unless the process is a note-creation process under R-2.x.
- [ ] Clause 2: Changelog review (AI-CR-01) is report-only.

## Proposed test procedure

**Given:** Synthetic model notes and the published agent instructions for the specific process.

**When:** Run or review the AI-assisted creation, analysis or decision workflow.

**Then:** Check allowed actions, traceable provenance and no unsupported source assertions.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `governance/ai/AI_INSTRUCTIONS.md` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[AIP-002]]
- Analysis: [[AIP-002 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31154 {
    verification def TestVER31154 {
        doc /* Candidate verification of AIP-002; execution and clause-level acceptance are pending. */
    }
}
```
