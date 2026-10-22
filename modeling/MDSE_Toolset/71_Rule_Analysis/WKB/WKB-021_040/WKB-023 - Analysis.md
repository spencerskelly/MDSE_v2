---
type: Info
subtype: ""
id: INFO-22373
uid: 20261022043000373skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-023
sourceRuleStatus: Active
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-023 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-023]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-023]]
- Source: [governance/RULESET.md line 476](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L476)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. Every section of a note view and every list group folds.
2. Each page has Collapse all and Expand all; which sections are open is kept while the person moves between notes.
3. The Notes list can be grouped by type or folder, each group folded.
4. Measured quantities print their unit (`[1.5 Meter]`).

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31317 - WKB-023 Statement 1]] — Every section of a note view and every list group folds.
- [[REQ-31318 - WKB-023 Statement 2]] — Each page has Collapse all and Expand all; which sections are open is kept while the person moves between notes.
- [[REQ-31319 - WKB-023 Statement 3]] — The Notes list can be grouped by type or folder, each group folded.
- [[REQ-31320 - WKB-023 Statement 4]] — Measured quantities print their unit (`[1.5 Meter]`).

### Shared logical functions

- [[BEH-00005 - Generate Engineering Model Viewpoints]]

### Existing use cases

- [[UC-00011 - Display Linked Elements in Document Viewpoints]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31152 - WKB-023 Rule Verification]]
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
