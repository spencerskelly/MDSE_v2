---
type: Language Element
id: rendering-usage
kind: usage
keyword: "rendering name : Type"
metaclass: RenderingUsage
usage: rare
status: Draft
---
# Rendering usage

**Usage** · **Rare** · `rendering name : Type` · SysML v2 metaclass `RenderingUsage`

A use of a rendering inside a view (`render asTable;`).

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- rendering definitions (`:`), or other rendering usages it subsets (`:>`)

## What separates it from [[View usage]]

A view selects content; a rendering decides how that content looks.

## Example

```sysml
rendering r : AsTable;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
