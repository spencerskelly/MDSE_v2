---
type: Requirement
subtype: functional
id: REQ-31282
uid: 20261022043100282skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-010
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31282::RuleREQ31282
---
# WKB-010 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

A new note's id is the class prefix plus the highest existing number plus one (MOD-007); its uid is local time plus the author code from `.vault.yaml` and moves forward one millisecond on a clash (MOD-004).

## Authoritative origin

- [[WKB-010]] — exact source rule and decision origins
- [[WKB-010 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31139 - WKB-010 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31282 {
    requirement def RuleREQ31282 {
        doc /* A new note's id is the class prefix plus the highest existing number plus one (MOD-007); its uid is local time plus the author code from `.vault.yaml` and moves forward one millisecond on a clash (MOD-004). */
    }
}
```
