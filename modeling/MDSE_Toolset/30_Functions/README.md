# Engineering Knowledge Base — functional architecture (draft)

These are **logical functions**, not one software service or plugin per function. They are derived from [[STK-00013 - Engineering Knowledge Base]] and its 16 use cases. The model and all relationship declarations remain draft.

## Reusable function definitions

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]] — Import external source data and evidence into MDSE using appropriate adapters, source identity, managed files, approved reconciliation, and recorded dispositions.
- [[BEH-00003 - Discover and Resolve Model Elements]] — Find the note owning an engineering name, alias or ID, and perform scoped search of SysML text, YAML properties, source metadata and notes.
- [[BEH-00004 - Query and Traverse Model Relationships]] — Answer queries on typed model relationships for one or several elements, including direction, types, hop depth, paths and shared connections.
- [[BEH-00005 - Generate Engineering Model Viewpoints]] — Create visual, table, document and review projections of selected model content using the same underlying model relationships.
- [[BEH-00006 - Compose and Exchange Engineering Knowledge]] — Assemble existing notes and sections into documents or presentations with native Obsidian ![[...]] transclusion and produce governed exports.
- [[BEH-00007 - Maintain and Improve Model Knowledge]] — Create and correct engineering knowledge, review flags and conflicting changes, and preserve identity, approval, provenance and model integrity.

The earlier [[BEH-00001 - Reconcile Source Records]] remains a separate existing function note; its candidate parent is BEH-00002. We have **not** altered its ID.

## Use-case to function coverage

The [function/use-case matrix](FUNCTION_USECASE_MATRIX.csv) contains **34 proposed links** covering all 16 use cases, with multiple functions per use case where appropriate.

- UC-00001: [[BEH-00002 - Ingest and Reconcile Engineering Sources]], [[BEH-00007 - Maintain and Improve Model Knowledge]]
- UC-00002: [[BEH-00003 - Discover and Resolve Model Elements]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00007: [[BEH-00003 - Discover and Resolve Model Elements]], [[BEH-00007 - Maintain and Improve Model Knowledge]]
- UC-00014: [[BEH-00003 - Discover and Resolve Model Elements]]
- UC-00015: [[BEH-00003 - Discover and Resolve Model Elements]], [[BEH-00006 - Compose and Exchange Engineering Knowledge]]
- UC-00016: [[BEH-00003 - Discover and Resolve Model Elements]], [[BEH-00005 - Generate Engineering Model Viewpoints]], [[BEH-00007 - Maintain and Improve Model Knowledge]]
- UC-00003: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00004: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00005: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00008: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00007 - Maintain and Improve Model Knowledge]]
- UC-00009: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]], [[BEH-00007 - Maintain and Improve Model Knowledge]]
- UC-00010: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00011: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]], [[BEH-00006 - Compose and Exchange Engineering Knowledge]]
- UC-00012: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00013: [[BEH-00004 - Query and Traverse Model Relationships]], [[BEH-00005 - Generate Engineering Model Viewpoints]]
- UC-00006: [[BEH-00005 - Generate Engineering Model Viewpoints]], [[BEH-00006 - Compose and Exchange Engineering Knowledge]]

## Functional boundaries

- Source import (BEH-00002) and manual authoring/review (BEH-00007) both write model content but share identity and approval contracts.
- Discovery (BEH-00003) locates notes, properties and SysML text; traversal (BEH-00004) uses *semantic typed relationships*.
- Graph traversal (BEH-00004) owns hop/intersection semantics; viewpoint rendering (BEH-00005) does not independently reinterpret edges.
- Composition (BEH-00006) reuses model content through `![[...]]`; it does not create new part/behavior containment.
- Changes and flag review (BEH-00007) are distinct from read-only flagged-data presentation (BEH-00005).

## Existing implementation references — not allocations

| Function | Candidate relevant code | Verification state |
|---|---|---|
| BEH-00002 | `tools/importer/src/run.ts`, `bom.ts`, `merge.ts` | Synthetic tests exist; heterogeneous documents/images unverified |
| BEH-00003 | `tools/workbench/src/index.ts` | Alias-first and field-scoped search unverified |
| BEH-00004 | `tools/workbench/src/index.ts`, `views.ts` | Shared-connection intersections unverified |
| BEH-00005 | `tools/workbench/src/views.ts`, `canvas.ts` | General document perspectives unverified |
| BEH-00006 | Native Obsidian embeds; Workbench export | Composition workflow unverified |
| BEH-00007 | `tools/workbench/src/edit.ts`, `tools/importer/src/merge.ts` | Merge semantics still conflicting across core/importer |

## Next review

Approve the functional boundaries and missing subfunctions. Then derive testable requirements, map existing governance rules as their authoritative origin, assign component responsibilities, and create verification cases. Formal relations must be expressed in native SysML and accepted by the pinned parser. The CSV and Markdown links are provisional review views only.
