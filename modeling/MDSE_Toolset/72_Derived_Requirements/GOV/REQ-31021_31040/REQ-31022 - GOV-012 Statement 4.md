---
type: Requirement
subtype: engineering
id: REQ-31022
uid: 20261022043100022skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: GOV-012
sourceRuleStatus: Active
sourceRuleClause: 4
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31022::RuleREQ31022
---
# GOV-012 — Candidate Requirement 4

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Base builder owns the runtime payload, governed plugin config and pins/hashes.

## Authoritative origin

- [[GOV-012]] — exact source rule and decision origins
- [[GOV-012 - Analysis]] — clause decomposition and current classification
- Source family: `GOV`; semantic role: Governance / Process Constraint; source phase `Standing`
- This is one of 5 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]
- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31010 - GOV-012 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31022 {
    requirement def RuleREQ31022 {
        doc /* Base builder owns the runtime payload, governed plugin config and pins/hashes. */
    }
}
```
