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
    "Compare notes: Note menu > Compare notes (or Compare these two with two cards chosen on a canvas) lists what differs between two notes: properties, other members, relationships, and the structure down to the parts that differ. Parts are matched by note, then part number, then name, so two copies of an assembly line up.",
    "Merge: choose two notes, then Merge now (or tick Find matches and Merge ticked now). The BOM part stays and takes the other note's structure, behavior and requirements; the other note is retired, kept as a stub that only links to the note that stays, and shown red on a canvas. Refresh canvas re-reads the vault and updates the open canvas without moving anything.",
    "Direct parts only limits every Structure table to direct parts. Add all children to canvas (or tick some, then Add ticked) puts them in one row below the parent's card, joined bottom to top.",
    "Adding notes to a canvas puts them on the canvas open in the main window and moves nothing already there. Auto-layout (Canvas menu, or the button beside the add buttons) is what rearranges the note cards: assemblies over their parts, general over specialized, use cases left of requirements, functions and tests below requirements, objects below functions.",
    "Canvas of a view: on Structure, Canvas: direct parts puts the note, the assemblies it is in above it and its parts in a row below; Canvas: complete BOM adds every layer of parts. Lines run from the bottom of the assembly to the top of the part. The other views have Canvas of this view; the Note view has Canvas of this note and its related notes. Each makes a new canvas preview.",
    "Structure can show the full tree or only the direct parts. On Structure, Function, States, Requirements, Design types and Internal structure, tick rows and choose Add ticked to canvas, or Add all shown: parts land under the assembly, specialized elements under the general one, requirements under use cases, functions and test cases under requirements, objects under functions.",
    "Merge: Note menu > Merge notes, or the Merge with another note button on an Object note, or choose two Object cards on a canvas and use Merge these two in Common related. A BOM part is kept by default. Nothing changes until Preview and Apply, and a merge can be undone.",
    "The panel has a vertical toolbar on its right edge with one button per view, in groups: Navigate, Find, Trace, Create and edit, Review and Canvas. Find similar lists the notes that share a relationship with the selected note, such as the other assemblies that use the same part or the other parts of the same parent. Choose two or more note cards on a canvas and Common related lists the notes related to all of them.",
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
