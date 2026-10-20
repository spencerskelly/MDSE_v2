---
type: Language Element
id: metadata-def
kind: definition
keyword: "metadata def"
metaclass: MetadataDefinition
usage: occasional
status: Draft
---
# Metadata definition

**Definition** · **Occasional** · `metadata def` · SysML v2 metaclass `MetadataDefinition`

A definition of an annotation type attached to elements (a tag with typed fields such as `Safety`, `Approved`).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another metadata definition (specialization, `:>`)

## What separates it from [[Attribute definition]]

An attribute definition describes data inside the model. A metadata definition describes data about model elements and can be applied to them.

## Example

```sysml
metadata def Safety { attribute level : Integer; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
