---
type: Behavior
subtype: function
id: BEH-00003
uid: 20261021195900002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00003::DiscoverModelElements
---
# Discover and Resolve Model Elements

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Find the note owning an engineering name, alias or ID, and perform scoped search of SysML text, YAML properties, source metadata and notes.

## Inputs

Search term or field/value criteria; model notes and their derived index.

## Outputs

Matching owning notes, snippets, exact identity or stated ambiguity.

## Functional decomposition candidates

- Resolve note titles, aliases and IDs with disambiguation
- Search SysML, properties and body within explicit scopes
- Return matching note identity and matched source context
- Expose no-match and ambiguous-match results

## Function boundary

A literal SysML text match is not SysML semantic interpretation; search indexes are disposable.

## Use cases depending on this function

- [[UC-00002 - Search for a Part, Function or Design]]
- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00014 - Search SysML Syntax and Model Properties]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]
- [[UC-00016 - Display Flagged Model Data]]

## Candidate verification outcome

A known alias resolves to its owning note; a property search returns the owning element; ambiguous names are distinguishable.

## Existing implementation evidence — not certification

Partial: tools/workbench/src/index.ts and search/views; alias-first and scoped SysML search acceptance not verified.

## Proposed subfunctions

- Name and alias resolution
- field-scoped search

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00003 {
    action def DiscoverModelElements {
        doc /* Find the note owning an engineering name, alias or ID, and perform scoped search of SysML text, YAML properties, source metadata and notes. */
    }
}
```
