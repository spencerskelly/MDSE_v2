---
type: Verification
subtype: test
id: VER-31007
uid: 20261022043200007skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: GOV-007
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31007::TestVER31007
---
# GOV-007 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[GOV-007]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31013 - GOV-007 Statement 1]]
- [[REQ-31014 - GOV-007 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: AI_INSTRUCTIONS.md is the one set of AI instructions.
- [ ] Clause 2: AGENTS.md at the root is a pointer to it.

## Proposed test procedure

**Given:** The actual repository governance, ruleset, decisions and configured CI.

**When:** Inspect or execute the applicable review, change or release policy.

**Then:** Check the policy obligation and decision references; use human approval evidence for responsibilities that are not machine-testable.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `scripts/check-rules.mjs` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `.github/workflows/ci.yml` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[GOV-007]]
- Analysis: [[GOV-007 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31007 {
    verification def TestVER31007 {
        doc /* Candidate verification of GOV-007; execution and clause-level acceptance are pending. */
    }
}
```
