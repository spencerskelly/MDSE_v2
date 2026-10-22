---
type: Requirement
subtype: functional
id: REQ-31177
uid: 20261022043100177skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: IMP-102
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31177::RuleREQ31177
---
# IMP-102 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

A file or folder name is made safe for the browser's folder writer and for Windows: no control, bidi, line-separator or special characters, no lone surrogates, no trailing dot or space, and a device name (Con, Aux, Nul, Prn, Com0-9, Lpt0-9) is reserved with any extension, so `Con.pdf` becomes `Con_.pdf`.

## Authoritative origin

- [[IMP-102]] — exact source rule and decision origins
- [[IMP-102 - Analysis]] — clause decomposition and current classification
- Source family: `IMP`; semantic role: Import Functional Requirement; source phase `P1`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

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

- Proposed case: [[VER-31092 - IMP-102 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31177 {
    requirement def RuleREQ31177 {
        doc /* A file or folder name is made safe for the browser's folder writer and for Windows: no control, bidi, line-separator or special characters, no lone surrogates, no trailing dot or space, and a device name (Con, Aux, Nul, Prn, Com0-9, Lpt0-9) is reserved with any extension, so `Con.pdf` becomes `Con_.pdf`. */
    }
}
```
