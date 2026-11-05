---
type: Info
subtype: ""
id: INFO-22382
uid: 20261022043000382skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: TST-005
sourceRuleStatus: Unreviewed
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Verification and Acceptance Obligation"
---
# TST-005 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> **Not binding:** source rule has not been owner-approved. Keep historical meaning and decide applicability first. Original text and decision provenance remain in [[TST-005]] and the linked ruleset.

## Rule and provenance

- Original rule: [[TST-005]]
- Source: [governance/RULESET.md line 495](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L495)
- Family / section: TST / Testing and acceptance
- Source status: **Unreviewed** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **supporting**
- Primary candidate modeling role: **Verification and Acceptance Obligation**

## Candidate statement decomposition

1. Release acceptance targets R1 to R7: R1 read-only fingerprint/schema/ledger coverage; R2 deterministic canonical mapping with native/extension/deferred outcomes; R3 valid native SysML for eligible rows, separately parser-tested; R4 notes generated into a fresh disposable V2 Base; R5 read-only Workbench shows definition/usage distinction, navigation, provenance, diagnostics; R6 independent Windows/macOS/offline packaging with locked dependencies; R7 no golden claim until outcome and UI checks are complete.

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
