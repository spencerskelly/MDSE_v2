---
type: Language Element
id: interface-def
category: language
kind: definition
keyword: "interface def"
metaclass: "InterfaceDefinition"
usage: common
status: Draft
---
# Interface definition

**Language construct** · **Definition** · **Common** · `interface def` · SysML v2 metaclass `InterfaceDefinition`

A definition of a connection between ports that fixes what passes across it (the ends are port definitions).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another interface definition (specialization, `:>`)

## What separates it from [[Connection definition]]

An interface definition ends on ports and is about what crosses a boundary. A connection definition ends on any feature.

## Example

```sysml
interface def PowerInterface;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
