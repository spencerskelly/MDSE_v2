# EA V1 model to SysML v2: where everything goes

Generated from the accepted source profile (`EA8647-2026-09-06-v1`), the approved family mapping and the tag dispositions. Do not edit; run `node scripts/build-ea-paths.mjs --write`.

## Elements

| EA element type | Rows | Families | Destination in v2 |
|---|---|---|---|
| Requirement | 13988 | 10 | SysML `requirement def` |
| InformationItem | 2825 | 1 | MDSE note (YAML links, no SysML block) |
| Port | 4387 | 3 | SysML `PortUsage` |
| Class | 2737 | 17 | SysML `part def`; SysML `interface def`; SysML `port def` |
| Part | 3137 | 2 | SysML `PartUsage`; SysML `ItemUsage` |
| Object | 545 | 1 | SysML `part def` |
| Signal | 623 | 4 | SysML `item def`; SysML `attribute def` |
| Activity | 1668 | 6 | SysML `action def`; SysML `verification case def` |
| UseCase | 1667 | 1 | SysML `use case def` |
| State | 1112 | 3 | SysML `state def` |
| Artifact | 459 | 3 | Attachment file and Artifact note |
| Issue | 264 | 1 | MDSE note (YAML links, no SysML block) |
| Actor | 44 | 1 | SysML `part def` |
| StateMachine | 2 | 1 | SysML `state def` |
| Note | 431 | 1 | MDSE note (YAML links, no SysML block) |
| Text | 61 | 2 | MDSE note (YAML links, no SysML block) |
| Constraint | 1 | 1 | SysML `constraint def` |
| Action | 323 | 1 | SysML `ActionUsage` |
| StateNode | 73 | 1 | SysML `StateUsage` |
| Change | 65 | 1 | MDSE note (YAML links, no SysML block) |
| Boundary | 44 | 1 | Boundary note |
| Decision | 34 | 1 | MDSE note (YAML links, no SysML block) |
| ActivityPartition | 28 | 1 | SysML usage when evidence allows, else a review flag |
| Trigger | 27 | 1 | SysML usage when evidence allows, else a review flag |
| Synchronization | 14 | 1 | SysML usage when evidence allows, else a review flag |
| Sequence | 11 | 1 | YAML link only |
| ActionPin | 6 | 1 | SysML usage when evidence allows, else a review flag |
| ProxyConnector | 5 | 1 | YAML link only |
| Event | 1 | 1 | SysML `OccurrenceDefinition` |
| ActivityParameter | 1 | 1 | SysML usage when evidence allows, else a review flag |
| Package | 1386 | 1 | Folder only |

## Connectors

| EA connector type | Rows | Families | Destination in v2 |
|---|---|---|---|
| Nesting | 836 | 1 | ContextualNestedUsage |
| Generalization | 3974 | 1 | Specialization |
| Connector | 823 | 2 | ConnectionUsage; Binding |
| Aggregation | 2288 | 1 | TypedOwnedUsage |
| Realisation | 950 | 3 | ContextualPerformOrAllocate; RequirementDerivation; Dependency |
| NoteLink | 349 | 1 | reference_only |
| Dependency | 6762 | 8 | SatisfyRequirementUsage; DependencyWithRefinementEvidence; Dependency; DependencyWithTraceEvidence; RequirementDerivation; VerifyRequirementUsage; conditional_review |
| Abstraction | 2811 | 4 | AllocationUsage; RequirementDerivation; DependencyWithTraceEvidence; DependencyWithRefinementEvidence |
| UseCase | 1258 | 2 | ConditionalUseCaseUsage; RequiredUseCaseUsage |
| Association | 603 | 1 | ConnectionUsage |
| Usage | 239 | 2 | DependencyUnlessStrongerEvidence; AllocationUsage |
| ControlFlow | 407 | 1 | SuccessionUsage |
| StateFlow | 200 | 1 | TransitionUsage |
| Sequence | 199 | 1 | reference_only |
| InformationFlow | 123 | 1 | Flow |

## Tables

| EA table | Rows | V1 disposition | Read by the v2 importer | Where it goes |
|---|---|---|---|---|
| t_object | 35969 | imported | yes | Notes and SysML definitions and usages |
| t_connector | 21822 | imported | yes | SysML relationships; guard, trigger and effect on transitions (PDATA1 to PDATA3) |
| t_package | 1387 | imported | yes | Folders |
| t_diagram | 2924 | imported | no (deferred) | Deferred: diagrams are a later, selectable pass (ADR-V2-05) |
| t_diagramobjects | 42966 | imported | no (deferred) | Deferred with diagrams |
| t_diagramlinks | 37955 | imported | no (deferred) | Deferred with diagrams |
| t_objectproperties | 249892 | imported | yes | `## Source: EA` lines for kept tags (ea-tag-dispositions.json); requirement text to `doc` |
| t_xref | 42052 | imported | **no** | Links: conveyed items, transition trigger and effect, entry and do actions, represents, target pins |
| t_document | 397 | imported | yes | Attachment files |
| t_operation | 23 | imported | **no** | State `entry`, `do`, `exit` actions |
| t_attribute | 5 | imported | **no** | `attribute` usages on the Class |
| t_operationparams | 0 | imported | no (empty) | None (0 rows) |

88 other tables are ignored: 54 must be empty (the import checks) and 34 are non-empty and approved as ignored.

## Tagged values

122 tags: 38 kept in the body, 4 used by the importer, 80 dropped (placeholders and unused). Source: `ea-tag-dispositions.json`.

## Not accounted for

- table t_xref (42052 rows) is not read by the importer
- table t_operation (23 rows) is not read by the importer
- table t_attribute (5 rows) is not read by the importer
