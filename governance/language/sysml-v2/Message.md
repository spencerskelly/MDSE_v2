---
type: Language Element
id: message
category: language
kind: relationship
keyword: "message m of P from a to b;"
metaclass: "FlowUsage"
usage: occasional
status: Draft
---
# Message

**Language construct** · **Relationship** · **Occasional** · `message m of P from a to b;` · SysML v2 metaclass `FlowUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
