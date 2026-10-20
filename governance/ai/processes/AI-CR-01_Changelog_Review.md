# AI Process: Changelog Review

Process ID: AI-CR-01
Ships into every vault as `99_System/02_AI/processes/AI-CR-01_Changelog_Review.md`.
Status: FIRST DRAFT, 2026-10-19
Applies to: any AI tool (Claude, ChatGPT, Rovo, Gemini, or other) reviewing the output of an import run before an engineer reads it.

## Purpose

An import can create many conflicts and changes. Most are typos, formatting, or differences with no engineering meaning. Engineers should spend their time on true engineering differences. This process has the AI sort the changes first, so the engineer reviews the important ones.

## Inputs

- The changelog note for one import run (one changelog per run).
- The files the changelog links.
- The Ruleset and schemas, as referenced in `99_System/02_AI/AI_INSTRUCTIONS.md`.
- The flags in the changed files (see Flag convention in the MDSE definition).

## Steps

1. Read the changelog. Do not assume any change is correct without checking the linked file.
2. For each change and each conflict, assign exactly one class:
   - **Editorial:** typo, spelling, capitalization, punctuation, whitespace, line order, or formatting, with the same meaning.
   - **Irrelevant:** a difference that does not change any engineering fact, such as wording, synonym, or a reference style change.
   - **Engineering:** a difference in a value, unit, quantity, revision, PartNumber, status, requirement text, relationship, usage, or anything else that could change how the product is built, tested, or understood.
3. When unsure, use **Engineering**.
4. Write one review summary note for this run, using the output format below.
5. Do not change any model file.

## Output format

Write one review summary note, named after the changelog it reviews, with this structure:

- Run date, changelog link, and counts per class.
- **Engineering** section first. For each item: the file link, the flag type, the source value, the existing value, and the question an engineer must answer. Do not propose a resolution.
- **Editorial** section. For each item: the file link, and the proposed fix (for example, "correct spelling of 'resistor'"). List these for batch approval only.
- **Irrelevant** section. For each item: the file link and the reason it has no engineering meaning.

## Rules

- Do not edit any file. This process only reports.
- Do not replace existing `## SysML v2` content, filled YAML values, or engineer-written body text.
- Do not resolve, remove, or change any flag. Flags are removed by the engineer after review.
- Do not delete notes. Do not create notes.
- Do not invent a source fact or an engineering explanation. If the cause of a difference is unknown, say so.
- Do not describe an Editorial or Irrelevant item as Engineering to be safe. Do not describe an Engineering item as Editorial to save time.
- Follow the rules in `99_System/02_AI/AI_INSTRUCTIONS.md`.

## Done when

- Every change and conflict in the changelog appears in the review note exactly once.
- Counts in the summary match the number of items listed.
- Every Engineering item links to its file and states the question for the engineer.
