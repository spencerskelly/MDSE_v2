---
type: Requirement
subtype: design
id: REQ-31115
uid: 20261022043100115skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-120
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31115::RuleREQ31115
---
# MOD-120 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Non-negotiable: approved mappings are not reopened because implementation is incomplete; native OMG SysML v2 only, with non-native MDSE evidence and review flags distinct; V2 builds independently of archived V1; each source element and connector gets an auditable disposition with zero hidden drops; syntax parsing, semantic validation, end-user UI and package/release acceptance are different gates.

## Authoritative origin

- [[MOD-120]] — exact source rule and decision origins
- [[MOD-120 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Representation Constraint; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]
- [[UC-00016 - Display Flagged Model Data]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31060 - MOD-120 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31115 {
    requirement def RuleREQ31115 {
        doc /* Non-negotiable: approved mappings are not reopened because implementation is incomplete; native OMG SysML v2 only, with non-native MDSE evidence and review flags distinct; V2 builds independently of archived V1; each source element and connector gets an auditable disposition with zero hidden drops; syntax parsing, semantic validation, end-user UI and package/release acceptance are different gates. */
    }
}
```
