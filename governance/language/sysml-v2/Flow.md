---
type: Language Element
id: flow-usage
kind: relationship
keyword: "flow of P from a to b;"
metaclass: FlowUsage
usage: common
status: Draft
---
# Flow

**Relationship** · **Common** · `flow of P from a to b;` · SysML v2 metaclass `FlowUsage`

A transfer of a payload from one feature to another (`flow of Current from a.out to b.in;`).

## Eligible from (source)

- a feature that outputs the payload

## Eligible to (target)

- a feature that inputs the payload

## What separates it from [[Succession flow]]

A flow transfers a payload and implies no order. A succession flow also fixes that the source finishes first.

## Example

```sysml
flow of Current from a.out to b.in;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
