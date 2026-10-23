---
type: Language Element
id: dependency
category: language
kind: relationship
keyword: "dependency from A to B"
metaclass: "Dependency"
usage: common
status: Draft
---
# Dependency

**Language construct** · **Relationship** · **Common** · `dependency from A to B` · SysML v2 metaclass `Dependency`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
