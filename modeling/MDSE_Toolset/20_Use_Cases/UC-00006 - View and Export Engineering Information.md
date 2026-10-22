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

## View and composition refinements

- [[UC-00011 - Display Linked Elements in Document Viewpoints]] gives a structured document-form view of selected links and relationships.
- [[UC-00010 - Visualize Relationships by Viewpoint]] gives a visual counterpart based on the same underlying selection.
- [[UC-00015 - Compose Documentation from Embedded Notes]] uses Obsidian `![[...]]` transclusion to assemble presentations or documentation without copying a semantic definition.

Exports are presentation artifacts derived from authoritative notes, and must not automatically become another source of truth.

## Proposed functional coverage

- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00006 {
    use case def ViewAndExportInformation {
        doc /* View model data and export it for communication to others. */
    }
}
```
