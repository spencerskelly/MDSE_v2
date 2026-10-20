# Schemas

Machine-readable model contract. Tools read these files; they never copy their content into code by hand. A change here needs a decision (see [../README.md](../README.md)). Rules refer to "the latest version"; exact versions are pinned only in the release manifest (MOD-146).

| File | Defines | Read by | State |
|---|---|---|---|
| `element-types.yaml` | Classes, id prefixes, subtypes, property order, governed optional properties | core (via generated `tools/core/src/classes.json`), importer, oracle | Active. STD/STK via `prefix_by_subtype` (D-0015) |
| `relationships.yaml` | Relationship fields stored in YAML, with endpoint rules | importer, Workbench | **Under revision.** SysML-defined fields leave this file (D-0003, OD-01) |
| `authors.yaml` | Default time zone, AI author codes, unmapped-author fallback | core, Bootstrap, AI tools | Active |
| `ea-family-mapping.json` | Disposition of each of the 60 EA element families and 26 connector families: native SysML construct, MDSE note, folder, or review | importer only (not shipped into vaults) | Approved mapping; `emission_enabled` false until the parser gate passes per family. Some `approved_source` and `approved_description` fields cite archived Test_Vault_ paths; the Boundary description is stale (disposition `aggregate_boundary_note` is current) |

## Derived files

| Derived | From | Regenerate | Checked by |
|---|---|---|---|
| `tools/core/src/classes.json` | `element-types.yaml` | see `testing/oracles/test_core_crosscheck.py` for the expected shape | `npm run test:oracles` |

## Not carried

`local-model.yaml` (V1 Local Model, replaced by SysML usages; OD-08) and the V1 EA mapping files (`ea-element-mapping.yaml`, `ea-connector-mapping.yaml`, `ea-package-rules.yaml`) stay in the Test_Vault_ archive. The EA field and tag rules they implemented are in RULESET.md section IMP, "EA fields and tags", as Unreviewed. Bring a file across only when a reviewed rule needs it.

`ea-tag-dispositions.json` and `ea-field-dispositions.json` are the V1 disposition lists converted from YAML (D-0026). The importer reads the tag list; the field list is the record of what V1 decided for element, connector, package and diagram fields. Change a disposition here, never in code.
