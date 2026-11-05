---
type: Info
subtype: ""
id: INFO-22020
uid: 20261022043000020skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: DAT-002
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Data Protection Constraint"
---
# DAT-002 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[DAT-002]] and the linked ruleset.

## Rule and provenance

- Original rule: [[DAT-002]]
- Source: [governance/RULESET.md line 60](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L60)
- Family / section: DAT / Data handling
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Data Protection Constraint**

## Candidate statement decomposition

1. Public repos hold synthetic content only.
2. No real product names, BOMs, drawings, customers, revision histories or source exports.
3. Real models are imported only in a private/local environment. A scan is a backstop, not a guarantee.
4. Test_Vault_ stays the method and tool authority.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31033 - DAT-002 Statement 1]] — Public repos hold synthetic content only.
- [[REQ-31034 - DAT-002 Statement 2]] — No real product names, BOMs, drawings, customers, revision histories or source exports.
- [[REQ-31035 - DAT-002 Statement 3]] — Real models are imported only in a private/local environment. A scan is a backstop, not a guarantee.
- [[REQ-31036 - DAT-002 Statement 4]] — Test_Vault_ stays the method and tool authority.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00006 - View and Export Engineering Information]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31014 - DAT-002 Rule Verification]]
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
