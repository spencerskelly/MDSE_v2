---
type: Language Element
id: constraint-def
category: language
kind: definition
keyword: "constraint def"
metaclass: "ConstraintDefinition"
usage: common
status: Draft
---
# Constraint definition

**Language construct** · **Definition** · **Common** · `constraint def` · SysML v2 metaclass `ConstraintDefinition`

A definition of a Boolean condition over features: it holds or does not (`voltage <= 480 [V]`).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another constraint definition (specialization, `:>`)

## What separates it from [[Calculation definition]]

A calculation definition returns a value. A constraint definition returns true or false.

## Example

```sysml
constraint def MaxVoltage { in v; v <= 480 [V] }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
