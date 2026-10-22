---
type: Info
subtype: ""
id: INFO-22376
uid: 20261022043000376skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: AIP-003
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "AI Behavior Constraint"
---
# AIP-003 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[AIP-003]] and the linked ruleset.

## Rule and provenance

- Original rule: [[AIP-003]]
- Source: [governance/RULESET.md line 484](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L484)
- Family / section: AIP / AI processes
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **AI Behavior Constraint**

## Candidate statement decomposition

1. AI does not create or split vaults.
2. It may recommend a split.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31325 - AIP-003 Statement 1]] — AI does not create or split vaults.
- [[REQ-31326 - AIP-003 Statement 2]] — It may recommend a split.

### Shared logical functions

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation
- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31155 - AIP-003 Rule Verification]]
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
