---
type: Info
subtype: ""
id: INFO-22184
uid: 20261022043000184skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: MOD-163
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Model Semantic Requirement"
---
# MOD-163 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[MOD-163]] and the linked ruleset.

## Rule and provenance

- Original rule: [[MOD-163]]
- Source: [governance/RULESET.md line 253](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L253)
- Family / section: MOD / Flags
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Model Semantic Requirement**

## Candidate statement decomposition

1. A flag is an Obsidian callout whose type names the issue.
2. Types: `flagImport`, `flagConflict`, `flagLink`, `flagNote`.
3. New types are added to this section before use.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31126 - MOD-163 Statement 1]] — A flag is an Obsidian callout whose type names the issue.
- [[REQ-31127 - MOD-163 Statement 2]] — Types: `flagImport`, `flagConflict`, `flagLink`, `flagNote`.
- [[REQ-31128 - MOD-163 Statement 3]] — New types are added to this section before use.

### Shared logical functions

- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

### Existing use cases

- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00016 - Display Flagged Model Data]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31066 - MOD-163 Rule Verification]]
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
