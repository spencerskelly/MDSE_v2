# Step 05 — endpoint-specific v2 relationship routing matrix

> [!warning] This is a decision-support contract, not a replacement for the normative rules or closure of OD-01. `existing-approved` is an inherited mapping approval, not a claim of parser/cross-tool acceptance. `code-changed-pending-CI` was the initial source-commit snapshot; the linked release workflow subsequently passed. The machine-readable maturity status is now `synthetic-tests-passed-release-rebuild`.

**Source:** D-0003, D-0010, D-0038, D-0039, D-0045, D-0069, D-0070, D-0073; current importer `tools/importer/src/run.ts`; Workbench `tools/workbench/src/edit.ts`. Real EA and BOM semantic acceptance remains separate.

## Endpoint routing

| Legacy/intent | Source kind | Target kind | Source evidence | Disposition | Native v2 or MDSE record | Owner | Maturity / reason |
|---|---|---|---|---|---|---|---|
| `hasChild` | PartDefinition | PartDefinition | Aggregation/Composition | **native** | `part <role> : Target;` | owner with typed part usage | existing-approved: One connector -> one usage; multiplicity from EA |
| `hasChild` | ActionDefinition | ActionDefinition | Aggregation/Composition | **native** | `action <role> : Target;` | owning action/state/verification context as applicable | existing-approved: Do not replace with generic YAML hasChild |
| `hasChild` | StateDefinition | StateDefinition | Aggregation/Composition | **native** | `state <role> : Target;` | state owner context | existing-approved: Nested state vs exhibit distinguished |
| `hasChild` | RequirementDefinition | RequirementDefinition | Aggregation/Composition | **native** | `requirement <role> : Target;` | owning requirement definition/usage | existing-approved: Containment is not derivation |
| `hasChild` | UseCaseDefinition | UseCaseDefinition | Aggregation/Composition | **native** | `use case <role> : Target;` | owning use case definition | existing-approved: Membership is not necessarily include |
| `hasChild` | MDSE Note:Change | MDSE Note:Change | Aggregation | **mdse-only** | `YAML hasChild on owner note` | administrative note whole/child | existing-with-OD01-gate: No native SysML ownership inferred |
| `hasChild` | MDSE Note | Native model definition | Aggregation/unknown | **flagLink** | `flagLink + deferred_review` | originating connector remains evidence | needs-OD01-decision: Do not invent native containment |
| `hasChild` | Native model definition | MDSE Note | Aggregation/unknown | **flagLink** | `flagLink + deferred_review` | originating connector remains evidence | needs-OD01-decision: Source kind does not establish semantic ownership |
| `dependsOn` | Native model definition | Native model definition | EA Dependency with valid endpoints | **native** | `dependency from Source to Target; // dependsOn` | source definition / valid namespace | existing-approved: Trailing tag is MDSE qualifier and needs parser fixture |
| `dependsOn` | MDSE Note | Native model definition | EA Dependency or Usage | **mdse-only** | `YAML dependsOn` | non-SysML administrative/dependency meaning | existing-with-OD01-gate: Not automatically equivalent to native dependency |
| `dependsOn` | Native model definition | MDSE Note | EA Dependency or Usage | **mdse-only** | `YAML dependsOn` | note containing link on source (direction preserved) | existing-with-OD01-gate: Meaning/provenance and proper direction must be reviewed |
| `dependsOn` | Any | Any | Unrecognized or unspecified dependency semantics | **flagLink** | `flagLink + deferred_review` | source connector identity preserved | existing-approved: No generic guessed dependency |
| `participants` | UseCaseDefinition | EA Actor classified as PartDefinition | EA Association | **native** | `actor <role> : Target;` | owning use case | existing-approved: Repeated Actor association deduplicated |
| `participants` | UseCaseDefinition | PartDefinition (non Actor) | EA Association | **mdse-only** | `YAML participants` | use-case note | existing-with-OD01-gate: May be native subject or role; role evidence absent |
| `participants` | UseCaseDefinition | Document/Info | Association | **flagLink** | `flagLink + deferred_review` | no native actor/subject inference | needs-OD01-decision: Could be evidence rather than participation |
| `participants` | UseCaseDefinition | UseCaseDefinition | EA UseCase:include | **native** | `include use case <role> : Target;` | use case containing include | existing-approved: Not same as Association |
| `participants` | UseCaseDefinition | UseCaseDefinition | EA UseCase:extend | **native-conditional** | `use case <role> : Target[0..1];` | owning base use case | existing-with-parser-gate: Optional approximation, not proven full v1 extend semantics |
| `participants` | Any | Any | Generic Association non-use-case | **flagLink** | `flagLink + deferred_review` | original Association remains source evidence | existing-approved: No implicit connectsTo or interface |
| `precedes` | ActionUsage | ActionUsage | EA ControlFlow | **native** | `succession first source then target;` | common owning action definition | existing-approved: Guard becomes validated helper when explicit |
| `precedes` | StateUsage | StateUsage | EA StateFlow | **native** | `transition first source accept trigger if guard do effect then target;` | common owning state context | existing-approved: Transition is not bare chronological order |
| `precedes` | Action or State with no common owner | Action or State with no common owner | EA ControlFlow/StateFlow | **flagLink** | `flagLink + deferred_review` | no owner inferred | code-changed-pending-CI: Preserve EA GUID, source/target, trigger, guard, effect |
| `precedes` | Standalone definitions | Standalone definitions | EA ControlFlow/StateFlow | **flagLink** | `flagLink + deferred_review` | no usage/owner semantics invented | code-changed-pending-CI: Historical YAML precedes retained, no new writes |
| `trace` | Model definition | Model definition | Explicit recognized legacy dependency // trace | **historical-native** | `dependency from A to B; // trace` | existing model statement | read-only-legacy: Workbench scans/reads but no new unresolved trace |
| `trace` | Any | Any | Unselected or ambiguous relationship | **flagLink** | `flagLink + deferred_review` | no native semantic assertion | code-changed-pending-CI: Do not create tracesTo YAML or guessed dependency |

