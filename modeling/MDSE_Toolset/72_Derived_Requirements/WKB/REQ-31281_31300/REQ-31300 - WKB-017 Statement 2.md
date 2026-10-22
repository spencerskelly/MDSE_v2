---
type: Requirement
subtype: functional
id: REQ-31300
uid: 20261022043100300skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: WKB-017
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31300::RuleREQ31300
---
# WKB-017 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

An alias is marked from the open note or from matches found between BOM parts and EA notes: the EA part number (`- PN:` or `- Part Number:`) equal to the BOM number, then the number inside the EA title, then a close name; only the first two with a single candidate are ticked for the person.

## Authoritative origin

- [[WKB-017]] — exact source rule and decision origins
- [[WKB-017 - Analysis]] — clause decomposition and current classification
- Source family: `WKB`; semantic role: User Interaction Requirement; source phase `P1`
- This is one of 3 initial segments. It may need further splitting, combining or deduplication.

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

- Proposed case: [[VER-31146 - WKB-017 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31300 {
    requirement def RuleREQ31300 {
        doc /* An alias is marked from the open note or from matches found between BOM parts and EA notes: the EA part number (`- PN:` or `- Part Number:`) equal to the BOM number, then the number inside the EA title, then a close name; only the first two with a single candidate are ticked for the person. */
    }
}
```
