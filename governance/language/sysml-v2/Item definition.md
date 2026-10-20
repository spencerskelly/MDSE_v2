---
type: Language Element
id: item-def
kind: definition
keyword: "item def"
metaclass: ItemDefinition
usage: common
status: Draft
---
# Item definition

**Definition** · **Common** · `item def` · SysML v2 metaclass `ItemDefinition`

A class of things that can flow, be stored, or be handled: material, energy, data, a document, a person as a payload. Not a structural component.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another item definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is a structural component with ports and parts. An item definition is what moves between or through parts.

## Example

```sysml
item def Current;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
