---
type: Language Element
id: individual-def
kind: definition
keyword: "individual def"
metaclass: IndividualDefinition
usage: rare
status: Draft
---
# Individual definition

**Definition** · **Rare** · `individual def` · SysML v2 metaclass `IndividualDefinition`

A definition of a single, particular thing (this serial number, this vehicle) rather than a class.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another individual definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is a class of things. An individual definition is one particular thing.

## Example

```sysml
individual def TestUnit001;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
