---
type: Requirement
subtype: stakeholder
id: STK-00014
uid: 20261021181500002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00014::ProductDiscoveryAide
---
# Product Discovery Aide

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Support early product discovery by connecting stakeholder problems, market or application context, product opportunities and existing engineering evidence.

## Stakeholders (proposed)

Product managers; applications engineers; engineering leads

## Desired outcome (proposed)

Capture a product opportunity, compare related needs and trace it toward engineering work.

## Candidate use case

Investigate a product opportunity

## Impact on toolset (preliminary)

Core; Workbench

## Existing coverage (preliminary)

No dedicated validated Product Discovery workflow established.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00014 {
    requirement def ProductDiscoveryAide {
        doc /* Support early product discovery by connecting stakeholder problems, market or application context, product opportunities and existing engineering evidence. */
    }
}
```
