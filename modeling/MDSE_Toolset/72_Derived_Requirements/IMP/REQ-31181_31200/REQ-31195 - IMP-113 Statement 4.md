---
type: Requirement
subtype: functional
id: REQ-31195
uid: 20261022043100195skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-113
sourceRuleStatus: Active
sourceRuleClause: 4
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31195::RuleREQ31195
---
# IMP-113 — Candidate Requirement 4

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

An EA Part or nested element of that type is matched to one connector and not repeated. A connector whose whole and part sit in one cycle of ownership is left out as OWNERSHIP_CYCLE. A part that is the child of an interface is AGGREGATION_PART_IN_INTERFACE (review). (Test_Vault_ approved aggregation docs 2026-10-17; D-0038)

## Authoritative origin

- [[IMP-113]] — exact source rule and decision origins
- [[IMP-113 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31102 - IMP-113 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31195 {
    requirement def RuleREQ31195 {
        doc /* An EA Part or nested element of that type is matched to one connector and not repeated. A connector whose whole and part sit in one cycle of ownership is left out as OWNERSHIP_CYCLE. A part that is the child of an interface is AGGREGATION_PART_IN_INTERFACE (review). (Test_Vault_ approved aggregation docs 2026-10-17; D-0038) */
    }
}
```
