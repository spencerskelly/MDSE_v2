---
type: Verification
subtype: test
id: VER-31086
uid: 20261022043200086skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: IMP-096
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31086::TestVER31086
---
# IMP-096 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[IMP-096]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31161 - IMP-096 Statement 1]]
- [[REQ-31162 - IMP-096 Statement 2]]
- [[REQ-31163 - IMP-096 Statement 3]]
- [[REQ-31164 - IMP-096 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: Structure, links, quantities and multiplicity are defined by the SysML v2 block and are not repeated in `## Source: EA`.
- [ ] Clause 2: Relationships SysML v2 has no form for, and identifying properties, stay in the YAML (`describes`, `eaType`, `uid`, `id`).
- [ ] Clause 3: `## Source: EA` holds only what is stored nowhere else: the note's EA GUID, the original name when the file name differs, alias, the kept tags, trigger and guard text, unresolved connectors and attachments.
- [ ] Clause 4: EA author, created date, type, stereotype and package are not written: the uid carries date and author, `eaType` carries type and stereotype, the folder carries the package.

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
- Source rule: [[IMP-096]]
- Analysis: [[IMP-096 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31086 {
    verification def TestVER31086 {
        doc /* Candidate verification of IMP-096; execution and clause-level acceptance are pending. */
    }
}
```
