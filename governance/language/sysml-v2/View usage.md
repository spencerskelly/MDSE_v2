---
type: Language Element
id: view-usage
kind: usage
keyword: "view name : Type"
metaclass: ViewUsage
usage: occasional
status: Draft
---
# View usage

**Usage** · **Occasional** · `view name : Type` · SysML v2 metaclass `ViewUsage`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
