---
type: Info
subtype: ""
id: INFO-22332
uid: 20261022043000332skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BAS-002
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Release and Packaging Constraint"
---
# BAS-002 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BAS-002]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BAS-002]]
- Source: [governance/RULESET.md line 425](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L425)
- Family / section: BAS / Base Vault and release
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Release and Packaging Constraint**

## Candidate statement decomposition

1. During pre-release the Base Vault pins the latest released Workbench; a newer candidate is recorded as `candidateVersion` in the release manifest.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31261 - BAS-002 Statement 1]] — During pre-release the Base Vault pins the latest released Workbench; a newer candidate is recorded as `candidateVersion` in the release manifest.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]

### Existing architecture / responsible parts

- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31130 - BAS-002 Rule Verification]]
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
