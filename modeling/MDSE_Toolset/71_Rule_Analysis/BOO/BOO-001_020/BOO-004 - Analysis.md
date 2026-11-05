---
type: Info
subtype: ""
id: INFO-22346
uid: 20261022043000346skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOO-004
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Startup Functional Requirement"
---
# BOO-004 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[BOO-004]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOO-004]]
- Source: [governance/RULESET.md line 444](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L444)
- Family / section: BOO / Bootstrap
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Startup Functional Requirement**

## Candidate statement decomposition

1. The import goes into a fresh vault with MDSE Bootstrap and plugins installed. A script builds a clean base vault; the translator fills a copy of it and does not create the vault, Obsidian settings or plugins.
2. Base vault contents are approved as listed.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00005 - MDSE Bootstrap]] — responsibility candidate, not a certified allocation

### Verification case

- Pending status approval and identification of appropriate verification obligation.
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
