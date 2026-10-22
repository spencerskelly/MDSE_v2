---
type: Info
subtype: ""
id: INFO-22349
uid: 20261022043000349skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOO-007
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Startup Functional Requirement"
---
# BOO-007 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BOO-007]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOO-007]]
- Source: [governance/RULESET.md line 447](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L447)
- Family / section: BOO / Bootstrap
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Startup Functional Requirement**

## Candidate statement decomposition

1. Bootstrap runs after the person trusts the vault, about two seconds after layout.
2. It checks each locked plugin's files against the lock, enables those that match, merges the lock's governed settings into their `data.json` (the person's other keys stay), enables required and switches off prohibited core plugins, and reports what it did in one notice. A plugin whose hash differs or whose file is missing stays off and is named.
3. It never downloads.
4. The command "Check and repair this vault" runs it again.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31272 - BOO-007 Statement 1]] — Bootstrap runs after the person trusts the vault, about two seconds after layout.
- [[REQ-31273 - BOO-007 Statement 2]] — It checks each locked plugin's files against the lock, enables those that match, merges the lock's governed settings into their `data.json` (the person's other keys stay), enables required and switches off prohibited core plugins, and reports what it did in one notice. A plugin whose hash differs or whose file is missing stays off and is named.
- [[REQ-31274 - BOO-007 Statement 3]] — It never downloads.
- [[REQ-31275 - BOO-007 Statement 4]] — The command "Check and repair this vault" runs it again.

### Shared logical functions

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00005 - MDSE Bootstrap]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31135 - BOO-007 Rule Verification]]
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
