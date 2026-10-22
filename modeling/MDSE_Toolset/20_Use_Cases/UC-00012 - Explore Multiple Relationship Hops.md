---
type: Use Case
subtype: what
id: UC-00012
uid: 20261021181502003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00012::ExploreMultipleHops
---
# Explore Multiple Relationship Hops

> [!note] Engineering Knowledge Base use case — proposed
> Capability requested by the owner on 2026-10-21. Detailed scenario and implementation coverage are review candidates, not approved requirements.

## Intent

Display relationships across multiple hops from the selected element rather than only directly attached elements.

## Primary actor

Engineer, systems architect or reviewer

## Main success scenario

1. Select a starting element.
2. Set maximum hop depth and eligible relationship families, direction and viewpoint.
3. Traverse explicitly modeled relationships and display path or graph results with depth indicators.
4. Expand or narrow scope and inspect each intermediate element.

## Expected outcome

The user sees how a selected element connects through one or more intermediates without hidden or invented edges.

## Alternate / constraint

Apply cycle protection, scope/cap disclosure and predictable filtering; report truncated traversals.

## Candidate logical functions

Traverse model graph; bound depth and filters; deduplicate paths; report cycles and caps.

## Current evidence and gap

Workbench contains depth/hops and filtering logic; exact full contract and performance acceptance unverified.

## Proposed trace

- Stakeholder capability: [[STK-00013 - Engineering Knowledge Base]]
- Related use cases: [[UC-00003 - Explore Element Relationships]], [[UC-00013 - Compare Shared Connections Across Elements]]
- Functions, derived requirements and verification: pending review.
- Relationship links are draft navigation; not independently SysML-parser-certified.

## Proposed functional coverage

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft SysML definition; this model's native syntax and relationships have not been independently parser-verified.

```sysml
package MDSE_UC_00012 {
    use case def ExploreMultipleHops {
        doc /* Display relationships across multiple hops from the selected element rather than only directly attached elements. */
    }
}
```
