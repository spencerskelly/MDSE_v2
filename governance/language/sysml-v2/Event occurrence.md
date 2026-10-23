---
type: Language Element
id: event-occurrence-usage
category: language
kind: usage
keyword: "event occurrence e;  event a.b;"
metaclass: "EventOccurrenceUsage"
usage: occasional
status: Draft
---
# Event occurrence

**Language construct** · **Usage** · **Occasional** · `event occurrence e;  event a.b;` · SysML v2 metaclass `EventOccurrenceUsage`

Marks an occurrence that happens at a point in time within a context, such as a message being received. It can reference an existing occurrence.

## Can be declared in

- an occurrence, part, state or action body

## Can specialize, be typed by, or refer to

- an occurrence

## What separates it from [[Snapshot]]

An event is a moment; a snapshot is the state of a thing at a moment.

## Example

```sysml
event occurrence started;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
