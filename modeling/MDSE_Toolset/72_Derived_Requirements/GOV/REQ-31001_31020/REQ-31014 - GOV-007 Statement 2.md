---
type: Requirement
subtype: engineering
id: REQ-31014
uid: 20261022043100014skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: GOV-007
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31014::RuleREQ31014
---
# GOV-007 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

AGENTS.md at the root is a pointer to it.

## Authoritative origin

- [[GOV-007]] — exact source rule and decision origins
- [[GOV-007 - Analysis]] — clause decomposition and current classification
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

- Proposed case: [[VER-31007 - GOV-007 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31014 {
    requirement def RuleREQ31014 {
        doc /* AGENTS.md at the root is a pointer to it. */
    }
}
```
