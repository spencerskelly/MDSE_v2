---
type: Language Element
id: accept-action-usage
category: language
kind: statement
keyword: "accept p : Payload;"
metaclass: "AcceptActionUsage"
usage: common
status: Draft
---
# Accept

**Language construct** · **Statement** · **Common** · `accept p : Payload;` · SysML v2 metaclass `AcceptActionUsage`

An action that waits to receive a payload (a signal, an item) and then proceeds.

## Eligible from (source)

- an action or state body

## Eligible to (target)

- a payload type

## What separates it from [[Send]]

Accept receives; send transmits.

## Example

```sysml
action a { accept s : Start; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
