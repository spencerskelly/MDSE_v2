---
type: Info
subtype: ""
id: INFO-22368
uid: 20261022043000368skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: WKB-018
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "User Interaction Requirement"
---
# WKB-018 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[WKB-018]] and the linked ruleset.

## Rule and provenance

- Original rule: [[WKB-018]]
- Source: [governance/RULESET.md line 471](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L471)
- Family / section: WKB / Workbench
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **User Interaction Requirement**

## Candidate statement decomposition

1. A merge keeps the surviving note's file name, id, uid and SysML package.
2. The removed note's content is folded in: frontmatter (more specific subtype, EA class, tags and relationship fields combined), user text under `## Merged from <title>`, Source lines combined without repeats, SysML members carried over with the removed definition's symbol rewritten to the survivor's and its specializations added. A member both notes define differently stays in the survivor and the other is kept under `## Not carried over from <title>` as sysml text.
3. The removed title is listed under `## Aliases` and its id and uid under `## Former ids`.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31302 - WKB-018 Statement 1]] — A merge keeps the surviving note's file name, id, uid and SysML package.
- [[REQ-31303 - WKB-018 Statement 2]] — The removed note's content is folded in: frontmatter (more specific subtype, EA class, tags and relationship fields combined), user text under `## Merged from <title>`, Source lines combined without repeats, SysML members carried over with the removed definition's symbol rewritten to the survivor's and its specializations added. A member both notes define differently stays in the survivor and the other is kept under `## Not carried over from <title>` as sysml text.
- [[REQ-31304 - WKB-018 Statement 3]] — The removed title is listed under `## Aliases` and its id and uid under `## Former ids`.

### Shared logical functions

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31147 - WKB-018 Rule Verification]]
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
