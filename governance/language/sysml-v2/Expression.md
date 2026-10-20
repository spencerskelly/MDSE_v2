---
type: Language Element
id: expression
kind: structure
keyword: "a + b;  v <= 480 [V];  x.y.z;  x ? a : b"
metaclass: Expression
usage: core
status: Draft
---
# Expression

**Structure** · **Everyday** · `a + b;  v <= 480 [V];  x.y.z;  x ? a : b` · SysML v2 metaclass `Expression`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
