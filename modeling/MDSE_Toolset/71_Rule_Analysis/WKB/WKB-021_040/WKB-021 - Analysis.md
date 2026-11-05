---
type: Info
subtype: ""
id: INFO-22371
uid: 20261022043000371skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-021
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-021 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-021]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-021]]
- Source: [governance/RULESET.md line 474](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L474)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. The rolled-up parts list multiplies counts down the assembly and keeps measured amounts (`quantity` with `unit`) apart by unit; a count and a length are never added. A quantity of 0 is a document line and adds nothing.
2. Structure shows a measured amount where a count would be. (BOM-016, D-0040)

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31308 - WKB-021 Statement 1]] — The rolled-up parts list multiplies counts down the assembly and keeps measured amounts (`quantity` with `unit`) apart by unit; a count and a length are never added. A quantity of 0 is a document line and adds nothing.
- [[REQ-31309 - WKB-021 Statement 2]] — Structure shows a measured amount where a count would be. (BOM-016, D-0040)

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]

### Existing use cases

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31150 - WKB-021 Rule Verification]]
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
