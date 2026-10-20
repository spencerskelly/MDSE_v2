---
type: Language Element
id: viewpoint-def
kind: definition
keyword: "viewpoint def"
metaclass: ViewpointDefinition
usage: occasional
status: Draft
---
# Viewpoint definition

**Definition** · **Occasional** · `viewpoint def` · SysML v2 metaclass `ViewpointDefinition`

A definition of the stakeholder concerns a view has to address.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another viewpoint definition (specialization, `:>`)

## What separates it from [[View definition]]

A viewpoint holds concerns. A view holds the content.

## Example

```sysml
viewpoint def SafetyViewpoint;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
