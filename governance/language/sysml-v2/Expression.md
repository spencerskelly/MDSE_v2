---
type: Language Element
id: expression
category: language
kind: structure
keyword: "a + b;  v <= 480 [V];  x.y.z;  x ? a : b"
metaclass: "Expression"
usage: core
status: Draft
---
# Expression

**Language construct** · **Structure** · **Everyday** · `a + b;  v <= 480 [V];  x.y.z;  x ? a : b` · SysML v2 metaclass `Expression`

Operators, feature chains and units that compute or compare values. They appear in constraints, calculations, values, guards and requirement conditions.

## Can be declared in

- a constraint, calc, value binding, guard or condition

## Can specialize, be typed by, or refer to

- features, literals with units, and other expressions

## What separates it from [[Value binding]]

An expression computes or tests. A value binding attaches the result to a usage.

## Example

```sysml
constraint c { v <= 480 [V] }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
