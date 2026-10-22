---
type: Requirement
subtype: functional
id: REQ-31320
uid: 20261022043100320skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-023
sourceRuleStatus: Active
sourceRuleClause: 4
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31320::RuleREQ31320
---
# WKB-023 — Candidate Requirement 4

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Measured quantities print their unit (`[1.5 Meter]`).

## Authoritative origin

- [[WKB-023]] — exact source rule and decision origins
- [[WKB-023 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P2`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00011 - Display Linked Elements in Document Viewpoints]]

## Logical functions supported

- [[BEH-00005 - Generate Engineering Model Viewpoints]]

## Existing software architecture candidates

- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31152 - WKB-023 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31320 {
    requirement def RuleREQ31320 {
        doc /* Measured quantities print their unit (`[1.5 Meter]`). */
    }
}
```
