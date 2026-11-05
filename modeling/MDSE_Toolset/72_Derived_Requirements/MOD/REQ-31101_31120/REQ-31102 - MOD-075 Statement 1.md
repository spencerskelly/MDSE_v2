---
type: Requirement
subtype: engineering
id: REQ-31102
uid: 20261022043100102skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-075
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31102::RuleREQ31102
---
# MOD-075 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Relationship endpoint rules (allowed source and target classes) live on each relationship in relationships.yaml.

## Authoritative origin

- [[MOD-075]] — exact source rule and decision origins
- [[MOD-075 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Semantic Requirement; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]

## Logical functions supported

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31053 - MOD-075 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31102 {
    requirement def RuleREQ31102 {
        doc /* Relationship endpoint rules (allowed source and target classes) live on each relationship in relationships.yaml. */
    }
}
```
