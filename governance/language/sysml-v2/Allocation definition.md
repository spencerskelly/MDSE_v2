---
type: Language Element
id: allocation-def
kind: definition
keyword: "allocation def"
metaclass: AllocationDefinition
usage: core
status: Draft
---
# Allocation definition

**Definition** · **Everyday** · `allocation def` · SysML v2 metaclass `AllocationDefinition`

A definition of an allocation relationship between a source and a target, for example logical to physical, or function to component.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another allocation definition (specialization, `:>`)

## What separates it from [[Satisfy]]

Satisfy says a design element meets a requirement. Allocate maps any element (function, requirement, part) onto another and carries no obligation to prove it.

## Example

```sysml
allocation def LogicalToPhysical;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
