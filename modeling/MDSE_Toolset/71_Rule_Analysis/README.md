# Existing rule semantic decomposition — complete source inventory

**Source snapshot:** [RULESET.md at `5360a55e8964`](https://github.com/spencerskelly/MDSE_v2/blob/5360a55e896498091b5c18b0218839f7e2b9ffba/governance/RULESET.md). **Original rules are authoritative and remain unchanged.**

This is the semantic-analysis workspace for the existing 386 one-note-per-rule catalog. It is **not** a separate ruleset or an approval to implement old V1 semantics.

## Coverage

- **386 existing rule IDs inspected** across GOV, DAT, MOD, IMP, BOM, BAS, BOO, WKB, AIP, TST.
- **826 candidate statement segments** captured as explicit review items (text segmentation, not yet expert semantic atomization).
- Original statuses: **159 Active, 3 Check, 3 Proposed, 221 Unreviewed**.
- Each analysis note identifies initial meaning (requirements/constraints/process/verification), existing functions, use cases, relevant software parts, proposed statement decomposition and verification status.
- **332 provisional requirement segments** and **159 provisional verification cases** planned *only from Active source rules*, to be created as notes in a second stage. Non-Active material remains in analysis until owner disposition.
- [Machine-readable rule decomposition register](DECOMPOSITION_REGISTER.csv) and [source data to generate derived notes](DECOMPOSITION_SOURCE.jsonl).

## Classification does not constitute approval

A document may say multiple things: architecturally constrain a component, define required behavior, control a release workflow, and prescribe a test. The candidate primary role is **not an exhaustive semantic judgment**.

Clause boundaries generated from punctuation can be wrong. A line in this register is **not certified atomic**, and a source rule may map to several requirements or zero new requirements if the meaning is already expressed elsewhere. We must consolidate equivalent clauses, capture separate acceptance criteria and check native SysML syntax before promotion.

## Available architecture elements

- [[OBJ-00001 - MDSE Importer]]
- [[OBJ-00002 - MDSE Core]]
- [[OBJ-00003 - MDSE Workbench]]
- [[OBJ-00004 - MDSE Base Vault]]
- [[OBJ-00005 - MDSE Bootstrap]]

These are existing tool elements, not new implementations. Functions `BEH-00002`–`BEH-00007` and use cases `UC-00001`–`UC-00016` are linked as **review candidates** based on earlier heuristic classifications.

## Draft model elements now available

- [332 candidate requirement notes](../72_Derived_Requirements/README.md) from Active rules
- [159 candidate verification notes](../73_Derived_Verification/README.md), none executed
- [Specific semantic review findings](../SEMANTIC_REVIEW_FINDINGS.md) highlighting conflicting and compound rules

## Next semantic review

1. Check status and later decisions first; notably V1 Local Model and contradictory active governance.
2. Consolidate equivalent clauses and split multi-obligation segments for a genuinely atomic requirement model.
3. Confirm whether each statement is functional behavior, design constraint, domain definition, process step, documentation, or verification.
4. Only then approve derived requirement notes, formal typed SysML relations and component allocations.
5. Map requirement(s) to existing test code, and verify through actual CI/parser/Obsidian runs; never equate candidate tests with passed tests.

## Family indexes

- [GOV](GOV/README.md) — 18
- [DAT](DAT/README.md) — 2
- [MOD](MOD/README.md) — 167
- [IMP](IMP/README.md) — 126
- [BOM](BOM/README.md) — 17
- [BAS](BAS/README.md) — 12
- [BOO](BOO/README.md) — 8
- [WKB](WKB/README.md) — 23
- [AIP](AIP/README.md) — 4
- [TST](TST/README.md) — 9
