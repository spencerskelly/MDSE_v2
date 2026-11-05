---
type: Info
subtype: ""
id: INFO-22104
uid: 20261022043000104skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: MOD-084
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Model Semantic Requirement"
---
# MOD-084 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[MOD-084]] and the linked ruleset.

## Rule and provenance

- Original rule: [[MOD-084]]
- Source: [governance/RULESET.md line 158](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L158)
- Family / section: MOD / Relationships
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Model Semantic Requirement**

## Candidate statement decomposition

1. ControlFlow and StateFlow become precedes/follows.
2. Flow elements stay modelCheck notes
3. StateFlow carries trigger, guard and effect lines.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]

### Existing architecture / responsible parts

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
