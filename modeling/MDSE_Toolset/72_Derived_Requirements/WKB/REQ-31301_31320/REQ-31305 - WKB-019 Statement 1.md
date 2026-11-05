---
type: Requirement
subtype: functional
id: REQ-31305
uid: 20261022043100305skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-019
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31305::RuleREQ31305
---
# WKB-019 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

A merge rewrites every other note: `[[Removed]]` becomes `[[Kept|Removed]]` in text (frontmatter lists get the plain new name, without repeats or links to itself) and the removed definition's symbol becomes the kept one in every SysML block. A chain of aliases resolves to its end; many aliases merge in one preview, with the changed files counted, the removed files listed and one Undo that brings them all back. A note with more than one definition, a survivor with no SysML block and notes of different classes are refused with the reason.

## Authoritative origin

- [[WKB-019]] — exact source rule and decision origins
- [[WKB-019 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P1`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31148 - WKB-019 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31305 {
    requirement def RuleREQ31305 {
        doc /* A merge rewrites every other note: `[[Removed]]` becomes `[[Kept|Removed]]` in text (frontmatter lists get the plain new name, without repeats or links to itself) and the removed definition's symbol becomes the kept one in every SysML block. A chain of aliases resolves to its end; many aliases merge in one preview, with the changed files counted, the removed files listed and one Undo that brings them all back. A note with more than one definition, a survivor with no SysML block and notes of different classes are refused with the reason. */
    }
}
```
