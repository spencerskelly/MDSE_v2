---
type: Info
subtype: ""
id: INFO-22288
uid: 20261022043000288skellyspencer
status: Draft
sourceRole: derived-rule-analysis
ruleId: IMP-101
sourceRuleStatus: Active
sourceRulePhase: P1
sourceRevision: 5360a55e896498091b5c18b0218839f7e2b9ffba
traceConfidence: requires-semantic-review
modelRoleCandidate: "Import Functional Requirement"
---
# IMP-101 — Semantic Decomposition

> [!important] Rule analysis, not another source of authority
> Binding source rule; every derived requirement remains a **Draft interpretation** until its meaning and clause boundaries are reviewed. Original text and decision provenance remain in [[IMP-101]] and the linked ruleset.

## Rule and provenance

- Original rule: [[IMP-101]]
- Source: [governance/RULESET.md line 371](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md#L371)
- Family / section: IMP / EA to SysML v2 mapping
- Source status: **Active** · phase **P1**
- Initial relevance to Engineering Knowledge Base: **direct**
- Primary candidate modeling role: **Import Functional Requirement**

## Candidate statement decomposition

1. An EA Port becomes a port usage written `port name : [~]PortDef[mult]`.
2. The type is the Port's PDATA1 (an EA interface Class, which is a port definition, IMP-104); the Classifier field is not the type.
3. The multiplicity is the Multiplicity field, read as for parts
4. `~` is written when the object has an `isConjugated` tag with a true value (`true`, `yes`, `1` or EA's `-1`). A Port whose PDATA1 is not a port definition (a connector, a signal) is written without a type, the target is kept as a `- Port <name> is typed by [[…]]` line in Source, and the usage is flagged (`UNRESOLVED_PORT_TYPE:TARGET_IS_…`).

**Review caution:** These are source-text segments extracted using sentence/semicolon boundaries, not independently approved atomic requirements. Some segments contain several obligations and some may need to be recombined or factored into reusable definitions.

## Proposed model elements

### Requirement or constraint candidates

- [[REQ-31173 - IMP-101 Statement 1]] — An EA Port becomes a port usage written `port name : [~]PortDef[mult]`.
- [[REQ-31174 - IMP-101 Statement 2]] — The type is the Port's PDATA1 (an EA interface Class, which is a port definition, IMP-104); the Classifier field is not the type.
- [[REQ-31175 - IMP-101 Statement 3]] — The multiplicity is the Multiplicity field, read as for parts
- [[REQ-31176 - IMP-101 Statement 4]] — `~` is written when the object has an `isConjugated` tag with a true value (`true`, `yes`, `1` or EA's `-1`). A Port whose PDATA1 is not a port definition (a connector, a signal) is written without a type, the target is kept as a `- Port <name> is typed by [[…]]` line in Source, and the usage is flagged (`UNRESOLVED_PORT_TYPE:TARGET_IS_…`).

### Shared logical functions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00003 - Discover and Resolve Model Elements]]

### Existing use cases

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00002 - Search for a Part, Function or Design]]

### Existing architecture / responsible parts

- [[OBJ-00001 - MDSE Importer]] — responsibility candidate, not a certified allocation
- [[OBJ-00002 - MDSE Core]] — responsibility candidate, not a certified allocation

### Verification case

- [[VER-31091 - IMP-101 Rule Verification]]
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
