---
type: Requirement
subtype: functional
id: REQ-31259
uid: 20261022043100259skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BOM-017
sourceRuleStatus: Active
sourceRuleClause: 5
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31259::RuleREQ31259
---
# BOM-017 — Candidate Requirement 5

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

EA to BOM matching by part number appearing in one EA element name, EA alias or PN tag is a report only. A part number that is already in the vault is kept; if the new file disagrees with it on any line (pinned revision, count or quantity, or a line that is new) the finding `EXISTING_DIFFERS` names the first lines that differ and nothing is rewritten.

## Authoritative origin

- [[BOM-017]] — exact source rule and decision origins
- [[BOM-017 - Analysis]] — clause decomposition and current classification
- Source family: `BOM`; semantic role: BOM Functional Requirement; source phase `P2`
- This is one of 5 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31128 - BOM-017 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31259 {
    requirement def RuleREQ31259 {
        doc /* EA to BOM matching by part number appearing in one EA element name, EA alias or PN tag is a report only. A part number that is already in the vault is kept; if the new file disagrees with it on any line (pinned revision, count or quantity, or a line that is new) the finding `EXISTING_DIFFERS` names the first lines that differ and nothing is rewritten. */
    }
}
```
