---
type: Language Element
id: interface-usage
kind: relationship
keyword: "interface : Def connect a to b;"
metaclass: InterfaceUsage
usage: common
status: Draft
---
# Interface usage

**Relationship** · **Common** · `interface : Def connect a to b;` · SysML v2 metaclass `InterfaceUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
