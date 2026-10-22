---
type: Info
subtype: ""
id: INFO-22310
uid: 20261022043000310skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-124
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-124 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-124]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-124]]
- Source: [governance/RULESET.md line 393](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L393)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. A usage or definition name keeps what makes the EA name different. A voltage puts its V at the decimal point and takes its sign as a letter: `+3.3VDC` is `P3V3DC`, `-13.3VDC` is `N13V3DC`, `12.5V` is `12V5`, `12VDC` stays `12VDC`; an unsigned voltage that starts the name takes `P`, because an identifier cannot start with a digit (`3.3VDC` is `P3V3DC`, so it and `+3.3VDC` meet and the second is told apart by its type).
2. Elsewhere a leading `+` is `plus`, a leading `-` is `minus`, a point between digits is `p`, `&` is `And`, `%` is `Pct`, `#` is `No`. A name that is only a number is named after its type (`wire1`, not `_1`).
3. Where the identifier is not just a respelling of the EA name, the EA name is recorded in `## Source: EA`.
4. Two usages with one name take the name of their type to tell them apart (`a`, then `a_IConductor`); only a repeat of the same type takes `_2`.
5. Quoted SysML names are not used, because every Workbench reader would need to change.
6. Definitions keep the full EA title as their name.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31215 - IMP-124 Statement 1]] — A usage or definition name keeps what makes the EA name different. A voltage puts its V at the decimal point and takes its sign as a letter: `+3.3VDC` is `P3V3DC`, `-13.3VDC` is `N13V3DC`, `12.5V` is `12V5`, `12VDC` stays `12VDC`; an unsigned voltage that starts the name takes `P`, because an identifier cannot start with a digit (`3.3VDC` is `P3V3DC`, so it and `+3.3VDC` meet and the second is told apart by its type).
- [[REQ-31216 - IMP-124 Statement 2]] — Elsewhere a leading `+` is `plus`, a leading `-` is `minus`, a point between digits is `p`, `&` is `And`, `%` is `Pct`, `#` is `No`. A name that is only a number is named after its type (`wire1`, not `_1`).
- [[REQ-31217 - IMP-124 Statement 3]] — Where the identifier is not just a respelling of the EA name, the EA name is recorded in `## Source: EA`.
- [[REQ-31218 - IMP-124 Statement 4]] — Two usages with one name take the name of their type to tell them apart (`a`, then `a_IConductor`); only a repeat of the same type takes `_2`.
- [[REQ-31219 - IMP-124 Statement 5]] — Quoted SysML names are not used, because every Workbench reader would need to change.
- [[REQ-31220 - IMP-124 Statement 6]] — Definitions keep the full EA title as their name.

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

- [[VER-31113 - IMP-124 Rule Verification]]
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
