---
type: Language Element
id: interface-usage
category: language
kind: relationship
keyword: "interface : Def connect a to b;"
metaclass: "InterfaceUsage"
usage: common
status: Draft
---
# Interface usage

**Language construct** · **Relationship** · **Common** · `interface : Def connect a to b;` · SysML v2 metaclass `InterfaceUsage`

A use of an interface definition connecting two ports: `interface : PowerInterface connect charger.out to vehicle.in;`

## Eligible from (source)

- a port (end 1)

## Eligible to (target)

- a port (end 2)

## What separates it from [[Connection (connect)]]

An interface usage is a connection restricted to ports and typed by an interface definition.

## Example

```sysml
interface : PowerInterface connect charger.out to vehicle.in;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
