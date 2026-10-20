---
type: Language Element
id: occurrence-def
kind: definition
keyword: "occurrence def"
metaclass: OccurrenceDefinition
usage: rare
status: Draft
---
# Occurrence definition

**Definition** · **Rare** · `occurrence def` · SysML v2 metaclass `OccurrenceDefinition`

A definition of anything that exists over time and can have a start and end. Part, item and action definitions are all kinds of occurrence.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another occurrence definition (specialization, `:>`)

## What separates it from [[Part definition]]

A part definition is an occurrence that is also a structural component. A plain occurrence has time extent only.

## Example

```sysml
occurrence def Charge;
```

## In MDSE

- **Importer:** Yes. The importer writes it (seen in its output on the synthetic model).
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
