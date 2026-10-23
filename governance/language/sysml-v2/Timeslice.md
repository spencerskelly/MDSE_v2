---
type: Language Element
id: timeslice-usage
category: language
kind: usage
keyword: "timeslice name : Type;"
metaclass: "OccurrenceUsage"
usage: rare
status: Draft
---
# Timeslice

**Language construct** · **Usage** · **Rare** · `timeslice name : Type;` · SysML v2 metaclass `OccurrenceUsage`

A part or occurrence over a span of its life, such as the time a charger is in service.

## Can be declared in

- an individual or occurrence body

## Can specialize, be typed by, or refer to

- an occurrence definition

## What separates it from [[Snapshot]]

A timeslice has duration; a snapshot is one instant.

## Example

```sysml
timeslice inService : Charger;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
