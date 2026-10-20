---
type: Language Element
id: analysis-def
kind: definition
keyword: "analysis def"
metaclass: AnalysisCaseDefinition
usage: occasional
status: Draft
---
# Analysis case definition

**Definition** · **Occasional** · `analysis def` · SysML v2 metaclass `AnalysisCaseDefinition`

A definition of an analysis that computes results about a subject for an objective (trade study, thermal analysis).

## Can be declared in

- a package
- a library package
- another definition's body (nested definition, rare)

## Can specialize, be typed by, or refer to

- another analysis case definition (specialization, `:>`)

## What separates it from [[Verification case definition]]

A verification case checks a requirement against a subject and produces a verdict. An analysis case computes values and need not judge anything.

## Example

```sysml
analysis def ThermalAnalysis;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
