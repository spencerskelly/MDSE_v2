---
type: Language Element
id: refinement-metadata
category: library
kind: relationship
keyword: "#refinement dependency from A to B;"
metaclass: "Dependency annotated with Refinement (ModelingMetadata library)"
library: "ModelingMetadata"
usage: occasional
status: Draft
---
# Refinement

**Standard library concept** · **Relationship** · **Occasional** · `#refinement dependency from A to B;` · SysML v2 standard library (ModelingMetadata), not a language keyword. Metaclass: `Dependency annotated with Refinement (ModelingMetadata library)`

Marks a dependency as a refinement: the source element is more precise than the target (for example a detailed design refining a requirement).

## Eligible from (source)

- any element (the more precise one)

## Eligible to (target)

- any element (the less precise one)

## What separates it from [[Dependency]]

A plain dependency has no meaning beyond the link. A refinement says the source adds precision to the target. MDSE writes this native form (D-0045). Older notes may still carry `dependency … // refines`; the Workbench reads it and rewrites it in this form when the relationship is edited.

## Example

```sysml
#refinement dependency from DetailedCharger to Charger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
