---
type: Requirement
subtype: design
id: REQ-31107
uid: 20261022043100107skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-095
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31107::RuleREQ31107
---
# MOD-095 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Full-import usability amendments: folder structure is navigation, no count-based splits, about 5 to 6 folder levels, a one-child folder collapses only when it has no independent value.

## Authoritative origin

- [[MOD-095]] — exact source rule and decision origins
- [[MOD-095 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Representation Constraint; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00005 - Explore Complete Product Context]]

## Logical functions supported

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31056 - MOD-095 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31107 {
    requirement def RuleREQ31107 {
        doc /* Full-import usability amendments: folder structure is navigation, no count-based splits, about 5 to 6 folder levels, a one-child folder collapses only when it has no independent value. */
    }
}
```
