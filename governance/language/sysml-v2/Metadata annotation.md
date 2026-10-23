---
type: Language Element
id: metadata-feature
category: language
kind: annotation
keyword: "@Tag { field = v; }"
metaclass: "MetadataUsage"
usage: occasional
status: Draft
---
# Metadata annotation

**Language construct** · **Annotation** · **Occasional** · `@Tag { field = v; }` · SysML v2 metaclass `MetadataUsage`

Attaches a metadata value to an element in its body (`@Safety { level = 3; }`) or to others with `about`.

## Can be declared in

- any element

## Can specialize, be typed by, or refer to

- a metadata definition

## What separates it from [[Prefix metadata]]

Same meaning as `#Tag`; the body form can set fields.

## Example

```sysml
@Safety { level = 3; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
