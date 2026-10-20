---
type: Language Element
id: rendering-def
kind: definition
keyword: "rendering def"
metaclass: RenderingDefinition
usage: rare
status: Draft
---
# Rendering definition

**Definition** · **Rare** · `rendering def` · SysML v2 metaclass `RenderingDefinition`

A definition of how a view's content is presented (tree, table, diagram).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another rendering definition (specialization, `:>`)

## What separates it from [[View definition]]

A view selects content. A rendering decides how it looks.

## Example

```sysml
rendering def AsTable;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
