---
type: Behavior
subtype: function
id: BEH-00004
uid: 20261021195900003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00004::TraverseModelRelationships
---
# Query and Traverse Model Relationships

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Answer queries on typed model relationships for one or several elements, including direction, types, hop depth, paths and shared connections.

## Inputs

One or more model elements; typed model graph; depth/direction/filter settings.

## Outputs

Typed paths, related elements, common connections, unresolved and cap evidence.

## Functional decomposition candidates

- Resolve selected seed element identities
- Read explicit typed relationships from the canonical model
- Apply direction, relation filters, hop bounds and cycle safety
- For multiple seeds calculate shared neighbors or path intersections
- Return paths, limits and unresolved endpoint evidence

## Function boundary

A multi-seed common connection is not simply the union of every seed's neighbors. Never infer an unrecorded link.

## Use cases depending on this function

- [[UC-00003 - Explore Element Relationships]]
- [[UC-00004 - Review Requirements for a Design]]
- [[UC-00005 - Explore Complete Product Context]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00010 - Visualize Relationships by Viewpoint]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00012 - Explore Multiple Relationship Hops]]
- [[UC-00013 - Compare Shared Connections Across Elements]]

## Candidate verification outcome

Controlled 1/2-hop traversal works; multi-seed intersection excludes non-common neighbors; capped/missing edges are disclosed.

## Existing implementation evidence — not certification

Partial: tools/workbench/src/index.ts, views.ts and workbench.test.ts; shared-connection intersection unverified.

## Proposed subfunctions

- Direct link resolution
- multi-hop traversal
- shared-connection intersection

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00004 {
    action def TraverseModelRelationships {
        doc /* Answer queries on typed model relationships for one or several elements, including direction, types, hop depth, paths and shared connections. */
    }
}
```
