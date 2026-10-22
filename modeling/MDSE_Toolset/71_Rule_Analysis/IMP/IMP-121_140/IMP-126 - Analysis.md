---
type: Info
subtype: ""
id: INFO-22312
uid: 20261022043000312skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-126
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-126 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-126]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-126]]
- Source: [governance/RULESET.md line 395](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L395)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. An import into an existing vault shows the MDSE release, schema and every shipped plugin in the vault against the ones in the importer, with a state for each (same, newer in the importer, vault is newer, not installed, same version with different files).
2. Updating the toolset during the import is a choice: ticked by default only when the importer is newer, unticked when the vault is newer, forced on for a new vault.
3. Unticked, the model is imported and the installed tools stay as they are.
4. Ticked, it applies the same update as the maintenance section, with replaced files saved first.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31227 - IMP-126 Statement 1]] — An import into an existing vault shows the MDSE release, schema and every shipped plugin in the vault against the ones in the importer, with a state for each (same, newer in the importer, vault is newer, not installed, same version with different files).
- [[REQ-31228 - IMP-126 Statement 2]] — Updating the toolset during the import is a choice: ticked by default only when the importer is newer, unticked when the vault is newer, forced on for a new vault.
- [[REQ-31229 - IMP-126 Statement 3]] — Unticked, the model is imported and the installed tools stay as they are.
- [[REQ-31230 - IMP-126 Statement 4]] — Ticked, it applies the same update as the maintenance section, with replaced files saved first.

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

- [[VER-31115 - IMP-126 Rule Verification]]
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
