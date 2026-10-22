---
type: Verification
subtype: test
id: VER-31128
uid: 20261022043200128skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BOM-017
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31128::TestVER31128
---
# BOM-017 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BOM-017]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31255 - BOM-017 Statement 1]]
- [[REQ-31256 - BOM-017 Statement 2]]
- [[REQ-31257 - BOM-017 Statement 3]]
- [[REQ-31258 - BOM-017 Statement 4]]
- [[REQ-31259 - BOM-017 Statement 5]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The latest revision of a part number is the one it has as an assembly, or the one every parent pins when it is only a child.
- [ ] Clause 2: When there are several, or two revisions each have lines, the part number and the lines that use it are not imported and an error finding names the revisions (BOM-009, BOM-002). A parent pinning an older child revision gets a `flagConflict`; the child's body lists its older-revision users.
- [ ] Clause 3: Part numbers already noted in the vault are left as they are.
- [ ] Clause 4: Findings go to `99_System/11_Import/BOM Findings <date>.md`.
- [ ] Clause 5: EA to BOM matching by part number appearing in one EA element name, EA alias or PN tag is a report only. A part number that is already in the vault is kept; if the new file disagrees with it on any line (pinned revision, count or quantity, or a line that is new) the finding `EXISTING_DIFFERS` names the first lines that differ and nothing is rewritten.

## Proposed test procedure

**Given:** Synthetic flat and redline BOM fixtures with relevant quantities, revisions and duplicate data.

**When:** Import, re-import and compare generated part notes and parent-owned usages.

**Then:** Check part identity, revision integrity, quantity/unit, exceptions and no-loss flags for the stated obligation.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/bom.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[BOM-017]]
- Analysis: [[BOM-017 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31128 {
    verification def TestVER31128 {
        doc /* Candidate verification of BOM-017; execution and clause-level acceptance are pending. */
    }
}
```
