---
type: Language Element
id: view-def
kind: definition
keyword: "view def"
metaclass: ViewDefinition
usage: occasional
status: Draft
---
# View definition

**Definition** · **Occasional** · `view def` · SysML v2 metaclass `ViewDefinition`

A definition of a rendered selection of model content that answers a viewpoint.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another view definition (specialization, `:>`)

## What separates it from [[Viewpoint definition]]

A viewpoint definition says what view is needed and for whom. A view definition is the thing that shows it.

## Example

```sysml
view def PowerView;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
