---
type: Language Element
id: send-action-usage
category: language
kind: statement
keyword: "send p via port;"
metaclass: "SendActionUsage"
usage: common
status: Draft
---
# Send

**Language construct** · **Statement** · **Common** · `send p via port;` · SysML v2 metaclass `SendActionUsage`

An action that sends a payload through a port or to a target.

## Eligible from (source)

- an action or state body

## Eligible to (target)

- a payload and a target

## What separates it from [[Accept]]

Send transmits; accept receives.

## Example

```sysml
action a { send s via out1; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
