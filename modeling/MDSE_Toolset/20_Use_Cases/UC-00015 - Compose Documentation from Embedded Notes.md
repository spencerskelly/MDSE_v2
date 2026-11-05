---
type: Use Case
subtype: what
id: UC-00015
uid: 20261021181502006skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00015::ComposeDocumentWithEmbeds
---
# Compose Documentation from Embedded Notes

> [!note] Engineering Knowledge Base use case — proposed
> Capability requested by the owner on 2026-10-21. Detailed scenario and implementation coverage are review candidates, not approved requirements.

## Intent

Assemble a new document or presentation concept by transcluding existing model notes or sections using Obsidian embedded links such as ![[xxx]].

## Primary actor

Engineer, presenter, system architect or technical writer

## Main success scenario

1. Create or open a documentation/presentation note.
2. Select reusable existing notes or sections and insert Obsidian transclusions (e.g. ![[Part Definition]]).
3. Add explanatory text, ordering and audience-specific context without duplicating underlying model authority.
4. Preview or export the assembled content, preserving links and meaningful provenance.

## Expected outcome

One maintainable composition of information reused from existing model notes.

## Alternate / constraint

Prevent/flag cyclic embeds and missing references; embeddings are presentation reuse, not native SysML part ownership, dependency or new semantic definitions.

## Candidate logical functions

Find embeddable notes; insert transclusions; resolve embeds and cycles; compose/export documentation.

## Current evidence and gap

Obsidian embeds are native Markdown behavior; end-to-end MDSE-controlled composition and export behavior not verified.

## Proposed trace

- Stakeholder capability: [[STK-00013 - Engineering Knowledge Base]]
- Related use cases: [[UC-00006 - View and Export Engineering Information]]
- Functions, derived requirements and verification: pending review.
- Relationship links are draft navigation; not independently SysML-parser-certified.

## Proposed functional coverage

- [[BEH-00003 - Discover and Resolve Model Elements]]
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft SysML definition; this model's native syntax and relationships have not been independently parser-verified.

```sysml
package MDSE_UC_00015 {
    use case def ComposeDocumentWithEmbeds {
        doc /* Assemble a new document or presentation concept by transcluding existing model notes or sections using Obsidian embedded links such as ![[xxx]]. */
    }
}
```
