---
type: Requirement
subtype: design
id: REQ-31266
uid: 20261022043100266skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BAS-004
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31266::RuleREQ31266
---
# BAS-004 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

A pre-release integration Base Vault may pin the declared Workbench candidate; an issued release may not.

## Authoritative origin

- [[BAS-004]] — exact source rule and decision origins
- [[BAS-004 - Analysis]] — clause decomposition and current classification
- Source family: `BAS`; semantic role: Release and Packaging Constraint; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

## Existing software architecture candidates

- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31132 - BAS-004 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31266 {
    requirement def RuleREQ31266 {
        doc /* A pre-release integration Base Vault may pin the declared Workbench candidate; an issued release may not. */
    }
}
```
