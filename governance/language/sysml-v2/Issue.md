---
type: Language Element
id: issue-metadata
category: library
kind: annotation
keyword: "@Issue { text = \"...\"; }"
metaclass: "MetadataUsage of Issue (ModelingMetadata library)"
library: "ModelingMetadata"
usage: occasional
status: Draft
---
# Issue

**Standard library concept** · **Annotation** · **Occasional** · `@Issue { text = "..."; }` · SysML v2 standard library (ModelingMetadata), not a language keyword. Metaclass: `MetadataUsage of Issue (ModelingMetadata library)`

Metadata that records a concern about the element it annotates.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- Issue

## What separates it from [[Rationale]]

An Issue is a concern still to be resolved. A Rationale is a reason already given. An MDSE Issue note is a separate model note with a status; this metadata is a small annotation inside a block.

## Example

```sysml
@Issue { text = "Derating curve not confirmed."; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
