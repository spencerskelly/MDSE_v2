---
type: Language Element
id: timeslice-usage
kind: usage
keyword: "timeslice name : Type;"
metaclass: OccurrenceUsage
usage: rare
status: Draft
---
# Timeslice

**Usage** · **Rare** · `timeslice name : Type;` · SysML v2 metaclass `OccurrenceUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
