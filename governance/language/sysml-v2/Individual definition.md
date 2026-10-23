---
type: Language Element
id: individual-def
category: language
kind: definition
keyword: "individual def"
metaclass: "OccurrenceDefinition (isIndividual = true)"
usage: rare
status: Draft
---
# Individual definition

**Language construct** · **Definition** · **Rare** · `individual def` · SysML v2 metaclass `OccurrenceDefinition (isIndividual = true)`

A definition of a single, particular thing (this serial number, this vehicle) rather than a class. `individual` is a prefix on an occurrence-type definition, so `individual def X` and `individual part def X` are both written; the result is an occurrence definition limited to one instance.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another individual definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is a class of things. An individual definition is one particular thing.

## Example

```sysml
individual def TestUnit001;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
