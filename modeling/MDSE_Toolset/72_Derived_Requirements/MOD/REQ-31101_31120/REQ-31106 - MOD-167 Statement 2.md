---
type: Requirement
subtype: engineering
id: REQ-31106
uid: 20261022043100106skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-167
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31106::RuleREQ31106
---
# MOD-167 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

It is removed by the merge or by clearing it; no inverse is written.

## Authoritative origin

- [[MOD-167]] — exact source rule and decision origins
- [[MOD-167 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Semantic Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]
- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]

## Logical functions supported

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31055 - MOD-167 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31106 {
    requirement def RuleREQ31106 {
        doc /* It is removed by the merge or by clearing it; no inverse is written. */
    }
}
```
