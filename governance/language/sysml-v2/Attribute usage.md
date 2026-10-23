---
type: Language Element
id: attribute-usage
category: language
kind: usage
keyword: "attribute name : Type"
metaclass: "AttributeUsage"
usage: core
status: Draft
---
# Attribute usage

**Language construct** · **Usage** · **Everyday** · `attribute name : Type` · SysML v2 metaclass `AttributeUsage`

A named value held by a definition or usage, typed by an attribute definition (for example `ratedPower : PowerValue`).

## Can be declared in

- a definition body that allows this kind
- another usage body
- a package (as a top-level usage)

## Can specialize, be typed by, or refer to

- attribute definitions (`:`), or other attribute usages it subsets (`:>`)

## What separates it from [[Reference usage]]

An attribute usage is a value owned by its parent. A reference usage only points at something owned elsewhere.

## Example

```sysml
attribute ratedPower : PowerValue;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
