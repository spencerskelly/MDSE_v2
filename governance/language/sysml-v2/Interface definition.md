---
type: Language Element
id: interface-def
kind: definition
keyword: "interface def"
metaclass: InterfaceDefinition
usage: common
status: Draft
---
# Interface definition

**Definition** · **Common** · `interface def` · SysML v2 metaclass `InterfaceDefinition`

A definition of a connection between ports that fixes what passes across it (the ends are port definitions).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another interface definition (specialization, `:>`)

## What separates it from [[Connection definition]]

An interface definition ends on ports and is about what crosses a boundary. A connection definition ends on any feature.

## Example

```sysml
interface def PowerInterface;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
