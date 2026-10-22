---
type: Requirement
subtype: design
id: REQ-31326
uid: 20261022043100326skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: AIP-003
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31326::RuleREQ31326
---
# AIP-003 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

It may recommend a split.

## Authoritative origin

- [[AIP-003]] — exact source rule and decision origins
- [[AIP-003 - Analysis]] — clause decomposition and current classification
- Source family: `AIP`; semantic role: AI Behavior Constraint; source phase `Standing`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]
- [[OBJ-00003 - MDSE Workbench]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31155 - AIP-003 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31326 {
    requirement def RuleREQ31326 {
        doc /* It may recommend a split. */
    }
}
```
