---
type: Language Element
id: expose
kind: relationship
keyword: "expose Pkg::**;"
metaclass: Expose
usage: occasional
status: Draft
---
# Expose

**Relationship** · **Occasional** · `expose Pkg::**;` · SysML v2 metaclass `Expose`

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

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
