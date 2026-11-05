---
type: Requirement
subtype: functional
id: REQ-31273
uid: 20261022043100273skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BOO-007
sourceRuleStatus: Active
sourceRuleClause: 2
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31273::RuleREQ31273
---
# BOO-007 — Candidate Requirement 2

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

It checks each locked plugin's files against the lock, enables those that match, merges the lock's governed settings into their `data.json` (the person's other keys stay), enables required and switches off prohibited core plugins, and reports what it did in one notice. A plugin whose hash differs or whose file is missing stays off and is named.

## Authoritative origin

- [[BOO-007]] — exact source rule and decision origins
- [[BOO-007 - Analysis]] — clause decomposition and current classification
- Source family: `BOO`; semantic role: Startup Functional Requirement; source phase `P1`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

## Logical functions supported

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

## Existing software architecture candidates

- [[OBJ-00005 - MDSE Bootstrap]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31135 - BOO-007 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31273 {
    requirement def RuleREQ31273 {
        doc /* It checks each locked plugin's files against the lock, enables those that match, merges the lock's governed settings into their `data.json` (the person's other keys stay), enables required and switches off prohibited core plugins, and reports what it did in one notice. A plugin whose hash differs or whose file is missing stays off and is named. */
    }
}
```
