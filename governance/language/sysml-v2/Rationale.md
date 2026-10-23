---
type: Language Element
id: rationale-metadata
category: library
kind: annotation
keyword: "@Rationale { text = \"...\"; }"
metaclass: "MetadataUsage of Rationale (ModelingMetadata library)"
library: "ModelingMetadata"
usage: occasional
status: Draft
---
# Rationale

**Standard library concept** · **Annotation** · **Occasional** · `@Rationale { text = "..."; }` · SysML v2 standard library (ModelingMetadata), not a language keyword. Metaclass: `MetadataUsage of Rationale (ModelingMetadata library)`

Metadata that records why a choice or decision was made, with a `text` and an optional reference to the element that explains it.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- Rationale

## What separates it from [[Metadata usage]]

Rationale explains a decision. A comment is free text with no meaning; an Issue records a concern.

## Example

```sysml
@Rationale { text = "Meets the standard."; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
