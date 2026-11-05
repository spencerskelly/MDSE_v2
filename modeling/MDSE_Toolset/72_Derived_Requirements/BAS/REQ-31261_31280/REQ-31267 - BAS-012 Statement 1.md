---
type: Requirement
subtype: design
id: REQ-31267
uid: 20261022043100267skellyspencer
status: Draft
sourceRole: rule-derived-requirement-candidate
sourceRule: BAS-012
sourceRuleStatus: Active
sourceRuleClause: 1
sourceRevision: b78c453d7fe0d9c18d88c31ed54544e9873e8cb7
semanticReview: pending
primarySymbol: MDSE_REQ_31267::RuleREQ31267
---
# BAS-012 — Candidate Requirement 1

> [!warning] Unapproved model interpretation
> The source rule is **Active**, but this is a **Draft candidate statement**, not an independent approved requirement. Its segmentation, wording, duplication and applicability must be reviewed before promotion or new implementation work.

## Candidate obligation

The Base Vault ships Bootstrap, the Workbench, Templater 2.25.0, Advanced Canvas 7.1.0 and Obsidian Git 2.40.0, each unmodified from its release, listed in `community-plugins.json`, pinned with version, source, licence, governed settings and SHA-256 of main.js, manifest.json and styles.css in `plugin-lock.yaml` (status line removed; nothing is `not_bundled`).

## Authoritative origin

- [[BAS-012]] — exact source rule and decision origins
- [[BAS-012 - Analysis]] — clause decomposition and current classification
- Source family: `BAS`; semantic role: Release and Packaging Constraint; source phase `P1`
- This is one of 4 initial segments. It may need further splitting, combining or deduplication.

## Use cases requiring this candidate

- [[UC-00001 - Import an Engineering Model]]

## Logical functions supported

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]

## Existing software architecture candidates

- [[OBJ-00004 - MDSE Base Vault]]

This is an analysis of responsibilities, **not an approved SysML allocation**.

## Verification relationship

- Proposed case: [[VER-31133 - BAS-012 Rule Verification]]
- Acceptance criteria: must be derived and reviewed individually from the candidate obligation
- Executed result: none established
- Rule conflict / supersession review: required before making this an enforceable acceptance criterion

## SysML v2

> Candidate SysML definition. Parser acceptance and full native relationship semantics have not been established for this pilot.

```sysml
package MDSE_REQ_31267 {
    requirement def RuleREQ31267 {
        doc /* The Base Vault ships Bootstrap, the Workbench, Templater 2.25.0, Advanced Canvas 7.1.0 and Obsidian Git 2.40.0, each unmodified from its release, listed in `community-plugins.json`, pinned with version, source, licence, governed settings and SHA-256 of main.js, manifest.json and styles.css in `plugin-lock.yaml` (status line removed; nothing is `not_bundled`). */
    }
}
```
