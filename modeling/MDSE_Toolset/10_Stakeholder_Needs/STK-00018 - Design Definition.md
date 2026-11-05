---
type: Requirement
subtype: stakeholder
id: STK-00018
uid: 20261021181500006skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00018::DesignDefinition
---
# Design Definition

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Describe the selected design, its governing constraints and engineering rationale in a form linked to requirements and architecture.

## Stakeholders (proposed)

Design engineers; discipline owners; design reviewers

## Desired outcome (proposed)

Understand what has been designed, why, and which requirements and constraints it addresses.

## Candidate use case

Define and review a design

## Impact on toolset (preliminary)

Core; Importer; Workbench

## Existing coverage (preliminary)

Design and state translation decisions exist; design authoring/approval workflow not verified.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00018 {
    requirement def DesignDefinition {
        doc /* Describe the selected design, its governing constraints and engineering rationale in a form linked to requirements and architecture. */
    }
}
```
