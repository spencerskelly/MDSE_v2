---
type: Info
subtype: ""
id: INFO-22280
uid: 20261022043000280skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-093
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-093 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-093]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-093]]
- Source: [governance/RULESET.md line 363](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L363)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. Tagged values follow `governance/schemas/ea-tag-dispositions.json` (the V1 list, 121 tags, decisions W-29 to W-106).
2. Only `body` tags are written to `## Source: EA`. A value that is empty, `unassigned` or `<memo>` is never written, whatever its tag. A tag not in the list is kept in the body and reported as an import warning until it is given a disposition.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31156 - IMP-093 Statement 1]] — Tagged values follow `governance/schemas/ea-tag-dispositions.json` (the V1 list, 121 tags, decisions W-29 to W-106).
- [[REQ-31157 - IMP-093 Statement 2]] — Only `body` tags are written to `## Source: EA`. A value that is empty, `unassigned` or `<memo>` is never written, whatever its tag. A tag not in the list is kept in the body and reported as an import warning until it is given a disposition.

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

- [[VER-31083 - IMP-093 Rule Verification]]
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
