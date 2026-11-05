---
type: Requirement
subtype: engineering
id: REQ-31330
uid: 20261022043100330skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: TST-002
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31330::RuleREQ31330
---
# TST-002 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Workbench candidate CI runs a 10,000-note semantic-cache scale smoke (completion/memory regression gate, not timing).

## Authoritative origin

- [[TST-002]] — exact source rule and decision origins
- [[TST-002 - Analysis]] — clause decomposition and current classification
- Source family: `TST`; semantic role: Verification and Acceptance Obligation; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00016 - Display Flagged Model Data]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]
- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31158 - TST-002 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31330 {
    requirement def RuleREQ31330 {
        doc /* Workbench candidate CI runs a 10,000-note semantic-cache scale smoke (completion/memory regression gate, not timing). */
    }
}
```
