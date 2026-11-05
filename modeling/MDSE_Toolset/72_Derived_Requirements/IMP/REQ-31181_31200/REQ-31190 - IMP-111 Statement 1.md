---
type: Requirement
subtype: functional
id: REQ-31190
uid: 20261022043100190skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-111
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31190::RuleREQ31190
---
# IMP-111 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

An EA Object points at the Class it is a kind of through Classifier; its part def specializes that Class's part def (`:>`), never typed by it. (V1 W-135, approved exception on Object classifiers; D-0037)

## Authoritative origin

- [[IMP-111]] — exact source rule and decision origins
- [[IMP-111 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31100 - IMP-111 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31190 {
    requirement def RuleREQ31190 {
        doc /* An EA Object points at the Class it is a kind of through Classifier; its part def specializes that Class's part def (`:>`), never typed by it. (V1 W-135, approved exception on Object classifiers; D-0037) */
    }
}
```
