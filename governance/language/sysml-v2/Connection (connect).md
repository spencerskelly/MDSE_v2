---
type: Language Element
id: connection-usage
category: language
kind: relationship
keyword: "connect a to b;"
metaclass: "ConnectionUsage"
usage: common
status: Draft
---
# Connection (connect)

**Language construct** · **Relationship** · **Common** · `connect a to b;` · SysML v2 metaclass `ConnectionUsage`

A particular link between the features of a context, optionally typed by a connection definition (`connect a to b`).

## Eligible from (source)

- any feature (end 1)

## Eligible to (target)

- any feature (end 2 and more)

## What separates it from [[Interface usage]]

An interface usage connects ports. A connection usage connects any features.

## Example

```sysml
connect controller.out to module.in;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
