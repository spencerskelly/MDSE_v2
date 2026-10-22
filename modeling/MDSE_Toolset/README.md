# MDSE toolset — engineering the engineering tool

**Status:** Draft self-model on `mdse_v2_cleanup` (2026-10-21). **Not** an approved normative specification or released vault.

## Start here

**[Owner-defined primary stakeholder needs](NEEDS_BASELINE.md)** — twelve capability needs supplied by the owner, with one review note per concept, proposed stakeholder and outcome, existing coverage assessment, and verification gaps.

These capabilities cover engineering knowledge, product discovery, requirements, concept and risk analysis, design and architecture, validation, publications, regulation, and engineering change. They are not one software application each.

The earlier `STK-00001`–`STK-00012` draft statements are preserved, but treated as *provisional cross-cutting qualities / supporting needs* for review, not the primary capability taxonomy. They must not be silently renumbered or reused. New owner-provided primary needs use `STK-00013`–`STK-00024`.

## Self-model convention

One note per concept. Iterate: stakeholder need → use case → logical function → engineering requirement → architectural element → verification case → executed result. Follow relationships in both directions and record gaps explicitly.

Existing `governance/RULESET.md` and `DECISIONS.md` remain the **only normative rules/decision authorities**. This model is an engineering analysis and traceability proposal, not a second ruleset. All native SysML relationships must eventually be parser-validated and managed through the shared writer. Current Markdown links and `TRACE_PROPOSALS.csv` remain review candidates.


**Current review:** [Engineering Knowledge Base — eight use cases](20_Use_Cases/README.md), scoped for a potentially organization-wide but engineering-led audience. PDM/PLM owns complete CAD files, Jira owns work items; MDSE models knowledge and may link to those external systems. Formal trace and tests are pending.

## Primary need index

- [[STK-00013 - Engineering Knowledge Base]]
- [[STK-00014 - Product Discovery Aide]]
- [[STK-00015 - Requirements Management]]
- [[STK-00016 - Concept Analysis]]
- [[STK-00017 - Failure Mode and Effect Analysis]]
- [[STK-00018 - Design Definition]]
- [[STK-00019 - Architecture Definition]]
- [[STK-00020 - Validation definition]]
- [[STK-00021 - Customer Documentation Builder]]
- [[STK-00022 - Supplier Documentation Builder]]
- [[STK-00023 - Regulatory Impact Analysis]]
- [[STK-00024 - Change Management Tool]]

## Existing proof-of-concept trace (prior supporting quality)

[[STK-00003 - Preserve Imported Knowledge]] → [[UC-00001 - Import an Engineering Model]] → [[BEH-00001 - Reconcile Source Records]] → [[REQ-00001 - Account for Every Source Row]] → [[OBJ-00001 - MDSE Importer]] → [[VER-00001 - Source Row Disposition Test]]

This is a *draft* vertical chain. The synthetic source-row ledger test exists in `tools/importer/test/importer.test.ts`, but its execution against this self-model and independent parser acceptance have not been established here.

## Next steps

1. Review the twelve owner-supplied capability needs in `NEEDS_BASELINE.md`, beginning with **Engineering Knowledge Base**.
2. Record revised intent, stakeholder actors, success criteria and boundaries in each note.
3. Create/reuse use-case notes, then derive functions and requirements without prematurely naming implementation components.
4. Link requirements to existing rule IDs and observed tests without duplicating normative definitions.
5. Establish checks for unlinked needs, unverified requirements and impacted tests.
6. Run Workbench and a pinned SysML parser before treating the model as operational. Neither has been executed on these newly drafted notes in this review.

## Unresolved modeling decisions

- Stakeholder need versus stakeholder requirement type and status schema
- Native SysML relationship syntax and endpoint typing for the complete chain
- Whether this self-model is later materialized as a standalone MDSE-built vault
- Identity governance and managed provenance for model-to-code/test associations
- Distinguishing test definitions from executed evidence
