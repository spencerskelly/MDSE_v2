---
type: Language Element
id: metadata-def
category: language
kind: definition
keyword: "metadata def"
metaclass: "MetadataDefinition"
usage: occasional
status: Draft
---
# Metadata definition

**Language construct** · **Definition** · **Occasional** · `metadata def` · SysML v2 metaclass `MetadataDefinition`

A definition of an annotation type attached to elements (a tag with typed fields such as `Safety`, `Approved`).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another metadata definition (specialization, `:>`)

## What separates it from [[Attribute definition]]

An attribute definition describes data inside the model. A metadata definition describes data about model elements and can be applied to them.

## Example

```sysml
metadata def Safety { attribute level : Integer; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
