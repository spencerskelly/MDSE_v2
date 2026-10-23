---
type: Language Element
id: part-def
category: language
kind: definition
keyword: "part def"
metaclass: "PartDefinition"
usage: core
status: Draft
---
# Part definition

**Language construct** · **Definition** · **Everyday** · `part def` · SysML v2 metaclass `PartDefinition`

A class of physical or logical system components that has identity and structure and can own parts, ports and behaviour. Use it for anything you would draw as a block.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another part definition (specialization, `:>`)

## What separates it from [[Item definition]]

An item can be a thing that flows or is carried (material, energy, data) but is not a structural component of the system; a part is the thing that is assembled and decomposed.

## Example

```sysml
part def Charger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
