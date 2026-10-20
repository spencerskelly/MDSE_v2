---
type: Language Element
id: snapshot-usage
kind: usage
keyword: "snapshot name : Type;"
metaclass: OccurrenceUsage
usage: rare
status: Draft
---
# Snapshot

**Usage** · **Rare** · `snapshot name : Type;` · SysML v2 metaclass `OccurrenceUsage`

A part or occurrence frozen at one moment in time.

## Can be declared in

- an individual or occurrence body

## Can specialize, be typed by, or refer to

- an occurrence definition

## What separates it from [[Timeslice]]

A snapshot has no duration; a timeslice does.

## Example

```sysml
snapshot s : Charger;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
