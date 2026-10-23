---
type: Language Element
id: item-def
category: language
kind: definition
keyword: "item def"
metaclass: "ItemDefinition"
usage: common
status: Draft
---
# Item definition

**Language construct** · **Definition** · **Common** · `item def` · SysML v2 metaclass `ItemDefinition`

A class of things that can flow, be stored, or be handled: material, energy, data, a document, a person as a payload. Not a structural component.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another item definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is a structural component with ports and parts. An item definition is what moves between or through parts.

## Example

```sysml
item def Current;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
