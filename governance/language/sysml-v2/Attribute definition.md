---
type: Language Element
id: attribute-def
kind: definition
keyword: "attribute def"
metaclass: AttributeDefinition
usage: core
status: Draft
---
# Attribute definition

**Definition** · **Everyday** · `attribute def` · SysML v2 metaclass `AttributeDefinition`

A definition of a data type: a value with no identity (a number with unit, a record of fields, a quantity kind).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another attribute definition (specialization, `:>`)

## What separates it from [[Enumeration definition]]

An enumeration is a closed list of named values. An attribute definition is an open data type.

## Example

```sysml
attribute def PowerValue;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Everyday.
