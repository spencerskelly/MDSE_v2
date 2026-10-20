---
type: Language Element
id: part-def
kind: definition
keyword: "part def"
metaclass: PartDefinition
usage: core
status: Draft
---
# Part definition

**Definition** · **Everyday** · `part def` · SysML v2 metaclass `PartDefinition`

A class of physical or logical system components that has identity and structure and can own parts, ports and behaviour. Use it for anything you would draw as a block.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another part definition (specialization, `:>`)

## What separates it from [[Item definition]]

An item can be a thing that flows or is carried (material, energy, data) but is not a structural component of the system; a part is the thing that is assembled and decomposed.

## Example

```sysml
part def Charger;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
