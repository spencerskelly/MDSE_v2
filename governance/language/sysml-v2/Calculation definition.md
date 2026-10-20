---
type: Language Element
id: calc-def
kind: definition
keyword: "calc def"
metaclass: CalculationDefinition
usage: common
status: Draft
---
# Calculation definition

**Definition** · **Common** · `calc def` · SysML v2 metaclass `CalculationDefinition`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
