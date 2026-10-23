---
type: Language Element
id: flow-usage
category: language
kind: relationship
keyword: "flow of P from a to b;"
metaclass: "FlowUsage"
usage: common
status: Draft
---
# Flow

**Language construct** · **Relationship** · **Common** · `flow of P from a to b;` · SysML v2 metaclass `FlowUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
