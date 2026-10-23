---
type: Language Element
id: allocation-usage
category: language
kind: relationship
keyword: "allocate a to b;"
metaclass: "AllocationUsage"
usage: core
status: Draft
---
# Allocation (allocate)

**Language construct** · **Relationship** · **Everyday** · `allocate a to b;` · SysML v2 metaclass `AllocationUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
