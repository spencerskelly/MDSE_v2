---
type: Info
subtype: ""
id: INFO-22004
uid: 20261022043000004skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: GOV-004
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Governance / Process Constraint"
---
# GOV-004 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[GOV-004]] and the linked ruleset.

## Rule and provenance

- Original rule: [[GOV-004]]
- Source: [governance/RULESET.md line 36](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L36)
- Family / section: GOV / Governance
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Governance / Process Constraint**

## Candidate statement decomposition

1. Rules live in `governance/RULESET.md` only.
2. Decisions that create, change or retire a rule are recorded in `governance/DECISIONS.md` and name the rule they change.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31007 - GOV-004 Statement 1]] — Rules live in `governance/RULESET.md` only.
- [[REQ-31008 - GOV-004 Statement 2]] — Decisions that create, change or retire a rule are recorded in `governance/DECISIONS.md` and name the rule they change.

### Shared logical functions

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation
- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31004 - GOV-004 Rule Verification]]
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
