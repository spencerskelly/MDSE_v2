---
type: Language Element
id: calc-def
category: language
kind: definition
keyword: "calc def"
metaclass: "CalculationDefinition"
usage: common
status: Draft
---
# Calculation definition

**Language construct** · **Definition** · **Common** · `calc def` · SysML v2 metaclass `CalculationDefinition`

A definition of a computation that takes inputs and returns a value (a function in the mathematical sense).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another calculation definition (specialization, `:>`)

## What separates it from [[Constraint definition]]

A constraint definition yields true or false. A calculation definition yields any value.

## Example

```sysml
calc def Power { in v; in i; return v*i; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
