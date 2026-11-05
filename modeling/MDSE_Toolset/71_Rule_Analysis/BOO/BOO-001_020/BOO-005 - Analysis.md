---
type: Info
subtype: ""
id: INFO-22347
uid: 20261022043000347skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOO-005
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Startup Functional Requirement"
---
# BOO-005 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[BOO-005]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOO-005]]
- Source: [governance/RULESET.md line 445](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L445)
- Family / section: BOO / Bootstrap
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Startup Functional Requirement**

## Candidate statement decomposition

1. Controlled plugin release: all runtime plugins ship inside the Base Vault, pinned and hashed in plugin-lock.yaml.
2. Bootstrap does release check and author registration; after the user trusts the author it may safely repair activation (enable locked plugins, disable prohibited core plugins) only if version and hashes match.
3. Governed data.json is hash-locked.
4. Bootstrap does not download or update binaries.
5. Startup verification is staged.

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
