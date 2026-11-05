---
type: Info
subtype: ""
id: INFO-22331
uid: 20261022043000331skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BAS-001
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Release and Packaging Constraint"
---
# BAS-001 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BAS-001]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BAS-001]]
- Source: [governance/RULESET.md line 424](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L424)
- Family / section: BAS / Base Vault and release
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Release and Packaging Constraint**

## Candidate statement decomposition

1. Each importer and its clean base vault are a matched pair with one release version, checked before planning or writing (mdse_release in .vault.yaml).

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31260 - BAS-001 Statement 1]] — Each importer and its clean base vault are a matched pair with one release version, checked before planning or writing (mdse_release in .vault.yaml).

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]

### Existing architecture / responsible parts

- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31129 - BAS-001 Rule Verification]]
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
