---
type: Info
subtype: ""
id: INFO-22362
uid: 20261022043000362skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-012
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-012 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-012]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-012]]
- Source: [governance/RULESET.md line 465](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L465)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. Relationship properties are written inside the relationship in SysML: a `doc` comment, `attribute name = value;` (or `attribute name { doc … }` when the value is not a plain number or simple text), usage modifiers `ordered` and `nonunique`, quantity and direction.
2. The drop-down offers only the options that relationship has; a free attribute name is accepted only where the relationship allows it (not specializes or verifies).
3. Renaming a usage is refused when its name is used elsewhere in the block.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31286 - WKB-012 Statement 1]] — Relationship properties are written inside the relationship in SysML: a `doc` comment, `attribute name = value;` (or `attribute name { doc … }` when the value is not a plain number or simple text), usage modifiers `ordered` and `nonunique`, quantity and direction.
- [[REQ-31287 - WKB-012 Statement 2]] — The drop-down offers only the options that relationship has; a free attribute name is accepted only where the relationship allows it (not specializes or verifies).
- [[REQ-31288 - WKB-012 Statement 3]] — Renaming a usage is refused when its name is used elsewhere in the block.

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31141 - WKB-012 Rule Verification]]
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
