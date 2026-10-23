---
type: Language Element
id: assert-constraint-usage
category: language
kind: usage
keyword: "assert constraint c { }"
metaclass: "AssertConstraintUsage"
usage: occasional
status: Draft
---
# Assert constraint

**Language construct** · **Usage** · **Occasional** · `assert constraint c { }` · SysML v2 metaclass `AssertConstraintUsage`

States that a constraint holds (or, with `not`, does not hold) within the owner.

## Can be declared in

- a definition or usage body

## Can specialize, be typed by, or refer to

- a constraint definition or expression

## What separates it from [[Constraint usage]]

A plain constraint usage names a condition. An assertion makes the owner claim it.

## Example

```sysml
assert constraint c { v <= 480 }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
