---
type: Language Element
id: analysis-usage
category: language
kind: usage
keyword: "analysis name : Type"
metaclass: "AnalysisCaseUsage"
usage: occasional
status: Draft
---
# Analysis case usage

**Language construct** · **Usage** · **Occasional** · `analysis name : Type` · SysML v2 metaclass `AnalysisCaseUsage`

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

## Support in MDSE

Four different things can be true of a construct. Only the first three are measured here.

- **Documented:** yes, this note.
- **Recognized:** yes. The Workbench scanner classifies it, and a test scans this note's example and requires no warnings. The scanner is a recognizer, not a parser.
- **Written by the importer:** No. The importer does not write it; engineers add it by hand or a later import step will.
- **Modeled in the Workbench:** Recognized and kept: the Workbench scanner classifies it and shows it in the SysML block; no relationship or view is drawn from it yet.
- **Accepted by a SysML v2 parser:** not established. The pinned parser (IMP-068) has not been run on this example, so treat the example as written from the specification, not as checked.
