---
type: Language Element
id: variation
category: language
kind: structure
keyword: "variation part def V { variant part a; }"
metaclass: "VariantMembership"
usage: occasional
status: Draft
---
# Variation and variant

**Language construct** · **Structure** · **Occasional** · `variation part def V { variant part a; }` · SysML v2 metaclass `VariantMembership`

Declares a variation point whose members are the allowed choices (variants). A configuration picks one.

## Can be declared in

- a definition or usage marked `variation`

## Can specialize, be typed by, or refer to

- variant usages

## What separates it from [[Specialization (definition)]]

Variants live inside one variation point and are chosen per configuration; specialization creates a permanent subtype.

## Example

```sysml
variation part def Cable { variant part short : ShortCable; variant part long : LongCable; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
