# Markdown Systems Engineering (MDSE)

Status: baseline candidate, 2026-10-19. Owner: Spencer. Rules that implement this definition are in [RULESET.md](RULESET.md); plans and dates are in [ROADMAP.md](ROADMAP.md).

## Purpose

Engineers need product knowledge that is easy to find and easy to trust. Today it sits in two places, and each falls short:

- **Documents** hold large amounts of information, but finding a topic means reading across many files, and the knowledge for one topic is spread thin.
- **MBSE tools** bring relevant knowledge into one linked model, but their learning curve keeps many people from using them.

MDSE combines the two. It is a single, linked engineering model stored as plain Markdown and YAML in an Obsidian vault, with SysML v2 text as the authoritative definition of structure and relationships. The files are readable and editable without any tool. The tools are importers and views over those files. The model must be easy to read and query for people and for AI agents, including Atlassian Rovo.

## Scope and phases

| Phase | Scope | Gate |
|---|---|---|
| **P1** | Import of the real EA SysML v1 model (`.qeax`) into notes with SysML v2 text; Base Vault and Bootstrap; read-only Workbench | Real EA data imported and viewed in the Workbench |
| **P2** | Import of multiple product BOMs (Excel) into the existing vault, additively | Every BOM row dispositioned; only approved changes to existing content |
| **Golden import** | The vault accepted as the baseline once P2 is complete. From here every change to an engineering vault is made on an ECO branch | The golden definition (open, REG-264) |
| **P3** | Workbench editing | Edits saved, valid, and surviving re-import |
| Later | Third-party documentation output (data tables, requirements lists, block diagrams); validation once editing is stable; GSE charger BOMs; EA diagrams; cross-vault | Not scheduled |

Phase 1 delivers one vault (GOV-017).

## Inputs

1. **EA SysML v1 model** (`.qeax`), translated into SysML v2 text and notes. (P1)
2. **Product BOMs** (Excel). Each row identifies a part by **PartNumber (PN)**. One PN is one part definition; usage varies by assembly. (P2)
3. **Rules:** [RULESET.md](RULESET.md) and [schemas/](schemas/README.md) define how each source becomes a note, its YAML, its body and its `## SysML v2` section.

## Outputs

1. **One Obsidian vault.** Each note follows its class template and holds YAML properties, body text, and a final `## SysML v2` section.
2. **Workbench.** P1 read-only: navigate topics, view notes, view SysML v2 structure, create views. P3: edit.
3. **Third-party documentation** (Later), generated from the vault for external readers.

## Principles

- **Real data first.** Each phase is proven on real system data. Synthetic tests support development but do not satisfy a gate.
- **SysML defines it, SysML holds it.** Anything SysML v2 can define lives only in the `## SysML v2` block. Everything else lives in YAML. Nothing is stored twice (D-0003).
- **Relationships are the model.** An element with no relationships is a review item, not silently dropped.
- **No silent loss.** Every source row has a recorded disposition.
- **Traceable.** Source identifiers are kept for provenance.
- **Additions are automatic; changes need approval.** An import adds new content freely. It changes existing content only with pre-approval or review approval. This applies to every field, including EA-owned fields.
- **Engineer edits are preserved.** A re-import never overwrites a person's change unless that change was approved.
- **Conflicts are reviewed, not guessed.** An import never resolves a conflict.
- **Issues are kept.** Evidence from real-data runs that found issues is kept privately for reference.
- **Meaning lives in the rules and schemas.** Tools may not change model semantics.
- **Files first.** The vault is usable without the tools.
- **Repeatable.** Importing the same input twice produces no changes.
- **Changes are traceable.** After the golden import every change to an engineering vault is made on an ECO branch, approved in Jira and merged into `main` by an approver. A note is changed by one open ECO at a time (GOV-025 to GOV-031, D-0110, D-0111).
- **One AI instruction per process.** Every AI process has a written instruction file with an ID.

## Definitions

