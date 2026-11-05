---
type: Info
subtype: ""
id: INFO-22328
uid: 20261022043000328skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOM-015
sourceRuleStatus: Active
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "BOM Functional Requirement"
---
# BOM-015 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BOM-015]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOM-015]]
- Source: [governance/RULESET.md line 416](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L416)
- Family / section: BOM / BOM import
- Source status: **Active** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **BOM Functional Requirement**

## Candidate statement decomposition

1. The importer reads the BOM from `.xlsx`, `.csv` or `.tsv` in the page.
2. Two layouts are recognised by header names: flat (Parent Part Number, Child Part Number, Linenumber, Amount, Unit …) and redline (Number, CL1, CL2, level columns 0..7 or Structure).
3. Part numbers are read as text.
4. In a redline, unstruck text in a cell is current and struck text is the previous value; a part number struck with no replacement is a removed line. A sheet with no recognised header is refused with the reason.
5. The redline layout was checked against the four real redlines

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31245 - BOM-015 Statement 1]] — The importer reads the BOM from `.xlsx`, `.csv` or `.tsv` in the page.
- [[REQ-31246 - BOM-015 Statement 2]] — Two layouts are recognised by header names: flat (Parent Part Number, Child Part Number, Linenumber, Amount, Unit …) and redline (Number, CL1, CL2, level columns 0..7 or Structure).
- [[REQ-31247 - BOM-015 Statement 3]] — Part numbers are read as text.
- [[REQ-31248 - BOM-015 Statement 4]] — In a redline, unstruck text in a cell is current and struck text is the previous value; a part number struck with no replacement is a removed line. A sheet with no recognised header is refused with the reason.
- [[REQ-31249 - BOM-015 Statement 5]] — The redline layout was checked against the four real redlines

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00005 - Explore Complete Product Context]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31126 - BOM-015 Rule Verification]]
- Executed result: **none linked**
- Test source and CI evidence: **individual reconciliation pending**

## Decomposition review checklist

- Is this a stakeholder need, system requirement, design constraint, procedure, architectural decision, or explanatory definition?
- Are all statements truly atomic, testable and necessary? Are they duplicated by another rule?
- Should the requirement reference an existing function or a newly identified function?
- Is a use case an actual actor interaction, rather than a function or implementation step?
- Does the suggested architectural responsibility match the existing code and approved tool boundary?
- Are existing test cases sufficient, and does an execution result demonstrate the rule?
- Is the original rule Active and current, or does later V2 policy supersede it?

No existing source code, governing rule, or test was modified by generating this analysis.
