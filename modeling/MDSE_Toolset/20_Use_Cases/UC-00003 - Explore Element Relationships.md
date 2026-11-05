---
type: Use Case
subtype: what
id: UC-00003
uid: 20261021181501002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00003::ExploreElementLinks
---
# Explore Element Relationships

> [!note] Draft use case for Engineering Knowledge Base
> The user action comes from the owner. Process steps, actors and success outcomes are initial interpretations for review; not an approved software specification.

## Intent

View how an element is linked to other elements.

## Primary actor

Organization user; engineer

## Trigger

User wants to understand an element's context.

## Main scenario (proposed)

Select element; show explicit typed incoming/outgoing links; navigate definitions, usages, owners, dependents; identify unresolved links.

## Successful outcome

Linked concepts and relationship types can be understood, with gaps visible.

## Alternative and review concern

Do not fabricate links; do not silently hide missing endpoints.

## Candidate logical functions

Resolve typed links; build relationship views; report dangling links.

## Traceability

- Stakeholder need: [[STK-00013 - Engineering Knowledge Base]]
- Engineering requirements: not yet derived
- Test case and executed evidence: not yet established
- Formal SysML link to stakeholder need: pending independent parser validation

## Relationship exploration refinements

- [[UC-00010 - Visualize Relationships by Viewpoint]] — selectable visual perspectives.
- [[UC-00011 - Display Linked Elements in Document Viewpoints]] — readable structured/document perspectives.
- [[UC-00012 - Explore Multiple Relationship Hops]] — user-selected relationship depth.
- [[UC-00013 - Compare Shared Connections Across Elements]] — common linked elements across two or more selections.

These are separate view/query capabilities over **one canonical model graph**, not distinct stores of semantic relationships. A filtered or capped view must disclose the filtering and cannot claim that omitted connections do not exist.

## Proposed functional coverage

- [[BEH-00004 - Query and Traverse Model Relationships]]
- [[BEH-00005 - Generate Engineering Model Viewpoints]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00003 {
    use case def ExploreElementLinks {
        doc /* View how an element is linked to other elements. */
    }
}
```
