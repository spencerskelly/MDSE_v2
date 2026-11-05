---
type: Verification
subtype: test
id: VER-31004
uid: 20261022043200004skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: GOV-004
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31004::TestVER31004
---
# GOV-004 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[GOV-004]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31007 - GOV-004 Statement 1]]
- [[REQ-31008 - GOV-004 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Rules live in `governance/RULESET.md` only.
- [ ] Clause 2: Decisions that create, change or retire a rule are recorded in `governance/DECISIONS.md` and name the rule they change.

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
- Source rule: [[GOV-004]]
- Analysis: [[GOV-004 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31004 {
    verification def TestVER31004 {
        doc /* Candidate verification of GOV-004; execution and clause-level acceptance are pending. */
    }
}
```
