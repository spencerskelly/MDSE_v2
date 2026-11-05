---
type: Info
subtype: ""
id: INFO-22268
uid: 20261022043000268skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-081
sourceRuleStatus: Active
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-081 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-081]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-081]]
- Source: [governance/RULESET.md line 348](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L348)
- Family / section: IMP / Merge, rerun and conflicts
- Source status: **Active** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. A change to any existing value requires approval, including EA-owned fields.
2. Approval is given before the run (pre-approval, by field selection in the Start step) or after the run (review approval).

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31144 - IMP-081 Statement 1]] — A change to any existing value requires approval, including EA-owned fields.
- [[REQ-31145 - IMP-081 Statement 2]] — Approval is given before the run (pre-approval, by field selection in the Start step) or after the run (review approval).

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31076 - IMP-081 Rule Verification]]
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
