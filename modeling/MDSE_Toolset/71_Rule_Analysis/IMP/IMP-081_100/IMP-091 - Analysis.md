---
type: Info
subtype: ""
id: INFO-22278
uid: 20261022043000278skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-091
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-091 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[IMP-091]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-091]]
- Source: [governance/RULESET.md line 361](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L361)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. Connector family mapping (26 families, 14,688 connectors): Generalization to specialization
2. Abstraction:allocate to allocation
3. Aggregation to owned PartUsage where physical containment is evidenced, else review
4. Dependency:satisfy to satisfy
5. Realisation to perform/allocate by endpoint kinds, else review; refine to Dependency + Refinement metadata
6. Association to ConnectionUsage only if connectivity is proven
7. UseCase:extend to optional case usage
8. UseCase:include to required nested case usage ControlFlow to Succession with guards StateFlow to transition Nesting to approved nested usage else organizational NoteLink to YAML links only Sequence reference-only Usage to generic Dependency Dependency:verify to verification Connector to port-to-port ConnectionUsage Realisation:deriveReqt takes precedence over generic Realisation. Eligibility is per connector, never per family.

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
