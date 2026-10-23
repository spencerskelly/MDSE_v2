---
type: Language Element
id: attribute-def
category: language
kind: definition
keyword: "attribute def"
metaclass: "AttributeDefinition"
usage: core
status: Draft
---
# Attribute definition

**Language construct** · **Definition** · **Everyday** · `attribute def` · SysML v2 metaclass `AttributeDefinition`

A definition of a data type: a value with no identity (a number with unit, a record of fields, a quantity kind).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another attribute definition (specialization, `:>`)

## What separates it from [[Enumeration definition]]

An enumeration is a closed list of named values. An attribute definition is an open data type.

## Example

```sysml
attribute def PowerValue;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
