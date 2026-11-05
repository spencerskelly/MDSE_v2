---
type: Info
subtype: ""
id: INFO-22385
uid: 20261022043000385skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: TST-008
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Verification and Acceptance Obligation"
---
# TST-008 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[TST-008]] and the linked ruleset.

## Rule and provenance

- Original rule: [[TST-008]]
- Source: [governance/RULESET.md line 498](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L498)
- Family / section: TST / Testing and acceptance
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Verification and Acceptance Obligation**

## Candidate statement decomposition

1. Release gates: QEAX and CSV adapters share one source graph schema; parser accepts positives and rejects negatives; repeat import no-op with modified engineer notes and attachments surviving and conflicts unable to disappear
2. Workbench navigates, edits, saves, undoes and reopens with unchanged semantics
3. Bootstrap installs, previews updates, preserves user state and rolls back
4. Windows and macOS Obsidian smoke acceptance.
5. Deferred: automatic plugin updates, enterprise login, multiuser concurrent editing, advanced graphical design, V1 compatibility.

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- Not instantiated. Original status requires review before deriving enforceable requirements.

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00016 - Display Flagged Model Data]]

### Existing architecture / responsible parts

- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation
- [[OBJ-00003 - MDSE Workbench]] — responsibility candidate, not a certified allocation
- [[OBJ-00004 - MDSE Base Vault]] — responsibility candidate, not a certified allocation

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
