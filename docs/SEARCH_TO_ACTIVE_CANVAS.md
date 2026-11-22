# Workbench global search → active Canvas

**Status:** Review-branch UI change; requires build/CI and real Obsidian acceptance before release.

## User goal

While working in the persistent Workbench panel or pop-out, search for governed engineering notes and add one or more matches to the Canvas already open in an Obsidian editor tab, without losing the search workflow or opening a new Canvas.

## Interaction

1. Type in the global **Search engineering information** field. Existing ranked name/alias/ID/part-number/text search is reused. The search stays in the Workbench.
2. Each result has a **checkbox**, a **note title** (opens the note in a separate editor tab) and **+ Canvas** (adds only that note to the active Canvas). Clicking the title does not add a card; clicking + Canvas does not create or open a note.
3. **Select shown**, **Clear selection**, a selected count and **Add N selected to Canvas** support bulk addition. Selections persist while the search terms change, but additions always resolve the currently indexed notes.
4. Both the global Search field and the **Pick notes** lens use explicit **Add to current Canvas** controls. **New canvas** in Pick notes remains a separate operation; an addition must not replace the existing editor artifact.
5. The search names the target Canvas. When no Canvas is available, addition controls are disabled and the search instructs the user to open a Canvas tab. Search must never silently create a new Canvas.
6. Adding calls the existing Canvas placement/refresh path. It does not duplicate existing cards, move any existing card, or invent relationships. It draws only relationships already present in the governed index.
7. The active Canvas may be a scratch preview or a saved Canvas. The user explicitly invokes the action; saving a modified saved Canvas follows Obsidian's normal Canvas behavior.
8. Notes and Canvases are independent editor tabs. Workflow switching and the search UI remain inside the same Workbench panel/pop-out.

## Acceptance matrix — execute in staging Obsidian

| Test | Required result |
|---|---|
| A1. One matching result; click **+ Canvas** | Exactly one card added to the open Canvas; search still available in Workbench |
| A2. Tick three results then **Add 3 selected** | Three unique new cards placed on the existing Canvas in one operation |
| A3. Select some results, change the query, select more | Previous selections retained; all selected governed notes added together |
| A4. Click note title | Only the note opens/focuses as an editor tab; nothing added |
| A5. No Canvas open | **+ Canvas** and bulk addition disabled; no new Canvas silently created |
| A6. Target Canvas already contains a selected note | No duplicate card, no existing card moved |
| A7. Target saved Canvas includes custom positions/hand-drawn lines | Existing locations and user-authored edges preserved |
| A8. Two searched notes share words but no model relationship | Cards added without a new SysML edge |
| A9. Two searched notes have a native SysML relationship | Existing relationship may appear as a Canvas edge; underlying SysML remains unchanged |
| A10. Multiple Canvas tabs | Last active open Canvas is named in the search and receives added cards |
| A11. Long/narrow sidebar and keyboard input | Search, checkbox, individual + and bulk buttons remain accessible |
| A12. Repeat addition and run Canvas refresh | Stable card identities; no duplicates or fictitious edges |
| A13. Pick notes → tick two → Add selected to current Canvas | Existing Canvas receives two cards; no new Canvas created |
| A14. Pick notes → New canvas | Creates a distinct Canvas tab rather than altering the selected existing Canvas |
| A15. Canvas changes during an asynchronous addition | Operation refuses to redirect silently to the newly active Canvas |
| A16. Rebuild toolset and deploy in staging | Plugin main.js and manifest, standalone Workbench, bundled importer, plugin lock and installed runtime all match the same version/commit |

## Implementation boundary

This is a Workbench UI change, not a new search database. It reuses `V.search`, `host.addToCanvas`, `plugin.canvasTarget`, `WB.addToCanvas` and `WB.refreshCanvas`. The Canvas is a visualization only. The authoritative model remains each governed note's `## SysML v2` block.

**Verification state:** Routing and target-pinning regression tests have been added. Workbench build, CI and loaded Obsidian acceptance remain required. No merged/deployed release is implied. These are release gates, not implied by source changes.
