---
type: Language Element
id: enum-def
category: language
kind: definition
keyword: "enum def"
metaclass: "EnumerationDefinition"
usage: common
status: Draft
---
# Enumeration definition

**Language construct** · **Definition** · **Common** · `enum def` · SysML v2 metaclass `EnumerationDefinition`

A definition of a closed set of named values.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another enumeration definition (specialization, `:>`)

## What separates it from [[Attribute definition]]

An attribute definition allows any value of its type. An enumeration allows only its named values.

## Example

```sysml
enum def Mode { enum on; enum off; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
