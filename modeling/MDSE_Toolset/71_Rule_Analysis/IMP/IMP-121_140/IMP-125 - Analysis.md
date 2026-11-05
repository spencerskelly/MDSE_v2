---
type: Info
subtype: ""
id: INFO-22311
uid: 20261022043000311skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-125
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-125 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-125]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-125]]
- Source: [governance/RULESET.md line 394](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L394)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. The importer can check a run before it writes: the full translation runs in memory and lists every flag, every deferred row and every problem, with a verdict.
2. BLOCKED: the translation failed, a BOM error, or a file name the browser or Windows refuses.
3. REVIEW: rows that would be skipped, conflicts with edits in the vault, BOM parts that differ from the vault, more than 10% of elements deferred, or over 50 BOM warnings.
4. FLAGS: only flags.
5. The check also says what becomes of every source row: standard; merged; imported but a value did not follow the standard (counted by code; nothing lost, something guessed); not in the model and may be lost (deferred or skipped by an error); text only; excluded by policy.
6. It names the EA tables that are never read.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31221 - IMP-125 Statement 1]] — The importer can check a run before it writes: the full translation runs in memory and lists every flag, every deferred row and every problem, with a verdict.
- [[REQ-31222 - IMP-125 Statement 2]] — BLOCKED: the translation failed, a BOM error, or a file name the browser or Windows refuses.
- [[REQ-31223 - IMP-125 Statement 3]] — REVIEW: rows that would be skipped, conflicts with edits in the vault, BOM parts that differ from the vault, more than 10% of elements deferred, or over 50 BOM warnings.
- [[REQ-31224 - IMP-125 Statement 4]] — FLAGS: only flags.
- [[REQ-31225 - IMP-125 Statement 5]] — The check also says what becomes of every source row: standard; merged; imported but a value did not follow the standard (counted by code; nothing lost, something guessed); not in the model and may be lost (deferred or skipped by an error); text only; excluded by policy.
- [[REQ-31226 - IMP-125 Statement 6]] — It names the EA tables that are never read.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31114 - IMP-125 Rule Verification]]
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
