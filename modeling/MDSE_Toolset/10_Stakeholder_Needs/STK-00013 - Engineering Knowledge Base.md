---
type: Requirement
subtype: stakeholder
id: STK-00013
uid: 20261021181500001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00013::EngineeringKnowledgeBase
---
# Engineering Knowledge Base

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

A shared, navigable engineering knowledge base that connects product information, decisions, sources and technical relationships.

## Stakeholders (proposed)

Engineers; engineering managers; technical reviewers

## Desired outcome (proposed)

Find an authoritative topic and navigate linked engineering context without reconstructing it from disconnected files.

## Candidate use case

Find and understand existing product knowledge

## Impact on toolset (preliminary)

Core; Importer; Workbench

## Existing coverage (preliminary)

Existing architecture, model, importer and Workbench; acceptance incomplete.

## Candidate trace

- Potential use case: [[UC-00001 - Import an Engineering Model]] (existing model pilot; partial coverage)
- Related draft quality need: [[STK-00001 - Accessible Engineering Knowledge]]
- Earlier `STK-00003` pilot describes a supporting *source-preservation* quality, not this whole capability.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00013 {
    requirement def EngineeringKnowledgeBase {
        doc /* A shared, navigable engineering knowledge base that connects product information, decisions, sources and technical relationships. */
    }
}
```
