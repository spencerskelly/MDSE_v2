---
type: Language Element
id: filter
category: language
kind: statement
keyword: "filter @Safety;"
metaclass: "ElementFilterMembership"
usage: rare
status: Draft
---
# Filter

**Language construct** · **Statement** · **Rare** · `filter @Safety;` · SysML v2 metaclass `ElementFilterMembership`

A Boolean condition on a package that limits which of its members an import or view sees (`filter @Safety;`).

## Eligible from (source)

- a package

## Eligible to (target)

- a Boolean expression, often a metadata test

## What separates it from [[Expose]]

A filter limits what is seen; expose names what a view shows.

## Example

```sysml
filter @Safety;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
