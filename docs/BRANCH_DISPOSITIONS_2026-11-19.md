# Historical Branch Dispositions — 2026-11-19

Status: **Provenance / backlog reference**, not an approved implementation contract or test certificate.

## Pop-out Workbench experiment
- Historical branch: `experiment/workbench-popout-window`, PR #2 (closed without merge).
- Replacement implementation: `feature/workbench-popout-current-main-20261119`, PR #3 (draft pending build and live acceptance).
- The historical experiment's proposed D-0161 and WKB-074 collide with existing identifiers on main; they are not to be reused.
- Do not merge PR #2. The experimental prototype also includes unrelated document importer and generated artifact changes.

## Historical BOM revision review
- Historical branch: `feature/bom-shared-revision-review-20261025`, PR #1 (original exploratory implementation; **do not merge wholesale**).
- Original design statement dated 2026-10-25: use BOM-source-designated current revision; preserve assembly-level older-revision usages; add `noteReview` YAML linking to one shared `Old Revision Usage` note; avoid redundant old-revision flags while preserving genuine errors.
- Current revision MUST come from an explicit BOM source designation rather than simply sorting revision strings. If not designated, flag for review.
- Across multiple BOMs, merge review evidence idempotently with source provenance. Preserve SysML assembly usage revision pins; use YAML for review navigation only.
- The branch's first-pass `tools/importer/src/bom.ts` should not replace newer main code. Main already includes older-revision usage reporting and `noteReview` support; that alone does not prove all these acceptance conditions are met.
- Before declaring this capability complete, test: (1) source-designated current revision, (2) four-BOM idempotent review merge, (3) `noteReview` schema, (4) independent SysML parser acceptance, and (5) representative real-vault regression.
- Original source specification: PR #1; the original branch's `tools/importer/REVISION_REVIEW_DESIGN.md`. This archival record is not an implementation approval.

## Branch retirement criterion
Branches can be deleted after unique requirements and decisions are preserved here or in accepted current contracts, and the associated PR has been merged or closed. A merged feature requires passing source-to-artifact build validation and applicable runtime checks before release. Do not treat deletion of historical branch pointers as proof of feature acceptance.
