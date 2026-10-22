---
type: Requirement
subtype: engineering
id: REQ-31134
uid: 20261022043100134skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: MOD-166
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31134::RuleREQ31134
---
# MOD-166 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Every example in the language catalog is recognized by the Workbench scanner as that construct, with no warnings. A statement the scanner cannot classify is reported, never dropped.

## Authoritative origin

- [[MOD-166]] — exact source rule and decision origins
- [[MOD-166 - Analysis]] — clause decomposition and current classification
- Source family: `MOD`; semantic role: Model Semantic Requirement; source phase `P1`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00016 - Display Flagged Model Data]]
- [[UC-00005 - Explore Complete Product Context]]

## Logical functions supported

- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31069 - MOD-166 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31134 {
    requirement def RuleREQ31134 {
        doc /* Every example in the language catalog is recognized by the Workbench scanner as that construct, with no warnings. A statement the scanner cannot classify is reported, never dropped. */
    }
}
```
