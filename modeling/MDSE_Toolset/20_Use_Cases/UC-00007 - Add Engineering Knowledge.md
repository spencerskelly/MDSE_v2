---
type: Use Case
subtype: what
id: UC-00007
uid: 20261021181501006skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00007::AddEngineeringKnowledge
---
# Add Engineering Knowledge

> [!note] Draft use case for Engineering Knowledge Base
> The user action comes from the owner. Process steps, actors and success outcomes are initial interpretations for review; not an approved software specification.

## Intent

Document additions to engineering knowledge from different vantage points.

## Primary actor

Engineer; authorized contributor

## Trigger

Relevant new knowledge is not yet modeled.

## Main scenario (proposed)

Choose context; select conceptual kind; check for reusable definition; add information and provenance; connect explicit relationships; submit/save.

## Successful outcome

Knowledge is added at suitable model scope without unnecessary duplicate concepts.

## Alternative and review concern

Unsupported classification or link is flagged rather than guessed.

## Candidate logical functions

Create elements; reuse definitions; add contextual relationships; record provenance.

## Traceability

- Stakeholder need: [[STK-00013 - Engineering Knowledge Base]]
- Engineering requirements: not yet derived
- Test case and executed evidence: not yet established
- Formal SysML link to stakeholder need: pending independent parser validation

## Proposed functional coverage

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00007 {
    use case def AddEngineeringKnowledge {
        doc /* Document additions to engineering knowledge from different vantage points. */
    }
}
```
