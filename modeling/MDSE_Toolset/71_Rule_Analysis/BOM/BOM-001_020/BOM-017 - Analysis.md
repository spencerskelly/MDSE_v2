---
type: Info
subtype: ""
id: INFO-22330
uid: 20261022043000330skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: BOM-017
sourceRuleStatus: Active
sourceRulePhase: P2
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "BOM Functional Requirement"
---
# BOM-017 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[BOM-017]] and the linked ruleset.

## Rule and provenance

- Original rule: [[BOM-017]]
- Source: [governance/RULESET.md line 418](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L418)
- Family / section: BOM / BOM import
- Source status: **Active** · phase **P2**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **BOM Functional Requirement**

## Candidate statement decomposition

1. The latest revision of a part number is the one it has as an assembly, or the one every parent pins when it is only a child.
2. When there are several, or two revisions each have lines, the part number and the lines that use it are not imported and an error finding names the revisions (BOM-009, BOM-002). A parent pinning an older child revision gets a `flagConflict`; the child's body lists its older-revision users.
3. Part numbers already noted in the vault are left as they are.
4. Findings go to `99_System/11_Import/BOM Findings <date>.md`.
5. EA to BOM matching by part number appearing in one EA element name, EA alias or PN tag is a report only. A part number that is already in the vault is kept; if the new file disagrees with it on any line (pinned revision, count or quantity, or a line that is new) the finding `EXISTING_DIFFERS` names the first lines that differ and nothing is rewritten.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31255 - BOM-017 Statement 1]] — The latest revision of a part number is the one it has as an assembly, or the one every parent pins when it is only a child.
- [[REQ-31256 - BOM-017 Statement 2]] — When there are several, or two revisions each have lines, the part number and the lines that use it are not imported and an error finding names the revisions (BOM-009, BOM-002). A parent pinning an older child revision gets a `flagConflict`; the child's body lists its older-revision users.
- [[REQ-31257 - BOM-017 Statement 3]] — Part numbers already noted in the vault are left as they are.
- [[REQ-31258 - BOM-017 Statement 4]] — Findings go to `99_System/11_Import/BOM Findings <date>.md`.
- [[REQ-31259 - BOM-017 Statement 5]] — EA to BOM matching by part number appearing in one EA element name, EA alias or PN tag is a report only. A part number that is already in the vault is kept; if the new file disagrees with it on any line (pinned revision, count or quantity, or a line that is new) the finding `EXISTING_DIFFERS` names the first lines that differ and nothing is rewritten.

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

- [[VER-31128 - BOM-017 Rule Verification]]
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
