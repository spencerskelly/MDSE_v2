---
type: Info
subtype: ""
id: INFO-22316
uid: 20261022043000316skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOM-003
sourceRuleStatus: Unreviewed
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "BOM Functional Requirement"
---
# BOM-003 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[BOM-003]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOM-003]]
- Source: [governance/RULESET.md line 404](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L404)
- Family / section: BOM / BOM import
- Source status: **Unreviewed** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **BOM Functional Requirement**

## Candidate statement decomposition

1. A row with blank internal Part Number and populated Manufacturing Part Number is an alternate of the preceding primary line in the same parent, revision, configuration and BOM group.
2. Consecutive rows attach to the same primary.
3. It is not a child usage and adds no quantity.
4. With no unambiguous preceding primary it is review-only.
5. Acceptance: the three-line example yields 2 required PC-100 occurrences.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation

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
