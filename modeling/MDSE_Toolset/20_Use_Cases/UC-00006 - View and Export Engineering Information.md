---
type: Use Case
subtype: what
id: UC-00006
uid: 20261021181501005skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00006::ViewAndExportInformation
---
# View and Export Engineering Information

> [!note] Draft use case for Engineering Knowledge Base
> The user action comes from the owner. Process steps, actors and success outcomes are initial interpretations for review; not an approved software specification.

## Intent

View model data and export it for communication to others.

## Primary actor

Engineer; authorized collaborator

## Trigger

User needs to share selected engineering information.

## Main scenario (proposed)

Choose model element/list/view; set scope and filters; review status/provenance; export appropriate representation.

## Successful outcome

A shareable representation reflects selected model information and indicates its status.

## Alternative and review concern

Audience permissions, export formats, and approval for external disclosure need definition.

## Candidate logical functions

Select model data; render views; export governed information.

## Traceability

- Stakeholder need: [[STK-00013 - Engineering Knowledge Base]]
- Engineering requirements: not yet derived
- Test case and executed evidence: not yet established
- Formal SysML link to stakeholder need: pending independent parser validation

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00006 {
    use case def ViewAndExportInformation {
        doc /* View model data and export it for communication to others. */
    }
}
```
