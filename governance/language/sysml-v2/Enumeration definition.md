---
type: Language Element
id: enum-def
kind: definition
keyword: "enum def"
metaclass: EnumerationDefinition
usage: common
status: Draft
---
# Enumeration definition

**Definition** · **Common** · `enum def` · SysML v2 metaclass `EnumerationDefinition`

A definition of a closed set of named values.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another enumeration definition (specialization, `:>`)

## What separates it from [[Attribute definition]]

An attribute definition allows any value of its type. An enumeration allows only its named values.

## Example

```sysml
enum def Mode { enum on; enum off; }
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Common.
