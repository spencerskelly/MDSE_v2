---
type: Language Element
id: analysis-def
category: language
kind: definition
keyword: "analysis def"
metaclass: "AnalysisCaseDefinition"
usage: occasional
status: Draft
---
# Analysis case definition

**Language construct** · **Definition** · **Occasional** · `analysis def` · SysML v2 metaclass `AnalysisCaseDefinition`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
