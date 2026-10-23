---
type: Language Element
id: occurrence-def
category: language
kind: definition
keyword: "occurrence def"
metaclass: "OccurrenceDefinition"
usage: rare
status: Draft
---
# Occurrence definition

**Language construct** · **Definition** · **Rare** · `occurrence def` · SysML v2 metaclass `OccurrenceDefinition`

A definition of anything that exists over time and can have a start and end. Part, item and action definitions are all kinds of occurrence.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another occurrence definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is an occurrence that is also a structural component. A plain occurrence has time extent only.

## Example

```sysml
occurrence def Charge;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
