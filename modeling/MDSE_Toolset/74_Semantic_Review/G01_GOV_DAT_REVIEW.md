# G01 — Governance and Data semantic review

Scope: GOV-001 through GOV-018 and DAT-001 through DAT-002. Status: proposed dispositions for owner review. No normative rule changes.

| Rule | Proposed semantic disposition |
|---|---|
| GOV-001 | Retain as release-process constraints, not Core software behavior |
| GOV-002 | Retain architecture constraint; investigate JavaScript remaining in Core and Bootstrap |
| GOV-003 | Retain owner approval gate for Unreviewed rules |
| GOV-004 | Retain one ruleset authority and recorded-decision controls |
| GOV-005 | Retain MDSE_v2 repository authority |
| GOV-006 | Supersession candidate: older Test_Vault_ instruction duplicates GOV-001 and conflicts with GOV-005 |
| GOV-007 | Retain AI instructions source-of-truth and pointer requirements |
| GOV-008 | Split importer specification authority from executable source intake behavior |
| GOV-009 | Retain Obsidian-native-first as architectural design principle |
| GOV-010 | Hold: source is Check; resolve release/state documentation authority |
| GOV-011 | Hold: Proposed multi-concern release and security contract |
| GOV-012 | Split approved tool boundaries into individual responsibility constraints |
| GOV-013 | Hold: Proposed overlap with GOV-004; deduplicate |
| GOV-014 | Hold: Proposed per-rule verification obligation; confirm approval |
| GOV-015 | Hold: Unreviewed historical repository reorganization |
| GOV-016 | Hold: Unreviewed historical migration gate |
| GOV-017 | Retain phase-1 single-vault scope; correct obsolete repo description |
| GOV-018 | Conflict review: EA package placement versus current v2 independent placement |
| DAT-001 | Split privacy safeguards from independent parser certification limits |
| DAT-002 | Retain synthetic-only public repo rule; resolve outdated Test_Vault_ tool-authority sentence |

## Evidentiary checks

- D-0001 establishes MDSE_v2 as source-tool authority; D-0005 establishes the branch policy. GOV-006 is a strong retirement candidate rather than an additional executable Core function.
- D-0003 establishes SysML block semantic authority; YAML relationship duplication remains open as OD-01.
- D-0007 calls for TypeScript but current Core and Bootstrap still include JavaScript sources.
- D-0014 sets additive, approval-controlled re-import; legacy merge semantics differ.
- The current CI workflow is triggered on main push and pull requests; the independent parser job is manually invoked.
- Public file-extension scans are safety backstops, not proof of no data leak.

These findings were derived by inspecting governance/DECISIONS.md, governance/OPEN_DECISIONS.md, governance/RULESET.md, .github/workflows/ci.yml, tools/importer/src/merge.ts and relevant code paths. They are not executed test results.

## Next work

Review the MOD identity and note-format contracts. When the owner approves changes, edit governance/DECISIONS.md and governance/RULESET.md together and regenerate dependent model records. Until then, derived requirements remain Draft.
