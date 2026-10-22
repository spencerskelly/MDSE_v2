---
type: Info
subtype: ""
id: INFO-22283
uid: 20261022043000283skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-096
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-096 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-096]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-096]]
- Source: [governance/RULESET.md line 366](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L366)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. Structure, links, quantities and multiplicity are defined by the SysML v2 block and are not repeated in `## Source: EA`.
2. Relationships SysML v2 has no form for, and identifying properties, stay in the YAML (`describes`, `eaType`, `uid`, `id`).
3. `## Source: EA` holds only what is stored nowhere else: the note's EA GUID, the original name when the file name differs, alias, the kept tags, trigger and guard text, unresolved connectors and attachments.
4. EA author, created date, type, stereotype and package are not written: the uid carries date and author, `eaType` carries type and stereotype, the folder carries the package.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31161 - IMP-096 Statement 1]] — Structure, links, quantities and multiplicity are defined by the SysML v2 block and are not repeated in `## Source: EA`.
- [[REQ-31162 - IMP-096 Statement 2]] — Relationships SysML v2 has no form for, and identifying properties, stay in the YAML (`describes`, `eaType`, `uid`, `id`).
- [[REQ-31163 - IMP-096 Statement 3]] — `## Source: EA` holds only what is stored nowhere else: the note's EA GUID, the original name when the file name differs, alias, the kept tags, trigger and guard text, unresolved connectors and attachments.
- [[REQ-31164 - IMP-096 Statement 4]] — EA author, created date, type, stereotype and package are not written: the uid carries date and author, `eaType` carries type and stereotype, the folder carries the package.

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

- [[VER-31086 - IMP-096 Rule Verification]]
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
