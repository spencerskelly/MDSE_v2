---
type: Verification
subtype: test
id: VER-31115
uid: 20261022043200115skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-126
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31115::TestVER31115
---
# IMP-126 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-126]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31227 - IMP-126 Statement 1]]
- [[REQ-31228 - IMP-126 Statement 2]]
- [[REQ-31229 - IMP-126 Statement 3]]
- [[REQ-31230 - IMP-126 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: An import into an existing vault shows the MDSE release, schema and every shipped plugin in the vault against the ones in the importer, with a state for each (same, newer in the importer, vault is newer, not installed, same version with different files).
- [ ] Clause 2: Updating the toolset during the import is a choice: ticked by default only when the importer is newer, unticked when the vault is newer, forced on for a new vault.
- [ ] Clause 3: Unticked, the model is imported and the installed tools stay as they are.
- [ ] Clause 4: Ticked, it applies the same update as the maintenance section, with replaced files saved first.

## Proposed test procedure

**Given:** Synthetic EA/QEAX source rows covering the specified element, connector, field or failure category.

**When:** Preflight, translate, create a ledger, re-import and inspect model output.

**Then:** Compare the rule's mapped semantics, flags, identity, source accounting and change disposition with expected values.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/importer.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/importer/test/preflight.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[IMP-126]]
- Analysis: [[IMP-126 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31115 {
    verification def TestVER31115 {
        doc /* Candidate verification of IMP-126; execution and clause-level acceptance are pending. */
    }
}
```
