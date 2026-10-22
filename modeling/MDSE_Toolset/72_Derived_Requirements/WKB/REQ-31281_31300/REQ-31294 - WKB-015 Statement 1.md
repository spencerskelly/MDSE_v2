---
type: Requirement
subtype: functional
id: REQ-31294
uid: 20261022043100294skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-015
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31294::RuleREQ31294
---
# WKB-015 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

The Ports tab checks before it previews: names are unique in the owner, a port or end is typed by a port definition, only items and attributes have a direction, a path must resolve through the owner's usages (inherited ones included), an interface connection joins ports, each port matches its end's type and conjugation, and a flow starts at an out (or inout) feature and ends at an in (or inout) one, with every `~` on the path reversing directions.

## Authoritative origin

- [[WKB-015]] — exact source rule and decision origins
- [[WKB-015 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31144 - WKB-015 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31294 {
    requirement def RuleREQ31294 {
        doc /* The Ports tab checks before it previews: names are unique in the owner, a port or end is typed by a port definition, only items and attributes have a direction, a path must resolve through the owner's usages (inherited ones included), an interface connection joins ports, each port matches its end's type and conjugation, and a flow starts at an out (or inout) feature and ends at an in (or inout) one, with every `~` on the path reversing directions. */
    }
}
```
