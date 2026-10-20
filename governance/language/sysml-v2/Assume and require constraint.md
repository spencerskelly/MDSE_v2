---
type: Language Element
id: require-constraint-usage
kind: usage
keyword: "assume constraint c { } / require constraint c { }"
metaclass: RequirementConstraintUsage
usage: common
status: Draft
---
# Assume and require constraint

**Usage** · **Common** · `assume constraint c { } / require constraint c { }` · SysML v2 metaclass `RequirementConstraintUsage`

The parts of a requirement: `assume` is what must hold for the requirement to apply, `require` is what the subject must meet.

## Can be declared in

- a requirement definition or usage

## Can specialize, be typed by, or refer to

- a constraint

## What separates it from [[Constraint usage]]

They live inside a requirement and have a role; a free constraint usage has none.

## Example

```sysml
requirement def R { require constraint { v <= 480 } }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
