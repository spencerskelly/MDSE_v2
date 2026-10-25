/* The Guide tab: short, task-first guidance for the engineer who opens a vault after an import. Bundled text, no lookup.
 * Kept to what this Workbench does; the V1 guide's Local Model and occurrence sections do not apply to V2. */
export interface GuideSection { title: string; body: string[] }

export const GUIDE: GuideSection[] = [
  { title: "What this is", body: [
    "The Workbench reads the notes in the vault and shows them as tables, traces and graphs. The notes stay the model: the SysML v2 block at the end of a note is authoritative, and nothing here is a second copy.",
    "Everything on screen is rebuilt from the files each time. Deleting a view loses nothing." ] },
  { title: "Which view answers which question", body: [
    "Dashboard: how big is the vault, and how much is flagged. Click a bar to jump to the matching list.",
    "Notes: find a note by type, status, folder or text. Note: one note with its flags, relationships and SysML.",
    "Structure: the part tree with ports, and a rolled-up parts list. Where used: who owns, specializes or performs this note.",
    "Traceability: each requirement against what satisfies, verifies and derives it; gaps are marked. Behavior: actions and states as a flow.",
    "Interfaces: ports, interface definitions and what flows. Graph: a radial picture around one note. Relationships: every link, filterable by kind.",
    "Review: everything the import or the model needs a person to decide.",
    "Pick notes: type a word or phrase, tick the notes you want from the list (name or description holds it), then Place on canvas. The ticked notes become a canvas preview, in one labelled box for each note type (untick “group by type” for a plain grid), with the relationships between them drawn if you leave that ticked. Save canvas… keeps it.",
    "The panel has three menus: Note (ways to see the selected note, and Edit), Model (Dashboard, Tables, Review) and Canvas (Pick notes, Common related). Choose two or more note cards on a canvas and Common related lists the notes related to all of them.",
    "On a canvas, choosing a note card makes this panel show that note. In the Note tab, Add related notes to the canvas puts one related note (+) or all of them beside the card. Notes already on the canvas stay where they are, and new notes that relate to each other are put next to each other. Place on canvas in Pick notes adds to the open canvas the same way; New canvas starts a fresh one." ] },
  { title: "Working through an import", body: [
    "1. Open Review. Start with high severity (format problems, duplicate ids), then flags, then provisional links.",
    "2. Flags are callouts in the notes. A flagLink is a relationship or element the importer did not write; the callout says why and names the EA GUID. Decide it, fix the SysML or the link, then use Resolve to remove that one flag.",
    "3. Elements the importer could not place in any note are on the note \"Unplaced Review Items\", one flag each. Connectors with no note at either end are there too.",
    "4. provisional-link rows are tracesTo links. tracesTo means related, relationship not chosen. Replace each with a stronger one (satisfies, refines, derives, allocates) in the Edit view, or leave it if related is all that is known.",
    "5. unresolved-reference rows are SysML statements that point at a note that is not in the vault. sysml-not-recognized rows are lines the Workbench scanner could not read; the parser gate, not this tool, decides conformance.",
    "6. The importer also writes Review - Deferred Elements.csv and Review - Deferred Links.csv under 99_System/11_Import. They list the same items for sorting in a spreadsheet.",
    "Use the category buttons and the severity list to narrow the queue, and Export CSV to take the filtered list elsewhere." ] },
  { title: "Editing", body: [
    "Edits are few, previewed and undoable. The Relationships tab edits the selected note's SysML relationships; Review sets an Issue status and resolves one flag. The ? buttons explain each option.",
    "The Workbench never renames or deletes a model note." ] },
  { title: "What not to do", body: [
    "Do not edit the SysML block as free text unless you know the syntax; use the Edit view so the block stays consistent.",
    "Do not rename or move notes in the file system. Rename in Obsidian so links follow.",
    "Do not delete a flag by hand to make the queue shorter. Use Resolve, which removes that one flag and can be undone." ] },
  { title: "When something looks wrong", body: [
    "A note is missing from a view: check its type and status filters, then whether its folder is under 99_System (skipped).",
    "Numbers look stale: the index rebuilds a moment after a save; reload the vault in the page to force it.",
    "A block shows \"unchecked\": no parser report was found. That is the normal state until the parser gate has run." ] },
];
