---
type: Requirement
subtype: functional
id: REQ-31258
uid: 20261022043100258skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BOM-017
sourceRuleStatus: Active
sourceRuleClause: 4
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31258::RuleREQ31258
---
# BOM-017 — Candidate Requirement 4

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Findings go to `99_System/11_Import/BOM Findings <date>.md`.

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
package MDSE_REQ_31258 {
    requirement def RuleREQ31258 {
        doc /* Findings go to `99_System/11_Import/BOM Findings <date>.md`. */
    }
}
```
