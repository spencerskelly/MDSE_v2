# Context-scoped Workbench workflows

**Status:** Implementation candidate, toolset 0.11.2 / Workbench 0.10.2. Automated regression is not Obsidian runtime acceptance.

## Decision

The Document / Define / Structure / Verify Workbench operates around the engineer's selected governed element, its explicit native SysML relationships, and the specific related records selected for investigation. There is no workflow-wide **All elements in vault**, **All notes**, **all functions**, **all requirements**, or unfiltered global parts registry mode.

**Unrelated element policy:** When an engineer knows that a note exists but no relationship connects it to the current context, use the model-aware global Search or Pick notes, explicitly choose one or more results and add the notes to the named open Canvas. The notes may remain unconnected. Canvas membership, visual proximity, shared words, and discovered names do **not** create a native SysML link or imply a semantic model relationship.

## Workbench behavior

- **Function / Define:** show only functions with a supported relation to the selected element.
- **Requirements / Verify:** show only requirements with a supported relation to the selected element.
- **Tables / any work area:** Relationships lists only relationships incident on the selected note. Usages lists only usages owned in that note. The former All notes table is not available in workflows.
- **Structure:** show the selected assembly's structure, BOM, and where-used; do not append a registry of every unrelated part in the vault. "Full tree" means all reachable descendants of the selected assembly. "All, including proposed and obsolete" is a *lifecycle* filter for related BOM parts, not a permission to list the vault.
- **No selected model note:** show an empty contextual view with a prompt to select or search. Never fall back to enumerating all indexed notes.
- **Discover all relationship kinds:** allowed only for traversing connected neighbors of the selected source; the **All relationships** discovery option means all types of explicit relationships, not all notes.

The model index may still enumerate the vault internally for Search, identity resolution, diagnostics, and review. This decision restricts *workflow projection scope* and does not disable global search, parser review, registry validation, or bulk data operations outside the workflow.

## Acceptance contract

| ID | Test | Expected |
|---|---|---|
| CTX-01 | Open Function/Requirements/Tables work areas | No "everything in the vault" scope radio or "All notes" dropdown choice |
| CTX-02 | Open Function on a selected note with known relations | Only related functions appear |
| CTX-03 | Open Requirements on a selected note with known relations | Only related requirements appear |
| CTX-04 | Open Tables/Relationships with a selected note | Every row originates from or ends at that note |
| CTX-05 | Open Tables/Usages | Only owner-local usages of the selected note appear |
| CTX-06 | Open Structure | No global parts registry, only selected-element structure and where-used |
| CTX-07 | Select no valid modeled element, then open the above views | No vault-wide results; visible request to select an element |
| CTX-08 | Search for an unrelated note; add one and then multiple to saved Canvas | Requested cards added, no automatic semantic links, no replacement Canvas |
| CTX-09 | Change Canvas tab during search-to-Canvas addition | Existing target guard prevents the wrong Canvas receiving cards |
| CTX-10 | Legacy programmatic `scope:"all"` or `table:"notes"` parameter | Cannot reopen a vault-wide workflow projection |
| CTX-11 | Choose all relationship kinds for selected source's connected-neighbor Canvas | Only reachable neighbors, not the entire vault |
| CTX-12 | Review global diagnostic queue | Remains an explicit administrative report; never becomes a workflow scope option |

## Source and evidence

- `tools/workbench/src/panel.ts`: UI and workflow state
- `tools/workbench/src/views.ts`: contextual data projection
- `tools/workbench/test/workbench.test.ts`, `navigation_shell.test.ts`: automated source/projection tests
- `docs/SEARCH_TO_ACTIVE_CANVAS.md`: existing deliberate unrelated-note placement controls

**Authority:** Canonical modeled engineering definitions and native relationships live in notes' SysML v2 source. This workflow policy changes only the Workbench's presentation and navigation, not model content.
