---
type: Requirement
subtype: functional
id: REQ-31286
uid: 20261022043100286skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-012
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31286::RuleREQ31286
---
# WKB-012 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Relationship properties are written inside the relationship in SysML: a `doc` comment, `attribute name = value;` (or `attribute name { doc … }` when the value is not a plain number or simple text), usage modifiers `ordered` and `nonunique`, quantity and direction.

## Authoritative origin

- [[WKB-012]] — exact source rule and decision origins
- [[WKB-012 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P1`
- This is one of 3 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]

## Logical functions supported

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31141 - WKB-012 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31286 {
    requirement def RuleREQ31286 {
        doc /* Relationship properties are written inside the relationship in SysML: a `doc` comment, `attribute name = value;` (or `attribute name { doc … }` when the value is not a plain number or simple text), usage modifiers `ordered` and `nonunique`, quantity and direction. */
    }
}
```
