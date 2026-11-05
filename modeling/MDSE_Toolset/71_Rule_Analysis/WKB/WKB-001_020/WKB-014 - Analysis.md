---
type: Info
subtype: ""
id: INFO-22364
uid: 20261022043000364skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-014
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-014 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-014]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-014]]
- Source: [governance/RULESET.md line 467](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L467)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. The Edit lens has a Ports tab for a part, item, port or interface definition.
2. It adds, changes and removes: port definition features (`in|out|inout item|attribute|port`), port usages (`[ref] port p : [~]PortDef [mult] [ordered] [nonunique]`), interface definition ends (`end e : [~]PortDef`), connections (`connect`, `connection [n] [: Def] connect`, `interface [n] [: Def] connect`, with optional `end ::>` bindings), flows (`flow [n] [of Item] from a.x to b.y`) and bindings (`bind a.x = b.y`).
3. Types are chosen in the searchable browser; paths are offered from the owner's parts and their ports.
4. Every option has a "?".

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31290 - WKB-014 Statement 1]] — The Edit lens has a Ports tab for a part, item, port or interface definition.
- [[REQ-31291 - WKB-014 Statement 2]] — It adds, changes and removes: port definition features (`in|out|inout item|attribute|port`), port usages (`[ref] port p : [~]PortDef [mult] [ordered] [nonunique]`), interface definition ends (`end e : [~]PortDef`), connections (`connect`, `connection [n] [: Def] connect`, `interface [n] [: Def] connect`, with optional `end ::>` bindings), flows (`flow [n] [of Item] from a.x to b.y`) and bindings (`bind a.x = b.y`).
- [[REQ-31292 - WKB-014 Statement 3]] — Types are chosen in the searchable browser; paths are offered from the owner's parts and their ports.
- [[REQ-31293 - WKB-014 Statement 4]] — Every option has a "?".

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

- [[VER-31143 - WKB-014 Rule Verification]]
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
