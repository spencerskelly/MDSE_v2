# C02 — Complete Rule Mapping Review

**Branch:** `mdse_v2_cleanup`  
**Date:** 2026-10-21  
**State:** Provisional mapping, ready for owner review; no normative changes.

## Artifact

[`governance/register/rules-cleanup-proposal.csv`](../governance/register/rules-cleanup-proposal.csv) is a *proposal-only* derived index. `governance/RULESET.md` remains the sole authoritative ruleset. The normal generated `rules-register.csv` has not been replaced.

## Inventory / integrity

| Metric | Result |
|---|---:|
| Current non-retired rule entries | 386 |
| Unique rule IDs | 386 |
| Unmapped rules | 0 |
| Active | 159 |
| Check | 3 |
| Proposed | 3 |
| Unreviewed | 221 |

Each row retains ID, original family and subsection, status, phase and exact original rule-line remainder (including its origin and explanatory notes). Proposed topic and affected components are non-normative review metadata. Blank implementation and test evidence fields mean **not yet audited**, not that the implementation is absent.

## Primary-section mapping by major domain

- 00 — Product definition and governance: current GOV and DAT rules.
- 10 — Canonical model contract: identities, classifications, SysML authority and semantics.
- 20 — Storage and integrity: Markdown layout, YAML, source provenance, naming, flags, transactions, merges.
- 30 — Source adapters: EA and BOM import, translation, reconciliation.
- 40 — Vault and runtime: Base Vault, Bootstrap, release integrity.
- 50 — Engineer and AI interaction: Workbench and AI process behavior.
- 60 — Validation and acceptance: cross-component checks and SysML validation.

The mapping uses current subsection ownership and topic keywords; it needs a semantic pass before being treated as final. For example, a rule mentioning Workbench may also prescribe model semantics, and some EA mapping rules should remain in the importer domain even if they mention ports.

## Human review priorities

1. **10/20 boundary:** distinguish canonical semantics from note serialization and source provenance.
2. **10/30 boundary:** keep canonical relationship eligibility independent of EA-to-v2 translation policy.
3. **20/30 boundary:** keep generic merge transactions independent of EA/BOM-specific reconciliation.
4. **40/50 boundary:** distinguish released Workbench assets from interactive Workbench behavior.
5. **60 verification:** many testing obligations are embedded in functional rules; link them instead of repeating normative rules.
6. **Old V1 wording:** do not silently reapprove legacy Local Model, folder and YAML-relationship rules.
7. **Multi-component scope:** `applies_to` is provisional and intentionally broader than ownership; subsequent review should distinguish implementation owner from consumers.

## C03 — Migration completeness audit

C03 will review decision ancestry and compare the current rules against current schemas, tool implementations and tests. Every row receives evidence and a disposition:
- `current`
- `partial`
- `missing`
- `conflict`
- `historical`
- `needs-review`

No decision is retired or behavior modified by the inventory. Findings should name actual IDs and file paths rather than generically calling code missing.

## Acceptance for C02

- [x] All 386 entries indexed exactly once.
- [x] IDs and statuses retained.
- [x] Topic and provisional component labels assigned.
- [x] Normative RULESET not modified.
- [x] No writes to the data or generated-vault repositories.
- [ ] Owner approval of final topic classification.
- [ ] Complete implementation/test/decision evidence in C03.
