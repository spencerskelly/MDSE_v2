---
type: Language Element
id: view-usage
category: language
kind: usage
keyword: "view name : Type"
metaclass: "ViewUsage"
usage: occasional
status: Draft
---
# View usage

**Language construct** · **Usage** · **Occasional** · `view name : Type` · SysML v2 metaclass `ViewUsage`

A use of a view that exposes elements and renders them (`view v { expose Charger::*; render asTreeDiagram; }`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- view definitions (`:`), or other view usages it subsets (`:>`)

## What separates it from [[Viewpoint usage]]

A view usage selects and renders content. A viewpoint usage states the stakeholder need that the view answers.

## Example

```sysml
view powerView : PowerView;
```

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