- **Vault:** the Obsidian folder that holds the model.
- **Note:** one Markdown file for one model element.
- **UID:** the permanent identifier of a note, independent of filename and folder.
- **Part definition:** the note for one PartNumber. One PN, one definition.
- **Usage:** a use of a definition within an owning context, declared in the owner's SysML block, not in the definition.
- **Author code:** a 13-character code generated from an author's name by one fixed rule.
- **Ruleset:** [RULESET.md](RULESET.md), the only set of governing rules.
- **Importer:** the single-file HTML tool that turns source files into a vault. It is mechanical: it applies the ruleset and does not interpret.
- **Changelog:** one dated record per import run, listing every change to existing files, with links.
- **Conflict:** source content that contradicts existing content and is listed in the body for engineer review.
- **Pre-approval:** approval given in the importer's Start step by selecting a field; applies to all notes in that run.
- **Review:** the engineer's pass after an import, approving a listed change or selecting the correct data.
- **Golden import:** the accepted vault baseline that follows Phase 2. Its definition is open (REG-264).
- **ECO branch:** a branch of an engineering vault's repository that holds one engineering change order. It is merged into `main` by an approver.
- **Change note:** an `Info` note of subtype `change`: the record of one ECO, with its Jira key, Jira link and branch. `Info` also has the subtypes `decision`, `goal` and `task`.
- **Approver:** a person who may merge an ECO branch into `main`.
- **Flag:** a typed Obsidian callout marking an issue (see Flag convention).
- **Base Vault:** the preconfigured vault released to users.
- **Bootstrap:** the plugin that verifies the release, activates plugins and registers the author.
- **Workbench:** the engineer-facing interface for navigating, and later editing, the model.
- **Canvas:** a presentation view only. It never defines model meaning.

## Flag convention

```
> [!flagImport] Short description
> Source: [changelog link]. Detail for the engineer.
```

- Types: `flagImport` (import issue), `flagConflict` (conflict for review), `flagLink` (unresolved link or relationship), `flagNote` (engineer or AI note for review). New types are added to RULESET.md before use.
- The importer and AI processes add flags. Only an engineer removes a flag, after the issue is resolved.

## Merge rules

Apply to every import into an existing vault (EA re-import and BOM import). Rules in RULESET.md, section IMP, "Merge, rerun and conflicts", and section BOM.

1. **Identity:** a note is matched by UID (EA) or PartNumber (BOM), never by path.
2. **Revision:** a part definition lists the latest revision. Which revision of a child an assembly uses is on the assembly's own usage; the child note names no assembly (D-0063).
3. **New element:** creates a new note.
4. **Matching content:** no change.
5. **Empty fields:** template fields are always present; a non-template field with no source data is not written.
6. **Addition (automatic):** an empty YAML property may be filled; non-matching content is added to the body.
7. **Change (approval only):** changing any existing value needs pre-approval (Start step, whole run) or review approval. Both are recorded in the changelog with old and new values.
8. **SysML v2:** existing `## SysML v2` content changes only by an approved change.
9. **Conflict:** unapproved contradicting content is not applied; it is listed in the body with `flagConflict`.
10. **Mismatched child revision:** the parent is flagged with `flagConflict`; the child body lists the usage.
11. **Missing source record:** reported with `flagImport`; never deleted.
12. **Changelog:** exactly one dated changelog per run, linking each changed file.
13. **Engineer edits:** not changed unless approved.
14. **Repeat import:** the same input again produces no changes and no changelog.

## AI processes

| ID | Process | Instruction file |
|---|---|---|
| AI-CR-01 | Changelog review: sort changes into Engineering, Editorial, Irrelevant before an engineer reads them | [ai/processes/AI-CR-01_Changelog_Review.md](ai/processes/AI-CR-01_Changelog_Review.md) |

## User scenario

1. **Receive vault link.** Check the link location.
2. **Open vault.** If new: trust the author, enter your name once. If updated: read any messages and continue.
3. **Enter vault.** After an update the vault opens on the latest changelog; otherwise on the last file viewed.
4. **Open Workbench.** Navigate to a topic, view a note or canvas, or create a view. P3 adds editing.

## Constraints

- The importer runs offline in a browser from one HTML file. No installs for users.
- Real engineering data is never stored in this repository. Real-data runs happen privately.
- Windows and macOS.
- Offline use.

## Open decisions

See [OPEN_DECISIONS.md](OPEN_DECISIONS.md).
