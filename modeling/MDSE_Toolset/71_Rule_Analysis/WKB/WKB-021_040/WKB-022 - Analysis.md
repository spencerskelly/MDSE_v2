---
type: Info
subtype: ""
id: INFO-22372
uid: 20261022043000372skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-022
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-022 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-022]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-022]]
- Source: [governance/RULESET.md line 475](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L475)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. The Workbench keeps structure, design types, internal structure, function, states and requirements apart.
2. Structure shows parts only.
3. Design types shows only what a definition specializes and what specializes it.
4. Internal shows the parts with the ports each part's type offers (inherited ones included), the definition's own ports, and every connection, binding and flow with both ends resolved; an end that names a part or port that does not exist is marked.
5. Function shows actions and States shows states, each drawn alone.
6. Requirements shows the trace around the selected note.
7. The Obsidian panel has the same lenses.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31310 - WKB-022 Statement 1]] — The Workbench keeps structure, design types, internal structure, function, states and requirements apart.
- [[REQ-31311 - WKB-022 Statement 2]] — Structure shows parts only.
- [[REQ-31312 - WKB-022 Statement 3]] — Design types shows only what a definition specializes and what specializes it.
- [[REQ-31313 - WKB-022 Statement 4]] — Internal shows the parts with the ports each part's type offers (inherited ones included), the definition's own ports, and every connection, binding and flow with both ends resolved; an end that names a part or port that does not exist is marked.
- [[REQ-31314 - WKB-022 Statement 5]] — Function shows actions and States shows states, each drawn alone.
- [[REQ-31315 - WKB-022 Statement 6]] — Requirements shows the trace around the selected note.
- [[REQ-31316 - WKB-022 Statement 7]] — The Obsidian panel has the same lenses.

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

- [[VER-31151 - WKB-022 Rule Verification]]
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
