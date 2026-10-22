---
type: Requirement
subtype: stakeholder
id: STK-00017
uid: 20261021181500005skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00017::FailureModeAndEffectAnalysis
---
# Failure Mode and Effect Analysis

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Identify potential failure modes, consequences, causes, mitigations and verification evidence in relation to affected product elements and functions.

## Stakeholders (proposed)

Safety engineers; reliability engineers; design teams

## Desired outcome (proposed)

Trace a failure mode from an affected function or component through risk assessment, recommended actions and checks.

## Candidate use case

Analyze and manage a potential failure mode

## Impact on toolset (preliminary)

Core; Workbench

## Existing coverage (preliminary)

Failure Mode and Issue model classifications exist; complete FMEA workflow not verified.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00017 {
    requirement def FailureModeAndEffectAnalysis {
        doc /* Identify potential failure modes, consequences, causes, mitigations and verification evidence in relation to affected product elements and functions. */
    }
}
```
