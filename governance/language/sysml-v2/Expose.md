---
type: Language Element
id: expose
category: language
kind: relationship
keyword: "expose Pkg::**;"
metaclass: "Expose"
usage: occasional
status: Draft
---
# Expose

**Language construct** · **Relationship** · **Occasional** · `expose Pkg::**;` · SysML v2 metaclass `Expose`

Names the model content a view shows.

## Eligible from (source)

- a view usage

## Eligible to (target)

- a namespace or element

## What separates it from [[Filter]]

Expose selects what a view displays; a filter narrows an import or package.

## Example

```sysml
view v { expose Charging::*; }
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
