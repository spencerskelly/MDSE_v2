---
type: Info
subtype: ""
id: INFO-22365
uid: 20261022043000365skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-015
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-015 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-015]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-015]]
- Source: [governance/RULESET.md line 468](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L468)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. The Ports tab checks before it previews: names are unique in the owner, a port or end is typed by a port definition, only items and attributes have a direction, a path must resolve through the owner's usages (inherited ones included), an interface connection joins ports, each port matches its end's type and conjugation, and a flow starts at an out (or inout) feature and ends at an in (or inout) one, with every `~` on the path reversing directions.
2. Type or end mismatches that SysML allows (bound features of different types, both ports unconjugated) are shown as notes, not refusals. A member that has a body (properties, description) is not rewritten by the Ports tab.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31294 - WKB-015 Statement 1]] — The Ports tab checks before it previews: names are unique in the owner, a port or end is typed by a port definition, only items and attributes have a direction, a path must resolve through the owner's usages (inherited ones included), an interface connection joins ports, each port matches its end's type and conjugation, and a flow starts at an out (or inout) feature and ends at an in (or inout) one, with every `~` on the path reversing directions.
- [[REQ-31295 - WKB-015 Statement 2]] — Type or end mismatches that SysML allows (bound features of different types, both ports unconjugated) are shown as notes, not refusals. A member that has a body (properties, description) is not rewritten by the Ports tab.

### Shared logical functions

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31144 - WKB-015 Rule Verification]]
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
