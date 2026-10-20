---
type: Language Element
id: message
kind: relationship
keyword: "message m of P from a to b;"
metaclass: FlowUsage
usage: occasional
status: Draft
---
# Message

**Relationship** · **Occasional** · `message m of P from a to b;` · SysML v2 metaclass `FlowUsage`

A transfer of a payload shown between occurrences without saying which features carry it. Used in interaction (sequence) descriptions.

## Eligible from (source)

- an event occurrence (sender)

## Eligible to (target)

- an event occurrence (receiver)

## What separates it from [[Flow]]

A message is described between events in time. A flow is between features.

## Example

```sysml
message m of Request from a.send to b.receive;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
