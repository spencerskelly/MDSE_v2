---
type: Info
subtype: ""
id: INFO-22322
uid: 20261022043000322skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOM-009
sourceRuleStatus: Active
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "BOM Functional Requirement"
---
# BOM-009 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BOM-009]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOM-009]]
- Source: [governance/RULESET.md line 410](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L410)
- Family / section: BOM / BOM import
- Source status: **Active** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **BOM Functional Requirement**

## Candidate statement decomposition

1. A PN whose latest revision cannot be determined is reported and not imported.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31238 - BOM-009 Statement 1]] — A PN whose latest revision cannot be determined is reported and not imported.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31120 - BOM-009 Rule Verification]]
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
