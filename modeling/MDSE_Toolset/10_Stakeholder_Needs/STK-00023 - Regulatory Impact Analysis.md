---
type: Requirement
subtype: stakeholder
id: STK-00023
uid: 20261021181500011skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00023::RegulatoryImpactAnalysis
---
# Regulatory Impact Analysis

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Relate applicable regulations and standards to requirements, products, architectures and changes so compliance implications can be assessed.

## Stakeholders (proposed)

Compliance engineers; regulatory specialists; engineering management

## Desired outcome (proposed)

For a proposed design or requirement change, identify potentially affected standards, evidence and review obligations.

## Candidate use case

Assess regulatory implications of a product change

## Impact on toolset (preliminary)

Core; Workbench

## Existing coverage (preliminary)

Standard requirement classification exists; impact-analysis workflow not verified.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00023 {
    requirement def RegulatoryImpactAnalysis {
        doc /* Relate applicable regulations and standards to requirements, products, architectures and changes so compliance implications can be assessed. */
    }
}
```
