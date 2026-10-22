---
type: Info
subtype: ""
id: INFO-22186
uid: 20261022043000186skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: MOD-165
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Model Semantic Requirement"
---
# MOD-165 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[MOD-165]] and the linked ruleset.

## Rule and provenance

- Original rule: [[MOD-165]]
- Source: [governance/RULESET.md line 255](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L255)
- Family / section: MOD / Flags
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Model Semantic Requirement**

## Candidate statement decomposition

1. The SysML v2 language is documented one note per construct (element and relationship) in `governance/language/`, built from `catalog.json`.
2. Each note gives the description, the elements it can come from and go to, what separates it from the most similar construct, an example, and how often engineers use it (Everyday, Common, Occasional, Rare).
3. The notes ship in every vault under `99_System/04_Language`.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31131 - MOD-165 Statement 1]] — The SysML v2 language is documented one note per construct (element and relationship) in `governance/language/`, built from `catalog.json`.
- [[REQ-31132 - MOD-165 Statement 2]] — Each note gives the description, the elements it can come from and go to, what separates it from the most similar construct, an example, and how often engineers use it (Everyday, Common, Occasional, Rare).
- [[REQ-31133 - MOD-165 Statement 3]] — The notes ship in every vault under `99_System/04_Language`.

### Shared logical functions

- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

### Existing use cases

- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00016 - Display Flagged Model Data]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31068 - MOD-165 Rule Verification]]
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
