---
type: Language Element
id: analysis-usage
kind: usage
keyword: "analysis name : Type"
metaclass: AnalysisCaseUsage
usage: occasional
status: Draft
---
# Analysis case usage

**Usage** · **Occasional** · `analysis name : Type` · SysML v2 metaclass `AnalysisCaseUsage`

A use of an analysis case with its subject and result.

## Can be declared in

- a definition body that allows this kind
- another usage body

## Can specialize, be typed by, or refer to

- analysis case definitions (`:`), or other analysis case usages it subsets (`:>`)

## What separates it from [[Verification case usage]]

An analysis usage computes. A verification usage decides pass or fail against requirements.

## Example

```sysml
analysis thermal : ThermalAnalysis;
```

## In MDSE

- **Importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Everyday use:** Occasional.
