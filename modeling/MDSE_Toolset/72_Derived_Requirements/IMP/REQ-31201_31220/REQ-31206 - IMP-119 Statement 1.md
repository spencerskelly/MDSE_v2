---
type: Requirement
subtype: functional
id: REQ-31206
uid: 20261022043100206skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-119
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31206::RuleREQ31206
---
# IMP-119 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Tags on an EA Part whose disposition is `body` (PN, Piece Cost, Style, Quantity...) describe that use of the part in the assembly, so they are written as one `- On part <name>: tag: value; ...` line in the owning assembly's Source section, not lost with the usage and not copied to the part def. (V1 W-136, REG-142; D-0038)

## Authoritative origin

- [[IMP-119]] — exact source rule and decision origins
- [[IMP-119 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- One preliminary segment; its atomicity is not yet established.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31108 - IMP-119 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31206 {
    requirement def RuleREQ31206 {
        doc /* Tags on an EA Part whose disposition is `body` (PN, Piece Cost, Style, Quantity...) describe that use of the part in the assembly, so they are written as one `- On part <name>: tag: value; ...` line in the owning assembly's Source section, not lost with the usage and not copied to the part def. (V1 W-136, REG-142; D-0038) */
    }
}
```
