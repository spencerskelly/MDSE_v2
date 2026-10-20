---
type: Language Element
id: constraint-def
kind: definition
keyword: "constraint def"
metaclass: ConstraintDefinition
usage: common
status: Draft
---
# Constraint definition

**Definition** · **Common** · `constraint def` · SysML v2 metaclass `ConstraintDefinition`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
