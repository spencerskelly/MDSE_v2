---
type: Requirement
subtype: design
id: REQ-31121
uid: 20261022043100121skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-146
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31121::RuleREQ31121
---
# MOD-146 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Exact pinned versions appear only in the release manifest.

## Authoritative origin

- [[MOD-146]] — exact source rule and decision origins
- [[MOD-146 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Representation Constraint; source phase `Standing`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31063 - MOD-146 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31121 {
    requirement def RuleREQ31121 {
        doc /* Exact pinned versions appear only in the release manifest. */
    }
}
```
