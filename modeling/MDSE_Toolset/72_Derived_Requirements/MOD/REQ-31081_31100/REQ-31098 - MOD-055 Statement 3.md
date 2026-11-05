---
type: Requirement
subtype: engineering
id: REQ-31098
uid: 20261022043100098skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-055
sourceRuleStatus: Active
sourceRuleClause: 3
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31098::RuleREQ31098
---
# MOD-055 — Candidate Requirement 3

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

EA's own metaclass is written EA Object.

## Authoritative origin

- [[MOD-055]] — exact source rule and decision origins
- [[MOD-055 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Semantic Requirement; source phase `Standing`
- This is one of 3 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00007 - Add Engineering Knowledge]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31050 - MOD-055 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31098 {
    requirement def RuleREQ31098 {
        doc /* EA's own metaclass is written EA Object. */
    }
}
```
