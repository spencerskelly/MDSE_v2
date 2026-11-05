# Owner-defined stakeholder capability needs

**Source:** MDSE owner, 2026-10-21. **Titles and enumeration are owner-supplied.** Interpretations and supporting details remain draft until reviewed.

These are the **twelve primary capability needs** driving MDSE product definition. They identify engineering lifecycle capabilities to support, not twelve software applications or twelve implementation requirements. A capability may use multiple existing MDSE tools; no new tool is assumed merely because a need is named.

## First need expanded — Engineering Knowledge Base

The owner has defined an engineering-centered, potentially organization-wide knowledge base for all products, with functional/design/structural/contextual information at variable depth. PDM/PLM retains complete CAD; related Jira work can be linked. Eight original user interactions plus a critical import use case and seven further querying, presentation, composition and flag-visibility use cases are now drafted in [Knowledge-base use cases](20_Use_Cases/README.md). These are user-intent definitions, **not yet implementation acceptance evidence**.

## Primary needs in owner-provided order

| Pilot ID | Stakeholder capability need | Lifecycle area | Definition status |
|---|---|---|---|
| [STK-00013](10_Stakeholder_Needs/STK-00013%20-%20Engineering%20Knowledge%20Base.md) | Engineering Knowledge Base | Knowledge and Discovery | Draft |
| [STK-00014](10_Stakeholder_Needs/STK-00014%20-%20Product%20Discovery%20Aide.md) | Product Discovery Aide | Knowledge and Discovery | Draft |
| [STK-00015](10_Stakeholder_Needs/STK-00015%20-%20Requirements%20Management.md) | Requirements Management | Engineering Definition | Draft |
| [STK-00016](10_Stakeholder_Needs/STK-00016%20-%20Concept%20Analysis.md) | Concept Analysis | Analysis and Risk | Draft |
| [STK-00017](10_Stakeholder_Needs/STK-00017%20-%20Failure%20Mode%20and%20Effect%20Analysis.md) | Failure Mode and Effect Analysis | Analysis and Risk | Draft |
| [STK-00018](10_Stakeholder_Needs/STK-00018%20-%20Design%20Definition.md) | Design Definition | Engineering Definition | Draft |
| [STK-00019](10_Stakeholder_Needs/STK-00019%20-%20Architecture%20Definition.md) | Architecture Definition | Engineering Definition | Draft |
| [STK-00020](10_Stakeholder_Needs/STK-00020%20-%20Validation%20definition.md) | Validation definition | Verification and Validation | Draft |
| [STK-00021](10_Stakeholder_Needs/STK-00021%20-%20Customer%20Documentation%20Builder.md) | Customer Documentation Builder | Publication and Collaboration | Draft |
| [STK-00022](10_Stakeholder_Needs/STK-00022%20-%20Supplier%20Documentation%20Builder.md) | Supplier Documentation Builder | Publication and Collaboration | Draft |
| [STK-00023](10_Stakeholder_Needs/STK-00023%20-%20Regulatory%20Impact%20Analysis.md) | Regulatory Impact Analysis | Analysis and Risk | Draft |
| [STK-00024](10_Stakeholder_Needs/STK-00024%20-%20Change%20Management%20Tool.md) | Change Management Tool | Governance and Change | Draft |

## Review by engineering lifecycle

### Knowledge and Discovery

- [[STK-00013 - Engineering Knowledge Base]]
- [[STK-00014 - Product Discovery Aide]]

### Engineering Definition

- [[STK-00015 - Requirements Management]]
- [[STK-00018 - Design Definition]]
- [[STK-00019 - Architecture Definition]]

### Analysis and Risk

- [[STK-00016 - Concept Analysis]]
- [[STK-00017 - Failure Mode and Effect Analysis]]
- [[STK-00023 - Regulatory Impact Analysis]]

### Verification and Validation

- [[STK-00020 - Validation definition]]

### Publication and Collaboration

- [[STK-00021 - Customer Documentation Builder]]
- [[STK-00022 - Supplier Documentation Builder]]

### Governance and Change

- [[STK-00024 - Change Management Tool]]

The list is intentionally arranged by engineering concern, **not as a mandated sequential workflow**. Knowledge, regulatory impact, validation and change control may apply across many design stages.

## Cross-cutting qualities carried from previous work

Existing preliminary `STK-00001` through `STK-00012` were created before the owner provided this definitive capability list. Do **not** silently delete or repurpose those IDs. They are preserved as **draft supporting qualities or potential secondary stakeholder needs**, not considered additional approved primary capabilities. Examples are source preservation, offline usability, traceability, data separation, release consistency, and demonstrable acceptance.

The existing pilot source-row example remains a supporting trace candidate:
`STK-00003` → `UC-00001` → `BEH-00001` → `REQ-00001` → `OBJ-00001` → `VER-00001`.

The first primary capability, `STK-00013`, may link to `UC-00001` as an illustrative *partial* use case. Source import is only part of an engineering knowledge base.

## Rules for expanding the self-model

1. Review each need with its actual stakeholders, boundaries, outputs and success measures.
2. Define use cases for stakeholder interactions, including actors and observable outcomes.
3. Identify *logical functions* independently of implementations.
4. Derive or link explicit system requirements; locate old `GOV`, `MOD`, `IMP`, `BOM`, `BAS`, `BOO`, `WKB`, and `TST` rules as controlling origin rather than rewriting normative content.
5. Allocate functions and requirements to the existing MDSE core, importer, base-vault, Bootstrap, Workbench or tests, based on actual responsibilities.
6. Define verification cases, connect to executable tests and their results; missing evidence remains visible.
7. Derive formal SysML v2 connections with the shared parser-validated writer. Markdown links and a CSV trace proposal are **not** formal model certification.
8. Model capabilities separately from release phases. A needed capability can legitimately remain unimplemented or deferred.

## Cross-cutting decisions to review

- Distinguish an informal stakeholder **need** from a binding stakeholder **requirement**. Current `Requirement/stakeholder` is a provisional schema fit.
- Maintain one canonical source of truth: `governance/RULESET.md` and `DECISIONS.md` remain normative until an approved revision; model notes are structured traceability.
- Existing IDs and UIDs are not recycled. New needs use `STK-00013`–`STK-00024`, preserving historical pilot notes.
- No commitment that all twelve capabilities are delivered by the present `0.9.0` tool. Coverage is established only through verification evidence.
- The proposed architecture for this *toolset* is not a mandate to create one plugin per stakeholder need.

## Immediate review order

First confirm definitions and boundaries of the twelve capability needs; next select one representative use case and trace it through function, system requirement, allocation, verification and evidence; then expand the rest. This replaces the earlier recommendation to complete a purely rule-by-rule scan as the immediate next step.
