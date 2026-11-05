---
type: Info
subtype: ""
id: INFO-22248
uid: 20261022043000248skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-061
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-061 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[IMP-061]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-061]]
- Source: [governance/RULESET.md line 325](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L325)
- Family / section: IMP / Import behaviour
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. Vault write contract: preflight (read-only fingerprint, schema, pinned ruleset and SysML v2.0 library manifest; no write on mismatch); build a typed semantic graph; stage a complete manifest of additions, changes and deletions in a disposable directory; validate and preview the diff before atomic publish; failed validation leaves the approved vault untouched; canonical semantic files stay separate from view/layout metadata and reports; record a run manifest (fixture hash, timestamps, tool/rule/library versions, disposition totals, validation results, exceptions, file hashes, changeset, rollback reference).

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

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
