---
type: Info
subtype: ""
id: INFO-22355
uid: 20261022043000355skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-005
sourceRuleStatus: Unreviewed
sourceRulePhase: P3
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-005 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[WKB-005]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-005]]
- Source: [governance/RULESET.md line 458](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L458)
- Family / section: WKB / Workbench
- Source status: **Unreviewed** · phase **P3**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. Workbench is an editor, not only a viewer, for Local Model context and reusable definitions through separate surfaces.
2. Internal Structure view is a presentation of one Local Model context
3. Canvas geometry is never model semantics.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
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
