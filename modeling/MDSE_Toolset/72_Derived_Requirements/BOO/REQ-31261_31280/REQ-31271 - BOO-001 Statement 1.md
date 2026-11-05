---
type: Requirement
subtype: functional
id: REQ-31271
uid: 20261022043100271skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BOO-001
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31271::RuleREQ31271
---
# BOO-001 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Controlled runtime dependencies need explicit value: essential = Bootstrap, Workbench, Templater, Advanced Canvas, Obsidian Git; provisional = Fileclass, Breadcrumbs; review for retirement = Dataview.

## Authoritative origin

- [[BOO-001]] — exact source rule and decision origins
- [[BOO-001 - Analysis]] — clause decomposition and current classification
- Source family: `BOO`; semantic role: Startup Functional Requirement; source phase `Standing`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00005 - MDSE Bootstrap]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31134 - BOO-001 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31271 {
    requirement def RuleREQ31271 {
        doc /* Controlled runtime dependencies need explicit value: essential = Bootstrap, Workbench, Templater, Advanced Canvas, Obsidian Git; provisional = Fileclass, Breadcrumbs; review for retirement = Dataview. */
    }
}
```
