---
type: Info
subtype: ""
id: INFO-22095
uid: 20261022043000095skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: MOD-075
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Model Semantic Requirement"
---
# MOD-075 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[MOD-075]] and the linked ruleset.

## Rule and provenance

- Original rule: [[MOD-075]]
- Source: [governance/RULESET.md line 149](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L149)
- Family / section: MOD / Relationships
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Model Semantic Requirement**

## Candidate statement decomposition

1. Relationship endpoint rules (allowed source and target classes) live on each relationship in relationships.yaml.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31102 - MOD-075 Statement 1]] — Relationship endpoint rules (allowed source and target classes) live on each relationship in relationships.yaml.

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31053 - MOD-075 Rule Verification]]
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
