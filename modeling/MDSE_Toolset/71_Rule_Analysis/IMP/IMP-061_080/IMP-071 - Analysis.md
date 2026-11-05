---
type: Info
subtype: ""
id: INFO-22258
uid: 20261022043000258skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-071
sourceRuleStatus: Unreviewed
sourceRulePhase: Later
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-071 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[IMP-071]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-071]]
- Source: [governance/RULESET.md line 335](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L335)
- Family / section: IMP / Import behaviour
- Source status: **Unreviewed** · phase **Later**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. Diagrams-only run: adds diagram files to an existing vault, never creates or edits element notes, resolves references through the ledger uid, and is deterministic. A narrow exception to W-36 and W-37.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00002 - Search for a Part, Function or Design]]

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
