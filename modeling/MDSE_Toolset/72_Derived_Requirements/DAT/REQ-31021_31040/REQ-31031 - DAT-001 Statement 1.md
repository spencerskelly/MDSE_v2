---
type: Requirement
subtype: design
id: REQ-31031
uid: 20261022043100031skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: DAT-001
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31031::RuleREQ31031
---
# DAT-001 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

Safety: QEAX, BOM originals, private ledgers, EA identifiers and generated real model content stay out of public Test_Vault_.

## Authoritative origin

- [[DAT-001]] — exact source rule and decision origins
- [[DAT-001 - Analysis]] — clause decomposition and current classification
- Source family: `DAT`; semantic role: Data Protection Constraint; source phase `Standing`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00006 - View and Export Engineering Information]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

## Existing software architecture candidates

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00003 - MDSE Workbench]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31013 - DAT-001 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31031 {
    requirement def RuleREQ31031 {
        doc /* Safety: QEAX, BOM originals, private ledgers, EA identifiers and generated real model content stay out of public Test_Vault_. */
    }
}
```
