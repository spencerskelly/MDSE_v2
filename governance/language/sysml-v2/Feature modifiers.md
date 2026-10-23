---
type: Language Element
id: modifiers
category: language
kind: structure
keyword: "abstract | variation | ref | readonly | derived | end | constant | ordered | nonunique"
metaclass: "Feature"
usage: common
status: Draft
---
# Feature modifiers

**Language construct** · **Structure** · **Common** · `abstract | variation | ref | readonly | derived | end | constant | ordered | nonunique` · SysML v2 metaclass `Feature`

Prefix and suffix words that change how a definition or usage behaves: `abstract` (cannot be instantiated), `variation` (choose one variant), `ref` (reference only), `derived`, `ordered`, `nonunique`, `end` (a connection end).

## Can be declared in

- a definition or usage declaration

## Can specialize, be typed by, or refer to

- none

## What separates it from [[Multiplicity]]

Modifiers change kind and behaviour. Multiplicity changes how many.

## Example

```sysml
abstract part def Vehicle;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
