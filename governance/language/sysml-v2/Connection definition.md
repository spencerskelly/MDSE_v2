---
type: Language Element
id: connection-def
kind: definition
keyword: "connection def"
metaclass: ConnectionDefinition
usage: common
status: Draft
---
# Connection definition

**Definition** · **Common** · `connection def` · SysML v2 metaclass `ConnectionDefinition`

A definition of a relationship between parts that has its own properties or structure, with two or more ends.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another connection definition (specialization, `:>`)

## What separates it from [[Interface definition]]

An interface definition constrains connections between ports. A connection definition is a link between any features, with no port requirement.

## Example

```sysml
connection def CableLink;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
