# Current-rule reference library — 386-rule baseline

**Source:** `governance/RULESET.md` at source snapshot commit [`bcdb25a11efa`](https://github.com/spencerskelly/MDSE_v2/blob/bcdb25a11efa3ea14ba343949b01f797553c044d/governance/RULESET.md).  
**Branch:** `mdse_v2_cleanup`.  
**Status:** Generated proposal, not approved model requirements or native SysML relationship declarations.

## What was created

- **386 one-to-one rule reference notes:** one per current, non-retired rule, preserving ID, exact wording including origin, source status and phase. Rule text is copied *verbatim as a snapshot*, but never becomes a second editable authority.
- **25 folders** with at most 20 rule notes each.
- [Machine-readable rule trace register](RULE_TRACE_REGISTER.csv): one row per rule, with original status and candidate function/use-case associations.
- [Browse by function](RULES_BY_FUNCTION.md): proposed impact view connecting existing rules to the six function definitions.
- Each reference note links directly to the relevant function and use-case notes using complete Obsidian file names, with no newly invented system requirements or tests.

## Classification audit

| Trace relevance | Count | Meaning |
|---|---:|---|
| Direct | 320 | Rule concerns model semantics, source translation, or the Workbench behavior used by these functions |
| Supporting | 48 | Supporting release, governance, data protection or acceptance obligations; not claimed as direct functional behavior |
| Legacy-review | 18 | Old V1 or repository-policy clauses requiring explicit migration/reconciliation; **not promoted** as V2 obligations |
| **Total** | **386** | 100% of the current non-retired rule ID inventory |

These classifications and the proposed function/use-case links are **algorithmic topic associations for human review**, not full semantic derivations. A link **does not** certify the rule is applicable, implemented, fulfilled, testable or binding.

## Important identity/authority contract

The existing canonical rule ID (`GOV-001`, `MOD-001`, etc.) is retained as `ruleId` and as the reference note title/file name. Each reference note has a **separate provisional MDSE `Info` ID and unique UID**, because the current element type schema does not permit arbitrary GOV/MOD/IMP identifiers as a model-note `id`. This is an administrative wrapper, not a change to the original rule identifier. Do not translate these into a second `requirement def` without an explicit authority decision.

The reference notes intentionally **have no SysML v2 section**: they are derived governance references. Any later accepted `requirement def` must have a defined ownership and source authority. `sourceRole: derived-rule-reference` signals that meaning comes from the authoritative ruleset.

## Binding status is preserved, not inferred

Original `Active` remains binding; `Unreviewed` is **not binding**; `Check` and `Proposed` need decision review. Model-note `status: Draft` describes trace approval and **does not overwrite** the original rule's status (stored separately in `ruleStatus`).

## Follow-up verification

1. Review association accuracy by group or function, especially broad MOD relationship and WKB families.
2. Flag superseded active rules (e.g. old repository paths or legacy YAML relation policy) without silently changing rule status.
3. For each rule, identify actual implementation and one concrete test location or a visible evidence gap.
4. Reconcile duplicate or contradictory implementations before deriving new requirements.
5. Define a deterministic generator that refreshes these notes from `RULESET.md` rather than manually maintaining copied text. This commit is a **one-time snapshot**, not a running sync.
6. Establish native SysML trace syntax and independent parser checks before promoting associations into the semantic model.
7. When materializing as an operational vault, run the full vault identity, template, path, Obsidian links, and plugin tests. This review does not claim such acceptance.

## Families

- [GOV](./GOV/README.md) — 18 rule notes
- [DAT](./DAT/README.md) — 2 rule notes
- [MOD](./MOD/README.md) — 167 rule notes
- [IMP](./IMP/README.md) — 126 rule notes
- [BOM](./BOM/README.md) — 17 rule notes
- [BAS](./BAS/README.md) — 12 rule notes
- [BOO](./BOO/README.md) — 8 rule notes
- [WKB](./WKB/README.md) — 23 rule notes
- [AIP](./AIP/README.md) — 4 rule notes
- [TST](./TST/README.md) — 9 rule notes

**Safeguard:** Original `RULESET.md`, `DECISIONS.md`, source tools and tests are unchanged by creation of this catalog.
