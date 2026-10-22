---
type: Info
subtype: ""
id: INFO-22012
uid: 20261022043000012skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: GOV-012
sourceRuleStatus: Active
sourceRulePhase: Standing
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Governance / Process Constraint"
---
# GOV-012 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[GOV-012]] and the linked ruleset.

## Rule and provenance

- Original rule: [[GOV-012]]
- Source: [governance/RULESET.md line 44](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L44)
- Family / section: GOV / Governance
- Source status: **Active** · phase **Standing**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Governance / Process Constraint**

## Candidate statement decomposition

1. Tool ownership: Workbench owns UI behavior, disposable index, ModelRef navigation, schema-valid edit transactions and Review disposition (not semantics, importer mapping or release packaging).
2. Bootstrap owns safe activation repair, release verification and author registration.
3. Importer owns source translation, naming/identity allocation and import evidence (not editing or plugin management).
4. Base builder owns the runtime payload, governed plugin config and pins/hashes.
5. Cross-vault is deferred (archived resolver is reference only). A tool may not silently broaden or redefine model semantics; archived material never overrides a current source.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31019 - GOV-012 Statement 1]] — Tool ownership: Workbench owns UI behavior, disposable index, ModelRef navigation, schema-valid edit transactions and Review disposition (not semantics, importer mapping or release packaging).
- [[REQ-31020 - GOV-012 Statement 2]] — Bootstrap owns safe activation repair, release verification and author registration.
- [[REQ-31021 - GOV-012 Statement 3]] — Importer owns source translation, naming/identity allocation and import evidence (not editing or plugin management).
- [[REQ-31022 - GOV-012 Statement 4]] — Base builder owns the runtime payload, governed plugin config and pins/hashes.
- [[REQ-31023 - GOV-012 Statement 5]] — Cross-vault is deferred (archived resolver is reference only). A tool may not silently broaden or redefine model semantics; archived material never overrides a current source.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation
- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31010 - GOV-012 Rule Verification]]
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
