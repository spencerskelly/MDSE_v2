---
type: Verification
subtype: test
id: VER-31156
uid: 20261022043200156skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: AIP-004
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31156::TestVER31156
---
# AIP-004 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[AIP-004]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31327 - AIP-004 Statement 1]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: AI does not invent source facts.

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
- Source rule: [[AIP-004]]
- Analysis: [[AIP-004 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31156 {
    verification def TestVER31156 {
        doc /* Candidate verification of AIP-004; execution and clause-level acceptance are pending. */
    }
}
```
