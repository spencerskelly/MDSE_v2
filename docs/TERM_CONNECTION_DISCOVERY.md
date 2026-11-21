# Shared-Term Discovery → Canvas → Governed Relationship

**Status:** Working review-branch prototype; not a released feature. This document describes the intended workflow and its implemented first increment. The authoritative model remains SysML v2 text, not a keyword index, Canvas line or presumed similarity.

## Goal

Rapidly investigate imported legacy requirements, verification cases, parts, functions and documents without knowing their original names or links. Find a meaningful term, identify which **types** of governed elements contain it, review the actual source text, and collect candidate elements on a Canvas for manual engineering analysis.

**Important distinction:** shared words are **candidate evidence**, not a valid relationship. The user must choose a native SysML relationship with correct ownership/direction and approve its text diff separately.

## First increment — implemented

1. Open **Find → Find shared terms** in the Workbench. With the default navigation preference this opens an independent Workbench tab, preserving any note, editing form or Canvas already open.
2. The view builds a **disposable in-memory index** of governed note names, aliases, descriptions, Markdown bodies, SysML v2 text and identifiers/part numbers. It does not index the contents of ungoverned Markdown notes, PDFs, Word files, spreadsheets or attachments at this stage.
3. The view suggests common **content words appearing in at least two element types**, showing **unique note counts**, number of types and a type-count breakdown on hover. Generic English/structural stopwords are hidden from suggestions, but can still be searched explicitly.
4. Click a suggested word or enter one or more **complete terms**. Multiple words use AND within the same note, not fuzzy semantic matching. Results are grouped by type (Requirement, Verification, Object, etc.) with exact per-type counts and match-field/excerpt evidence. Select a type facet if needed.
5. Tick individual results, **Select displayed**, or **Clear selection**. Previously selected paths are retained across filters; the selected count is visible. Rows offer normal note navigation and the independent **↗ Workflow…** handoff.
6. Choose **New grouped Canvas** (preferred): makes a new scratch Canvas with candidate model notes organized by element type. Only existing governed model relationships are drawn between cards. **Add to current Canvas** is a separate explicit action and may change an open saved Canvas; it is not invoked merely by searching.
7. On the Canvas, investigate the candidates and use the existing governed relationship editor to choose legal relationship/direction, preview the native SysML diff, and Apply. No SysML link is created by term search, ticking a box, moving a card or saving a Canvas.

## Source and performance contract

- Source of index facts: the Workbench's currently loaded `ModelIndex.notes`; not an independent source of truth. On model-index replacement, derived term data is discarded and rebuilt.
- Build work is yielded every 200 notes to keep the Obsidian event loop responsive. Indexing is on demand (entering the shared-term lens), with no network service or duplicate persistent database.
- Tokens normalize Unicode case, preserve identifiers/hyphenated forms, and also index segments of hyphenated/underscored identifiers. Matching is exact-token, not substring.
- Each term is counted **once per note**, even when repeated many times in that note. Counts represent model notes, not raw occurrences or relationships.
- Query intersection uses inverted postings. On broad matches, candidate ranking and excerpts are capped **per element type**; exact type totals are retained without materializing all excerpts.
- The visible output may include historical or contradictory content. It reports **where** text matched; it does not assert that two elements represent the same concept or satisfy/verify each other.
- Safe default is a new Canvas tab, preserving ongoing work. Import and read-only discovery must not modify requirements or test results.

## Acceptance checks (staging vault)

| Check | Expected |
|---|---|
| Cross-type search | `cooling` lists matching Requirements, Verification and Objects under separate type headings with exact counts |
| Evidence | Each hit shows what matched (name/alias/description/body/SysML/identity) plus a short excerpt |
| Search precision | `battery cooling` requires both terms in the same note; `cool` does not match `cooling`; identifiers such as `CANH`, `5913495D` and `REQ-00123` are searchable |
| Shared-word frequency | A repeated word counts one occurrence per note, with distinct type counts; common boilerplate words are not suggested |
| Type selection | Choosing Verification limits the results to that type without clearing manually selected notes |
| Search scale | Broad queries retain exact per-type totals and show limited result pages; building the index yields to the UI |
| Canvas safety | Ticking, new grouped Canvas and Save do not create new model definitions or SysML relationships; existing links alone produce lines |
| Workspace safety | Opening the tool, results, or a new Canvas does not replace an already-open engineering editor |
| Connection approval | Engineering relationship remains a separate native SysML preview/Apply; wrong-direction or unsupported relationships are never inferred from text |

## Boundaries and next increments

The first increment is **literal word discovery** over governed model notes. It deliberately does **not** implement stemming/synonyms, semantic embeddings, bulk automatic relationship edits, automatic ingestion of plain documents, global cross-vault search or an identity-resolving index for PDF/drawing text. Those require separate choices about trust, provenance, refresh cost and review.

Useful follow-ons, in order: (1) rank *unlinked Requirement ↔ Verification* pairs by overlap plus source evidence; (2) select two notes in one workspace and preview native `verify`/`satisfy`/derivation options; (3) add property/parameter filters such as part number, voltage and interface names; (4) integrate external legacy documents with linked provenance records. Any proposed link requires human approval.

[Workbench README](../tools/workbench/README.md) · [Toolset update and validation](TOOLSET_UPDATE.md) · [Current staging ledger](STAGING_VALIDATION_PR4.md)
