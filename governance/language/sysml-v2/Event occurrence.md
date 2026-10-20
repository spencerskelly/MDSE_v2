---
type: Language Element
id: event-occurrence-usage
kind: usage
keyword: "event occurrence e;  event a.b;"
metaclass: EventOccurrenceUsage
usage: occasional
status: Draft
---
# Event occurrence

**Usage** · **Occasional** · `event occurrence e;  event a.b;` · SysML v2 metaclass `EventOccurrenceUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
