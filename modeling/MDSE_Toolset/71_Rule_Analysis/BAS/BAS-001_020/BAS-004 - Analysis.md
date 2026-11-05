---
type: Info
subtype: ""
id: INFO-22334
uid: 20261022043000334skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BAS-004
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Release and Packaging Constraint"
---
# BAS-004 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BAS-004]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BAS-004]]
- Source: [governance/RULESET.md line 427](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L427)
- Family / section: BAS / Base Vault and release
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Release and Packaging Constraint**

## Candidate statement decomposition

1. A pre-release integration Base Vault may pin the declared Workbench candidate; an issued release may not.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31266 - BAS-004 Statement 1]] — A pre-release integration Base Vault may pin the declared Workbench candidate; an issued release may not.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]

### Existing architecture / responsible parts

- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31132 - BAS-004 Rule Verification]]
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
