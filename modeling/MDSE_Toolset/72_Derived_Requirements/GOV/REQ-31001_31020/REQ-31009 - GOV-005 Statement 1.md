---
type: Requirement
subtype: engineering
id: REQ-31009
uid: 20261022043100009skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: GOV-005
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31009::RuleREQ31009
---
# GOV-005 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

MDSE_v2 is the single home for MDSE rules, schemas and tools.

## Authoritative origin

- [[GOV-005]] — exact source rule and decision origins
- [[GOV-005 - Analysis]] — clause decomposition and current classification
- Source family: `GOV`; semantic role: Governance / Process Constraint; source phase `Standing`
- This is one of 2 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- No directly matching Engineering Knowledge Base interaction has been established; evaluate the broader tool lifecycle.

## Logical functions supported

- No functional link approved yet; cross-cutting governance may apply.

## Existing software architecture candidates

- [[OBJ-00002 - MDSE Core]]
- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31005 - GOV-005 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31009 {
    requirement def RuleREQ31009 {
        doc /* MDSE_v2 is the single home for MDSE rules, schemas and tools. */
    }
}
```
