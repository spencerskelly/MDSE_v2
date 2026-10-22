---
type: Verification
subtype: test
id: VER-31010
uid: 20261022043200010skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: GOV-012
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31010::TestVER31010
---
# GOV-012 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[GOV-012]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31019 - GOV-012 Statement 1]]
- [[REQ-31020 - GOV-012 Statement 2]]
- [[REQ-31021 - GOV-012 Statement 3]]
- [[REQ-31022 - GOV-012 Statement 4]]
- [[REQ-31023 - GOV-012 Statement 5]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Tool ownership: Workbench owns UI behavior, disposable index, ModelRef navigation, schema-valid edit transactions and Review disposition (not semantics, importer mapping or release packaging).
- [ ] Clause 2: Bootstrap owns safe activation repair, release verification and author registration.
- [ ] Clause 3: Importer owns source translation, naming/identity allocation and import evidence (not editing or plugin management).
- [ ] Clause 4: Base builder owns the runtime payload, governed plugin config and pins/hashes.
- [ ] Clause 5: Cross-vault is deferred (archived resolver is reference only). A tool may not silently broaden or redefine model semantics; archived material never overrides a current source.

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
- Source rule: [[GOV-012]]
- Analysis: [[GOV-012 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31010 {
    verification def TestVER31010 {
        doc /* Candidate verification of GOV-012; execution and clause-level acceptance are pending. */
    }
}
```
