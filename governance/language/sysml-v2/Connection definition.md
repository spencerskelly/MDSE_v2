---
type: Language Element
id: connection-def
category: language
kind: definition
keyword: "connection def"
metaclass: "ConnectionDefinition"
usage: common
status: Draft
---
# Connection definition

**Language construct** · **Definition** · **Common** · `connection def` · SysML v2 metaclass `ConnectionDefinition`

A definition of a relationship between parts that has its own properties or structure, with two or more ends.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another connection definition (specialization, `:>`)

## What separates it from [[Interface definition]]

An interface definition constrains connections between ports. A connection definition is a link between any features, with no port requirement.

## Example

```sysml
connection def CableLink;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
