---
type: Requirement
subtype: design
id: REQ-31034
uid: 20261022043100034skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: DAT-002
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31034::RuleREQ31034
---
# DAT-002 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

No real product names, BOMs, drawings, customers, revision histories or source exports.

## Authoritative origin

- [[DAT-002]] — exact source rule and decision origins
- [[DAT-002 - Analysis]] — clause decomposition and current classification
- Source family: `DAT`; semantic role: Data Protection Constraint; source phase `Standing`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00006 - View and Export Engineering Information]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00003 - MDSE Workbench]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31014 - DAT-002 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31034 {
    requirement def RuleREQ31034 {
        doc /* No real product names, BOMs, drawings, customers, revision histories or source exports. */
    }
}
```
