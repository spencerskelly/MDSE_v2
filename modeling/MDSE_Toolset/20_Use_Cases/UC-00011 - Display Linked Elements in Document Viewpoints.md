---
type: Use Case
subtype: what
id: UC-00011
uid: 20261021181502002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00011::DocumentViewOfLinks
---
# Display Linked Elements in Document Viewpoints

> [!note] Engineering Knowledge Base use case — proposed
> Capability requested by the owner on 2026-10-21. Detailed scenario and implementation coverage are review candidates, not approved requirements.

## Intent

Display the same linked engineering content as a navigable document or structured report with different viewpoints.

## Primary actor

Engineer, technical writer or authorized model user

## Main success scenario

1. Select a model element and a document viewpoint.
2. Query applicable relationships using the shared graph selection rules.
3. Render an ordered narrative, outline, table or report with linked element identity and provenance.
4. Review the resulting document view or export where supported.

## Expected outcome

A document-form perspective on the chosen model with traceability to originating elements.

## Alternate / constraint

Avoid copying model definitions as a second authority; rendered text is derived from source notes.

## Candidate logical functions

Query viewpoint projection; render document/list hierarchy; preserve source links; present/export.

## Current evidence and gap

Workbench tables/CSV exist, but a general document-form multi-view renderer is unverified.

## Proposed trace

- Stakeholder capability: [[STK-00013 - Engineering Knowledge Base]]
- Related use cases: [[UC-00006 - View and Export Engineering Information]], [[UC-00015 - Compose Documentation from Embedded Notes]]
- Functions, derived requirements and verification: pending review.
- Relationship links are draft navigation; not independently SysML-parser-certified.

## Proposed functional coverage

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft SysML definition; this model's native syntax and relationships have not been independently parser-verified.

```sysml
package MDSE_UC_00011 {
    use case def DocumentViewOfLinks {
        doc /* Display the same linked engineering content as a navigable document or structured report with different viewpoints. */
    }
}
```
