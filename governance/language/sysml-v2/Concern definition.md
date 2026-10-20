---
type: Language Element
id: concern-def
kind: definition
keyword: "concern def"
metaclass: ConcernDefinition
usage: occasional
status: Draft
---
# Concern definition

**Definition** · **Occasional** · `concern def` · SysML v2 metaclass `ConcernDefinition`

A definition of a stakeholder interest that views and requirements address (cost, safety, serviceability).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another concern definition (specialization, `:>`)

## What separates it from [[Requirement definition]]

A requirement states what must hold. A concern states what someone cares about, before it is turned into requirements.

## Example

```sysml
concern def Serviceability;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
