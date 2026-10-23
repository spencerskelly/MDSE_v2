---
type: Language Element
id: prefix-metadata
category: language
kind: annotation
keyword: "#Tag part x;"
metaclass: "MetadataUsage"
usage: occasional
status: Draft
---
# Prefix metadata

**Language construct** · **Annotation** · **Occasional** · `#Tag part x;` · SysML v2 metaclass `MetadataUsage`

Applies a metadata definition to an element with `#` in front of its declaration.

## Can be declared in

- any element declaration

## Can specialize, be typed by, or refer to

- a metadata definition

## What separates it from [[Metadata annotation]]

A prefix is shorthand for the same annotation written as `@Tag` in the body.

## Example

```sysml
#Safety part brake;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
