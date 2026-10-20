---
type: Language Element
id: render
kind: statement
keyword: "render asTree;"
metaclass: ViewRenderingMembership
usage: rare
status: Draft
---
# Render

**Statement** · **Rare** · `render asTree;` · SysML v2 metaclass `ViewRenderingMembership`

Selects how a view is displayed.

## Eligible from (source)

- a view usage

## Eligible to (target)

- a rendering

## What separates it from [[Rendering usage]]

`render` is the statement inside a view; a rendering usage is the thing named.

## Example

```sysml
view v { render asTree; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
