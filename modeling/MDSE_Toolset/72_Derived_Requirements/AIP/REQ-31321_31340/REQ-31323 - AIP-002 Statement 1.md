---
type: Requirement
subtype: design
id: REQ-31323
uid: 20261022043100323skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: AIP-002
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31323::RuleREQ31323
---
# AIP-002 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

AI processes do not edit model files unless the process is a note-creation process under R-2.x.

## Authoritative origin

- [[AIP-002]] — exact source rule and decision origins
- [[AIP-002 - Analysis]] — clause decomposition and current classification
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

- Proposed case: [[VER-31154 - AIP-002 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31323 {
    requirement def RuleREQ31323 {
        doc /* AI processes do not edit model files unless the process is a note-creation process under R-2.x. */
    }
}
```
