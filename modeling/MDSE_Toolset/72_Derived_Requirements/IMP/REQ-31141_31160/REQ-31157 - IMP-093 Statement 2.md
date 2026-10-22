---
type: Requirement
subtype: functional
id: REQ-31157
uid: 20261022043100157skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-093
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31157::RuleREQ31157
---
# IMP-093 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Only `body` tags are written to `## Source: EA`. A value that is empty, `unassigned` or `<memo>` is never written, whatever its tag. A tag not in the list is kept in the body and reported as an import warning until it is given a disposition.

## Authoritative origin

- [[IMP-093]] — exact source rule and decision origins
- [[IMP-093 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

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

- Proposed case: [[VER-31083 - IMP-093 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31157 {
    requirement def RuleREQ31157 {
        doc /* Only `body` tags are written to `## Source: EA`. A value that is empty, `unassigned` or `<memo>` is never written, whatever its tag. A tag not in the list is kept in the body and reported as an import warning until it is given a disposition. */
    }
}
```
