---
type: Info
subtype: ""
id: INFO-22299
uid: 20261022043000299skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-113
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-113 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-113]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-113]]
- Source: [governance/RULESET.md line 382](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L382)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. An Aggregation or Composition makes the child a usage in the whole, of the kind its two definitions are: part/part is `part`, action/action `action`, state/state `state`, item/item `item`, requirement/requirement `requirement`, part/port def `port`, use case/use case `use case`.
2. The whole is the end marked composite or shared.
3. Every connector is its own usage, even with the same two ends; it takes the child end's role name, else the child's name with `_2` suffixes, and the child end's multiplicity (none is invented).
4. An EA Part or nested element of that type is matched to one connector and not repeated. A connector whose whole and part sit in one cycle of ownership is left out as OWNERSHIP_CYCLE. A part that is the child of an interface is AGGREGATION_PART_IN_INTERFACE (review). (Test_Vault_ approved aggregation docs 2026-10-17; D-0038)

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31192 - IMP-113 Statement 1]] — An Aggregation or Composition makes the child a usage in the whole, of the kind its two definitions are: part/part is `part`, action/action `action`, state/state `state`, item/item `item`, requirement/requirement `requirement`, part/port def `port`, use case/use case `use case`.
- [[REQ-31193 - IMP-113 Statement 2]] — The whole is the end marked composite or shared.
- [[REQ-31194 - IMP-113 Statement 3]] — Every connector is its own usage, even with the same two ends; it takes the child end's role name, else the child's name with `_2` suffixes, and the child end's multiplicity (none is invented).
- [[REQ-31195 - IMP-113 Statement 4]] — An EA Part or nested element of that type is matched to one connector and not repeated. A connector whose whole and part sit in one cycle of ownership is left out as OWNERSHIP_CYCLE. A part that is the child of an interface is AGGREGATION_PART_IN_INTERFACE (review). (Test_Vault_ approved aggregation docs 2026-10-17; D-0038)

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31102 - IMP-113 Rule Verification]]
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
