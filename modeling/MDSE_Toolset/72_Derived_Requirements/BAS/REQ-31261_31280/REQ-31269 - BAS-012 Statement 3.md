---
type: Requirement
subtype: design
id: REQ-31269
uid: 20261022043100269skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BAS-012
sourceRuleStatus: Active
sourceRuleClause: 3
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31269::RuleREQ31269
---
# BAS-012 — Candidate Requirement 3

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Core plugins are the V1 set with Templates off.

## Authoritative origin

- [[BAS-012]] — exact source rule and decision origins
- [[BAS-012 - Analysis]] — clause decomposition and current classification
- Source family: `BAS`; semantic role: Release and Packaging Constraint; source phase `P1`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

## Existing software architecture candidates

- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31133 - BAS-012 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31269 {
    requirement def RuleREQ31269 {
        doc /* Core plugins are the V1 set with Templates off. */
    }
}
```
