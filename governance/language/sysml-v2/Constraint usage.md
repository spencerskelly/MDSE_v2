---
type: Language Element
id: constraint-usage
kind: usage
keyword: "constraint name : Type"
metaclass: ConstraintUsage
usage: common
status: Draft
---
# Constraint usage

**Usage** · **Common** · `constraint name : Type` · SysML v2 metaclass `ConstraintUsage`

A use of a constraint definition, or an inline condition, inside a definition or requirement.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- constraint definitions (`:`), or other constraint usages it subsets (`:>`)

## What separates it from [[Assert constraint]]

A constraint usage states a condition. An assert constraint usage asserts it must hold (or not, with `not`).

## Example

```sysml
constraint maxV : MaxVoltage;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
