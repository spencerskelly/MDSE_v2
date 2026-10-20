---
type: Language Element
id: allocation-usage
kind: relationship
keyword: "allocate a to b;"
metaclass: AllocationUsage
usage: core
status: Draft
---
# Allocation (allocate)

**Relationship** · **Everyday** · `allocate a to b;` · SysML v2 metaclass `AllocationUsage`

A statement that one element is allocated to another (`allocate a to b;`). Allocation says where something is done or realised; it does not say how.

## Eligible from (source)

- any definition or usage (source): a requirement, function, part

## Eligible to (target)

- any definition or usage (target)

## What separates it from [[Satisfy]]

Allocate maps any element onto any other and asserts nothing about meeting a need. Satisfy relates a design element to a requirement and says the need is met.

## Example

```sysml
allocate controlSoftware to ecu;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Everyday.
