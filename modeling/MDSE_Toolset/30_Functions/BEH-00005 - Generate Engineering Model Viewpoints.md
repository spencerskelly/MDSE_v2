---
type: Behavior
subtype: function
id: BEH-00005
uid: 20261021195900004skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00005::GenerateModelViewpoints
---
# Generate Engineering Model Viewpoints

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Create visual, table, document and review projections of selected model content using the same underlying model relationships.

## Inputs

Graph query result; viewpoint; filters and presentation preferences.

## Outputs

Navigable visual, document or review representations with identity/source links.

## Functional decomposition candidates

- Select a model scope and viewpoint
- Use a shared query result rather than independent model semantics
- Render visual nodes/edges, table entries or linked document sections
- Expose filters, limits, missing targets and flags

## Function boundary

A viewpoint is not a competing semantic model; equivalent visual and document projections use the same relationships.

## Use cases depending on this function

- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00006 - View and Export Engineering Information]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]
- [[UC-00016 - Display Flagged Model Data]]

## Candidate verification outcome

View changes do not mutate source notes; corresponding representations cite the same identities; flagged gaps remain visible.

## Existing implementation evidence — not certification

Partial: tools/workbench/src/views.ts, canvas.ts and panel.ts; generalized document viewpoints unverified.

## Proposed subfunctions

- Viewpoint selection
- visual rendering
- document rendering
- review overlays

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00005 {
    action def GenerateModelViewpoints {
        doc /* Create visual, table, document and review projections of selected model content using the same underlying model relationships. */
    }
}
```
