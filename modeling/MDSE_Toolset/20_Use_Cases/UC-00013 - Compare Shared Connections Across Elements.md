---
type: Use Case
subtype: what
id: UC-00013
uid: 20261021181502004skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00013::CompareCommonLinkedElements
---
# Compare Shared Connections Across Elements

> [!note] Engineering Knowledge Base use case — proposed
> Capability requested by the owner on 2026-10-21. Detailed scenario and implementation coverage are review candidates, not approved requirements.

## Intent

Select two or more elements and display the elements or paths that are connected to multiple selections.

## Primary actor

Engineer, systems architect, analyst or reviewer

## Main success scenario

1. Select two or more source elements.
2. Choose viewpoint, relation types, direction and optional hop depth.
3. Determine shared connected elements and optionally the distinct paths from each selection.
4. Display common and selection-specific connections in visual or document form.

## Expected outcome

The user identifies common functions, requirements, components, interfaces or other connections among selected elements.

## Alternate / constraint

Distinguish direct shared neighbors from multi-hop intersection; if none, show no intersection rather than combining unrelated elements.

## Candidate logical functions

Multi-seed graph query; compute common neighbors and path intersections; preserve input provenance; visualize or report intersection.

## Current evidence and gap

No verified multi-selection shared-connection implementation established; treat as gap until tested.

## Proposed trace

- Stakeholder capability: [[STK-00013 - Engineering Knowledge Base]]
- Related use cases: [[UC-00012 - Explore Multiple Relationship Hops]], [[UC-00010 - Visualize Relationships by Viewpoint]]
- Functions, derived requirements and verification: pending review.
- Relationship links are draft navigation; not independently SysML-parser-certified.

## Proposed functional coverage

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft SysML definition; this model's native syntax and relationships have not been independently parser-verified.

```sysml
package MDSE_UC_00013 {
    use case def CompareCommonLinkedElements {
        doc /* Select two or more elements and display the elements or paths that are connected to multiple selections. */
    }
}
```
