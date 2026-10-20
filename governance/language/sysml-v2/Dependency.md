---
type: Language Element
id: dependency
kind: relationship
keyword: "dependency from A to B"
metaclass: Dependency
usage: common
status: Draft
---
# Dependency

**Relationship** · **Common** · `dependency from A to B` · SysML v2 metaclass `Dependency`

A directed relationship stating that the client depends on the supplier, with no further semantics. Use it when no more specific relationship fits, and name the reason in a comment.

## Eligible from (source)

- any element (client, one or more)

## Eligible to (target)

- any element (supplier, one or more)

## What separates it from [[Allocation (allocate)]]

A dependency has no semantic and no structure. An allocation says one element is realised by another and is a typed mapping.

## Example

```sysml
dependency from Controller to PowerModule;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
