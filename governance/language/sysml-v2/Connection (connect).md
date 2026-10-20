---
type: Language Element
id: connection-usage
kind: relationship
keyword: "connect a to b;"
metaclass: ConnectionUsage
usage: common
status: Draft
---
# Connection (connect)

**Relationship** · **Common** · `connect a to b;` · SysML v2 metaclass `ConnectionUsage`

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

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized, and drawn: it becomes a relationship or view in the Workbench.
- **Everyday use:** Common.
