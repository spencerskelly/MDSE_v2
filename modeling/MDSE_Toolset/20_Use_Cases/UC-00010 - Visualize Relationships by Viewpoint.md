---
type: Use Case
subtype: what
id: UC-00010
uid: 20261021181502001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00010::VisualizeLinkedElements
---
# Visualize Relationships by Viewpoint

> [!note] Engineering Knowledge Base use case — proposed
> Capability requested by the owner on 2026-10-21. Detailed scenario and implementation coverage are review candidates, not approved requirements.

## Intent

Display elements related to a selected element in a visual form, with selectable engineering viewpoints.

## Primary actor

Engineer or authorized model user

## Main success scenario

1. Select a model element.
2. Choose a viewpoint (e.g. structure, function, design, requirements, interfaces or all relationships).
3. Render nodes and typed links from the same canonical model graph.
4. Change viewpoint without mutating model meaning; inspect and navigate related notes.

## Expected outcome

An understandable graph or canvas showing only the relationships permitted by the chosen viewpoint.

## Alternate / constraint

Missing targets and filtered links are disclosed; an empty view is not proof that no relationships exist.

## Candidate logical functions

Query modeled graph; filter by viewpoint; lay out nodes and links; navigate selected result.

## Current evidence and gap

Workbench includes synthetic graph/canvas view tests; specific combinations and real-vault acceptance not verified.

## Proposed trace

- Stakeholder capability: [[STK-00013 - Engineering Knowledge Base]]
- Related use cases: [[UC-00003 - Explore Element Relationships]], [[UC-00012 - Explore Multiple Relationship Hops]]
- Functions, derived requirements and verification: pending review.
- Relationship links are draft navigation; not independently SysML-parser-certified.

## Proposed functional coverage

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft SysML definition; this model's native syntax and relationships have not been independently parser-verified.

```sysml
package MDSE_UC_00010 {
    use case def VisualizeLinkedElements {
        doc /* Display elements related to a selected element in a visual form, with selectable engineering viewpoints. */
    }
}
```