## Explicit invariants

1. Only a valid typed SysML owning context can contain native usages, transitions, succession and other native relationships. A folder or WikiLink never supplies that context.
2. Requirement containment, requirement derivation, and satisfaction are separate, even when source notes are linked to the same requirement.
3. No blanket Association → `connect` or `participants` promotion: prove port endpoints or use-case role first.
4. The non-Actor UseCase-to-Part case is **existing YAML** under IMP-118, but a potential native subject/actor interpretation is not yet resolved. Do not automatically convert it.
5. Native model dependency ≠ an MDSE Note's administrative dependency. A `// dependsOn` comment tag does not make an arbitrary unknown link native.
6. No native temporal relation from disjoint definitions without proof of a shared owner; preserve connector and PDATA trigger/guard/effect as review evidence.
7. Workbench's old `trace` is legacy read-only in the editor. New unresolved relations use `flagLink`, not provisional `tracesTo` or generated `dependency // trace`.
8. Legacy YAML fields and inverses remain readable pending OD-01, and are not silently deleted, migrated, mirrored or emitted as new native assertions.

**Source release test evidence (2026-10-24):** [workflow run 40134195187](https://github.com/spencerskelly/MDSE_v2/actions/runs/40134195187) passed full tool build, importer, Workbench, Bootstrap tests and rebuilt release-artifact check. Native relationship acceptance is still limited to those synthetic tests; this is not individual OMG parser/real EA semantic acceptance.

## Remaining acceptance

Run independent SysML parser fixtures for every native syntax form and endpoint/owner combination above, including interface and use-case associations. Verify Workbench scanner, index, document/canvas projections, editor, import/export and re-import for each row. Establish per-row pass/fail evidence and test environment before changing its maturity to verified.

Machine-readable candidate data: [OD_01_ENDPOINT_ROUTING.json](OD_01_ENDPOINT_ROUTING.json), including authority and explicit maturity fields. Do not load it as executable mapping authority until OD-01 approval.
