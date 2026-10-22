---
type: Use Case
subtype: what
id: UC-00002
uid: 20261021181501001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00002::FindEngineeringElement
---
# Search for a Part, Function or Design

> [!note] Draft use case for Engineering Knowledge Base
> The user action comes from the owner. Process steps, actors and success outcomes are initial interpretations for review; not an approved software specification.

## Intent

Search for a part, function, or design.

## Primary actor

Organization user; engineer

## Trigger

User needs information about a concept, product, or part.

## Main scenario (proposed)

Query by name, identifier, or descriptive text; examine candidates; distinguish similar names; open selected element.

## Successful outcome

A relevant, identifiable model element is opened or the absence of a match is made clear.

## Alternative and review concern

Missing or ambiguous matches are reported, not guessed.

## Candidate logical functions

Index/search engineering concepts; resolve identities; navigate notes.

## Traceability

- Stakeholder need: [[STK-00013 - Engineering Knowledge Base]]
- Engineering requirements: not yet derived
- Test case and executed evidence: not yet established
- Formal SysML link to stakeholder need: pending independent parser validation

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00002 {
    use case def FindEngineeringElement {
        doc /* Search for a part, function, or design. */
    }
}
```
