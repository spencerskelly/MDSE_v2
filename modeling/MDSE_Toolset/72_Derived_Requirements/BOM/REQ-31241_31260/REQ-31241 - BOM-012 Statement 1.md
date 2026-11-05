---
type: Requirement
subtype: functional
id: REQ-31241
uid: 20261022043100241skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BOM-012
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31241::RuleREQ31241
---
# BOM-012 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

A parent that pins a child revision different from the child's latest revision is flagged with `flagConflict`.

## Authoritative origin

- [[BOM-012]] — exact source rule and decision origins
- [[BOM-012 - Analysis]] — clause decomposition and current classification
- Source family: `BOM`; semantic role: BOM Functional Requirement; source phase `P2`
- One preliminary segment; its atomicity is not yet established.

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

- Proposed case: [[VER-31123 - BOM-012 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31241 {
    requirement def RuleREQ31241 {
        doc /* A parent that pins a child revision different from the child's latest revision is flagged with `flagConflict`. */
    }
}
```
