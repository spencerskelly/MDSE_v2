---
type: Info
subtype: ""
id: INFO-22141
uid: 20261022043000141skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: MOD-120
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Model Representation Constraint"
---
# MOD-120 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[MOD-120]] and the linked ruleset.

## Rule and provenance

- Original rule: [[MOD-120]]
- Source: [governance/RULESET.md line 201](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L201)
- Family / section: MOD / SysML v2 authority
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Model Representation Constraint**

## Candidate statement decomposition

1. Non-negotiable: approved mappings are not reopened because implementation is incomplete; native OMG SysML v2 only, with non-native MDSE evidence and review flags distinct; V2 builds independently of archived V1; each source element and connector gets an auditable disposition with zero hidden drops; syntax parsing, semantic validation, end-user UI and package/release acceptance are different gates.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31115 - MOD-120 Statement 1]] — Non-negotiable: approved mappings are not reopened because implementation is incomplete; native OMG SysML v2 only, with non-native MDSE evidence and review flags distinct; V2 builds independently of archived V1; each source element and connector gets an auditable disposition with zero hidden drops; syntax parsing, semantic validation, end-user UI and package/release acceptance are different gates.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]
- [[UC-00016 - Display Flagged Model Data]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31060 - MOD-120 Rule Verification]]
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
