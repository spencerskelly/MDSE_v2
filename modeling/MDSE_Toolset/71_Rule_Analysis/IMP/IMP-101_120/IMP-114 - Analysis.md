---
type: Info
subtype: ""
id: INFO-22300
uid: 20261022043000300skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-114
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-114 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-114]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-114]]
- Source: [governance/RULESET.md line 383](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L383)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. An element nested (ParentID) under one of its own kind is a usage of it in the owner: activity in activity or in a state or verification case is `action x : X;`, state in state `state x : X;`, requirement in requirement `requirement x : X;`.
2. Folders, notes and files do not change.
3. Nesting of other kinds stays organizational. (Test_Vault_ nested states/activities, other-nesting and nested-requirement approvals; D-0038)

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31196 - IMP-114 Statement 1]] — An element nested (ParentID) under one of its own kind is a usage of it in the owner: activity in activity or in a state or verification case is `action x : X;`, state in state `state x : X;`, requirement in requirement `requirement x : X;`.
- [[REQ-31197 - IMP-114 Statement 2]] — Folders, notes and files do not change.
- [[REQ-31198 - IMP-114 Statement 3]] — Nesting of other kinds stays organizational. (Test_Vault_ nested states/activities, other-nesting and nested-requirement approvals; D-0038)

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31103 - IMP-114 Rule Verification]]
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
