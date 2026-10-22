---
type: Verification
subtype: test
id: VER-31133
uid: 20261022043200133skellyspencer
status: Draft
sourceRole: rule-derived-verification-candidate
sourceRule: BAS-012
sourceRuleStatus: Active
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
executionStatus: not-run
semanticReview: pending
primarySymbol: MDSE_VER_31133::TestVER31133
---
# BAS-012 — Candidate Verification Case

> [!warning] Draft test definition only
> No test execution is recorded by this note. The source rule is Active, but clause-level acceptance criteria and relevance of cited source test files are not yet independently verified.

## Objective

Establish verifiable evidence for the governed outcomes of [[BAS-012]] and its proposed requirements. Explicitly test or review each clause; do not consider a generic smoke test sufficient.

## Candidate requirements

- [[REQ-31267 - BAS-012 Statement 1]]
- [[REQ-31268 - BAS-012 Statement 2]]
- [[REQ-31269 - BAS-012 Statement 3]]
- [[REQ-31270 - BAS-012 Statement 4]]

## Acceptance checklist — source statements requiring verification

- [ ] Clause 1: The Base Vault ships Bootstrap, the Workbench, Templater 2.25.0, Advanced Canvas 7.1.0 and Obsidian Git 2.40.0, each unmodified from its release, listed in `community-plugins.json`, pinned with version, source, licence, governed settings and SHA-256 of main.js, manifest.json and styles.css in `plugin-lock.yaml` (status line removed; nothing is `not_bundled`).
- [ ] Clause 2: `data.json` is seeded from the governed settings and never overwritten by an update.
- [ ] Clause 3: Core plugins are the V1 set with Templates off.
- [ ] Clause 4: `99_System/THIRD_PARTY_NOTICES.md` names each licence.

## Proposed test procedure

**Given:** A reproducible base-vault build input and configured plugin assets.

**When:** Build and update a target vault; inspect versions, lock entries and changed-file plan.

**Then:** Check asset versions, determinism, controlled overwrites and preservation of personal configuration.

Each checklist item needs a precise fixture, expected outcome, pass/fail assertion and (where appropriate) manual review criterion before execution.

## Existing files to investigate

- `tools/importer/test/vault_update.test.ts` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**
- `tools/bootstrap/test/bootstrap.test.mjs` — **candidate source evidence only; correspondence to this exact rule not yet confirmed**

## Result and authority

- Run result: **not run**
- Executed test commit, environment and evidence: **not linked**
- Source rule: [[BAS-012]]
- Analysis: [[BAS-012 - Analysis]]
- No SysML parser certification or actual component acceptance is implied.

## SysML v2

> Draft verification definition; native requirement-verification relationship and independent parser validation remain pending.

```sysml
package MDSE_VER_31133 {
    verification def TestVER31133 {
        doc /* Candidate verification of BAS-012; execution and clause-level acceptance are pending. */
    }
}
```
