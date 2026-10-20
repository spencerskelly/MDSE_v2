---
type: Language Element
id: assert-constraint-usage
kind: usage
keyword: "assert constraint c { }"
metaclass: AssertConstraintUsage
usage: occasional
status: Draft
---
# Assert constraint

**Usage** · **Occasional** · `assert constraint c { }` · SysML v2 metaclass `AssertConstraintUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
