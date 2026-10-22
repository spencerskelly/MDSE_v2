---
type: Info
subtype: ""
id: INFO-22010
uid: 20261022043000010skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: GOV-010
sourceRuleStatus: Check
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Governance / Process Constraint"
---
# GOV-010 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Decision conflict check:** reconcile later decision before deriving new live obligations. Original text and decision provenance remain in [[GOV-010]] and the linked ruleset.

## Rule and provenance

- Original rule: [[GOV-010]]
- Source: [governance/RULESET.md line 42](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L42)
- Family / section: GOV / Governance
- Source status: **Check** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **legacy-review**
- Primary candidate modeling role: **Governance / Process Constraint**

## Candidate statement decomposition

1. 00 - Current State.md is the single entry point and registry for the methodology workspace; mdse-release.yaml is its machine-readable twin and the single release/build authority. check-release.py verifies both.
2. The lean engineering base intentionally omits them.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- No direct function established; cross-cutting governance or legacy review may apply.

### Existing use cases

- No existing knowledge-base use case assigned. Define a new use case only when a stakeholder interaction actually requires one.

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation
- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- Pending status approval and identification of appropriate verification obligation.
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
