---
type: Verification
subtype: test
id: VER-31093
uid: 20261022043200093skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-103
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31093::TestVER31093
---
# IMP-103 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-103]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31179 - IMP-103 Statement 1]]
- [[REQ-31180 - IMP-103 Statement 2]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: No folder or file name is cut to fit a path length; the 400-character path limit is handled after the import, not by the importer. A name is changed only for the safety rules of IMP-102 (the 150-character part limit, which is marked).
- [ ] Clause 2: The folder write retries a file up to six times with a growing delay on InvalidStateError, NoModificationAllowedError or NotReadableError (antivirus, cloud sync or the indexer touching a new file), and a write error names the browser error, its message and the path.

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
- Source rule: [[IMP-103]]
- Analysis: [[IMP-103 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31093 {
    verification def TestVER31093 {
        doc /* Candidate verification of IMP-103; execution and clause-level acceptance are pending. */
    }
}
```
