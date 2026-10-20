---
type: Language Element
id: case-def
kind: definition
keyword: "case def"
metaclass: CaseDefinition
usage: rare
status: Draft
---
# Case definition

**Definition** · **Rare** · `case def` · SysML v2 metaclass `CaseDefinition`

A generic definition of an analysis, verification or use case that has a subject, objective and result. The specific kinds below are normally used instead.

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another case definition (specialization, `:>`)

## What separates it from [[Use case definition]]

A use case definition is a case about actors and a subject using a system. A plain case is the generic parent.

## Example

```sysml
case def GenericCase;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Rare.
