# MDSE AI Instructions

Status: updated 2026-10-19 for D-0003, D-0009 and D-0010; owner review requested. Ships into every vault as `99_System/02_AI/AI_INSTRUCTIONS.md`.

For every AI tool that creates, edits or reviews notes in an MDSE vault (Claude, ChatGPT, Rovo, Gemini or any other). AI tools cannot run Templater, so you do by hand exactly what the template snippets do. The result must look the same as a note created from a template.

## AI processes

Each AI process has an instruction file and an ID. Use the file for that process; do not write unique instructions for a run.

| ID | Process | Instruction file |
|---|---|---|
| AI-CR-01 | Changelog review: sort changes into Engineering, Editorial, Irrelevant before an engineer reads them | `99_System/02_AI/processes/AI-CR-01_Changelog_Review.md` |

Before substantial work, read `99_System/03_Schemas/element-types.yaml`, `99_System/03_Schemas/relationships.yaml`, `99_System/03_Schemas/authors.yaml` (AI codes and the default time zone) and the person notes in `99_System/04_People` (each person's author code and time zone).

## Where things go in a note

- **Look the construct up first.** `99_System/04_Language/` has one note per SysML v2 construct: what it is, what it can connect from and to, and how it differs from the most similar one. Start at `SysML v2 Language.md`; the Everyday set covers most modelling. Do not use a construct that is not in those notes.
- **Anything SysML v2 can define** (structure, parts, ports, connections, specialization, satisfy, verify, derive, allocate, and other SysML relationships) goes only in the note's `## SysML v2` block. Never copy it into YAML.
- **Everything else** (class, identity, status, tags, provenance, MDSE-only links such as `describes`, `references`, `affects`) goes in YAML frontmatter, as defined in `relationships.yaml`.
- `## SysML v2` is always the last section and holds exactly one fenced `sysml` block. Do not edit it by hand unless you can run the parser check; otherwise leave a `flagNote` describing the change you propose.

## Creating a note

1. **Classify first.** Choose the class, then copy the matching template from `99_System/05_Templates`. Keep its properties, their order (`type`, `subtype`, `id`, `uid`, `status`, `tags`) and its headings exactly. Do not add properties except governed optional properties in `element-types.yaml` and fields in `relationships.yaml`. If no class fits, ask the user.
2. **Fill in `uid`** yourself. It is 30 characters, no spaces: `yyyyMMddHHmmssSSS` followed by a 13-character author code.
   - **Time:** local time now, to the millisecond, not UTC. Use the `timezone` in the directing person's note in `99_System/04_People` if it has one; otherwise `defaultTimezone` in `authors.yaml`.
   - **Author code, if a user directed the note:** that user's `code` from their person note, even if you wrote every word. If you do not know who the user is, ask. Notes carrying a person's `previousCodes` are also theirs.
   - **Author code, if you created the note on your own:** your code from `ai_authors` in `authors.yaml`. If your tool is not listed, add it: tool name (lowercase letters, at most 11), then `ai`, then hyphens to 13 characters.
   - **If that 30-character token is already used,** add one millisecond until it is unique in the vault.
3. **Fill in `id`** yourself: the class prefix, a hyphen and a five-digit number. Standard requirements use `STD`, stakeholder requirements `STK`, other requirements `REQ`. Find the highest number used for that prefix across every note in the vault, including retired notes and ids listed under `## Former ids`, then add one. Never reuse a number. External designators (for example a standard's clause number) never go in `id`.
4. **Check before saving:** `uid` matches `^\d{17}[a-z-]{13}$`; `id` matches `^[A-Z]+-\d{5}$`.

```
id: REQ-00042
uid: 20260928101530123skellyspencer   (a user directed the note)
uid: 20260928101530123claudeai-----   (Claude created it on its own)
```

## Status and review

- Leave `status` at the template default. Never advance it or mark your own note reviewed or approved.
- Never delete a note. To remove one, set `status` to Retired. The `id` stays reserved.

## Flags

- Mark issues with a flag callout: `> [!flagNote] Short description`, then detail lines. Types: `flagImport`, `flagConflict`, `flagLink`, `flagNote`.
- You may add flags. Never remove one; only an engineer removes a flag.
- A link whose relationship you cannot determine is a `flagLink`, not a guessed relationship.

## Do not

- Edit generated release files: `.obsidian/plugin-lock.yaml`, `.obsidian/community-plugins.json`, any plugin `data.json`, or `99_System/03_Schemas/`. Never add, update or remove plugins.
- Treat `99_System/22_Views/` (temporary Workbench views) or `99_System/23_Saved_Views/` (saved canvases) as model content, cite them as sources, or edit them. They are pictures of the model.
- Change an existing note's `uid` or `id`.
- Stamp `uid` or `id` on material brought in from outside (standards, external documents).
- Add an EA GUID to a new note. It appears only in `## Source: EA` of translated notes.
- Invent missing source facts.
- Duplicate an existing concept. Reuse and link to it.
- Create or split vaults. You may flag when scale suggests a split.
- Infer a relationship from folder placement or Canvas layout. Both are presentation only.
