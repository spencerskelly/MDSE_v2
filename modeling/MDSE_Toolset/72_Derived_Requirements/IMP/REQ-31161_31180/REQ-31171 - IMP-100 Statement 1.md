---
type: Requirement
subtype: functional
id: REQ-31171
uid: 20261022043100171skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-100
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31171::RuleREQ31171
---
# IMP-100 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

The page shows a stage progress bar with a labelled list of stages (fingerprint, translate EA, map BOM, assemble, write), and ends with the Obsidian steps: open the vault, click "Trust author and enable plugins", let Bootstrap verify and enable, confirm with the Bootstrap command.

## Authoritative origin

- [[IMP-100]] — exact source rule and decision origins
- [[IMP-100 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00002 - MDSE Core]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31090 - IMP-100 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31171 {
    requirement def RuleREQ31171 {
        doc /* The page shows a stage progress bar with a labelled list of stages (fingerprint, translate EA, map BOM, assemble, write), and ends with the Obsidian steps: open the vault, click "Trust author and enable plugins", let Bootstrap verify and enable, confirm with the Bootstrap command. */
    }
}
```
