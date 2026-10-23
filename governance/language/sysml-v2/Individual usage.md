---
type: Language Element
id: individual-usage
category: language
kind: usage
keyword: "individual name : Type"
metaclass: "OccurrenceUsage (isIndividual = true)"
usage: rare
status: Draft
---
# Individual usage

**Language construct** · **Usage** · **Rare** · `individual name : Type` · SysML v2 metaclass `OccurrenceUsage (isIndividual = true)`

A usage that refers to one individual over its life; combine with `snapshot` and `timeslice` for states in time.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- individual definitions (`:`), or other individual usages it subsets (`:>`)

## What separates it from [[Part usage]]

Use an individual only when one concrete thing matters (a test article); otherwise model the class.

## Example

```sysml
individual part unit1 : TestUnit001;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
