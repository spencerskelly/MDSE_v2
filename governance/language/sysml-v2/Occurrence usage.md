---
type: Language Element
id: occurrence-usage
category: language
kind: usage
keyword: "occurrence name : Type"
metaclass: "OccurrenceUsage"
usage: rare
status: Draft
---
# Occurrence usage

**Language construct** · **Usage** · **Rare** · `occurrence name : Type` · SysML v2 metaclass `OccurrenceUsage`

A use of an occurrence definition. Prefix forms (`individual`, `snapshot`, `timeslice`) say which slice or particular it is.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- occurrence definitions (`:`), or other occurrence usages it subsets (`:>`)

## What separates it from [[Part usage]]

Use the specific usage (part, item, action) when one fits; a plain occurrence is the generic parent.

## Example

```sysml
occurrence charging : Charge;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
